import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface MaterialRequest {
    moduleId: string;
    skillLevel?: 'beginner' | 'normal' | 'advanced';
    preference?: 'audio' | 'text';
}

/**
 * OPTIMIZED API - Fetches pre-generated content variants
 * No Gemini API calls at runtime!
 * 
 * skillLevel mapping:
 * - beginner → 'simple' variant
 * - normal → 'normal' variant  
 * - advanced → 'advanced' variant
 */
export async function POST(request: NextRequest) {
    try {
        const body: MaterialRequest = await request.json();
        const { moduleId, skillLevel = 'normal' } = body;

        if (!moduleId) {
            return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
        }

        // Map skill level to variant type
        const variantType = skillLevel === 'beginner' ? 'simple' : skillLevel;

        // Try to get pre-generated variant first
        const variantResult = await query(
            `SELECT id, title, content FROM content_variants 
             WHERE module_id = $1 AND variant_type = $2`,
            [moduleId, variantType]
        );

        if (variantResult.rows.length > 0) {
            const variant = variantResult.rows[0];
            return new Response(variant.content, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "X-Content-Source": "variant",
                    "X-Variant-Type": variantType,
                    "X-AI-Used": "false"
                },
            });
        }

        // Fallback to normal variant if requested variant not found
        if (variantType !== 'normal') {
            const fallbackResult = await query(
                `SELECT id, title, content FROM content_variants 
                 WHERE module_id = $1 AND variant_type = 'normal'`,
                [moduleId]
            );

            if (fallbackResult.rows.length > 0) {
                return new Response(fallbackResult.rows[0].content, {
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "X-Content-Source": "variant-fallback",
                        "X-Variant-Type": "normal",
                        "X-AI-Used": "false"
                    },
                });
            }
        }

        // Final fallback to raw math_content
        const rawResult = await query(
            `SELECT id, title, content FROM math_content 
             WHERE module_id = $1 LIMIT 1`,
            [moduleId]
        );

        if (rawResult.rows.length > 0) {
            const raw = rawResult.rows[0];
            return new Response(`## ${raw.title}\n\n${raw.content}`, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "X-Content-Source": "raw",
                    "X-AI-Used": "false"
                },
            });
        }

        // Fallback to parent module (for enrichment like bab3-1a → bab3-1)
        const parentModuleId = moduleId.replace(/[a-z]$/, ''); // Remove suffix letter
        if (parentModuleId !== moduleId) {
            const parentVariant = await query(
                `SELECT id, title, content FROM content_variants 
                 WHERE module_id = $1 AND variant_type = $2`,
                [parentModuleId, variantType]
            );

            if (parentVariant.rows.length > 0) {
                return new Response(
                    `## Materi Pengayaan\n\n*Berdasarkan materi ${parentModuleId}*\n\n---\n\n${parentVariant.rows[0].content}`,
                    {
                        headers: {
                            "Content-Type": "text/plain; charset=utf-8",
                            "X-Content-Source": "parent-variant",
                            "X-Variant-Type": variantType,
                            "X-AI-Used": "false"
                        },
                    }
                );
            }
        }

        // Ultimate fallback - generate placeholder
        return new Response(
            `## ${moduleId}\n\nMateri untuk modul ini sedang dalam pengembangan.\n\nSilakan kembali ke dashboard dan pilih modul lain.`,
            {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "X-Content-Source": "placeholder",
                    "X-AI-Used": "false"
                },
            }
        );

    } catch (error) {
        console.error("Material API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

// GET endpoint for fetching raw content
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const moduleId = searchParams.get('moduleId');
        const variantType = searchParams.get('variant') || 'normal';

        if (!moduleId) {
            return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
        }

        // Check available variants
        const variantsResult = await query(
            `SELECT variant_type, LENGTH(content) as length 
             FROM content_variants WHERE module_id = $1`,
            [moduleId]
        );

        const rawResult = await query(
            `SELECT title, content FROM math_content WHERE module_id = $1 LIMIT 1`,
            [moduleId]
        );

        return NextResponse.json({
            moduleId,
            availableVariants: variantsResult.rows.map(r => ({
                type: r.variant_type,
                contentLength: r.length
            })),
            rawContent: rawResult.rows[0] || null
        });
    } catch (error) {
        console.error("Material GET error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
