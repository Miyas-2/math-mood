"""
Generate Content Variants Script
Creates 3 versions (simple/normal/advanced) per module using Gemini 2.5 API
Run once during setup, not at runtime

Requirements:
    pip install google-genai psycopg2-binary python-dotenv

Usage:
    python scripts/generate_variants.py
"""

import os
import time
from pathlib import Path
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv('.env.local')

from google import genai

# Configure Gemini client
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', '5432'),
        database=os.getenv('POSTGRES_DB', 'mathtutor'),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', '')
    )


# Prompts for each variant type
PROMPTS = {
    'simple': """
Kamu adalah tutor matematika untuk siswa SMP yang kesulitan belajar.
Ubah materi berikut menjadi penjelasan yang SANGAT SEDERHANA:

MATERI ASLI:
{content}

ATURAN:
1. Gunakan bahasa yang sangat sederhana dan mudah dipahami anak SMP
2. Jelaskan step-by-step dengan detail
3. Gunakan analogi kehidupan sehari-hari
4. Berikan contoh soal yang mudah
5. Hindari istilah teknis yang rumit
6. Gunakan format yang rapi dengan heading dan bullet points
7. Tambahkan emoji untuk membuat lebih menarik

FORMAT OUTPUT:
## [Judul Materi]

[Penjelasan sederhana dengan analogi]

### Langkah-langkah:
1. [Langkah 1 dengan penjelasan detail]
2. [Langkah 2]
...

### Contoh Mudah:
[Contoh soal sederhana dengan penyelesaian lengkap]

### Ingat! 💡
[Tips singkat yang mudah diingat]
""",

    'normal': """
Kamu adalah tutor matematika untuk siswa SMP.
Ubah materi berikut menjadi penjelasan yang TERSTRUKTUR dan JELAS:

MATERI ASLI:
{content}

ATURAN:
1. Jelaskan konsep dengan jelas dan terstruktur
2. Berikan rumus-rumus penting dengan penjelasan
3. Sertakan 2 contoh soal dengan tingkat kesulitan berbeda
4. Gunakan format markdown yang rapi
5. Gunakan notasi matematika yang benar (LaTeX format dengan $$ untuk block)

FORMAT OUTPUT:
## [Judul Materi]

### Konsep Dasar
[Penjelasan konsep]

### Rumus Penting
$$[rumus dalam LaTeX]$$
Keterangan: [penjelasan variabel]

### Contoh Soal 1 (Mudah)
[Soal dan penyelesaian]

### Contoh Soal 2 (Sedang)
[Soal dan penyelesaian]

### Ringkasan
[Poin-poin penting]
""",

    'advanced': """
Kamu adalah tutor matematika untuk siswa SMP yang sudah mahir.
Ubah materi berikut menjadi penjelasan yang RINGKAS dan MENANTANG:

MATERI ASLI:
{content}

ATURAN:
1. Langsung ke inti materi tanpa bertele-tele
2. Fokus pada konsep lanjutan dan aplikasi
3. Berikan soal-soal yang menantang
4. Hubungkan dengan materi yang lebih advanced
5. Gunakan notasi matematika formal (LaTeX dengan $$)

FORMAT OUTPUT:
## [Judul Materi]

### Konsep Kunci
[Penjelasan singkat dan padat]

### Rumus
$$[rumus dalam LaTeX]$$

### Soal Tantangan
1. [Soal tingkat sulit]
2. [Soal tingkat sulit]

### Untuk Eksplorasi Lebih Lanjut
[Hint tentang konsep related yang lebih advanced]
"""
}


def generate_variant(content: str, title: str, variant_type: str, retries: int = 3) -> str:
    """Generate a content variant using Gemini 2.5 Flash Lite API (cost efficient)"""
    prompt = PROMPTS[variant_type].format(content=content)
    
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash-lite',  # Cheaper model
                contents=prompt
            )
            return response.text
        except Exception as e:
            error_msg = str(e)
            if '429' in error_msg or 'quota' in error_msg.lower():
                wait_time = (attempt + 1) * 10  # Exponential backoff
                print(f"  ⏳ Rate limited, waiting {wait_time}s...", end=' ', flush=True)
                time.sleep(wait_time)
            else:
                print(f"  ⚠️ Error generating {variant_type}: {e}")
                return None
    
    print(f"  ❌ Failed after {retries} retries")
    return None


def main():
    print("🚀 Starting content variant generation with Gemini 2.5...")
    print("⚠️  This will use Gemini API and may take a while.\n")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check existing variants
    cur.execute("SELECT COUNT(*) FROM content_variants")
    existing_count = cur.fetchone()[0]
    if existing_count > 0:
        print(f"⚠️  Found {existing_count} existing variants.")
        response = input("Delete and regenerate? (y/n): ")
        if response.lower() == 'y':
            cur.execute("DELETE FROM content_variants")
            conn.commit()
            print("🧹 Cleared existing variants.\n")
        else:
            print("Skipping existing modules...\n")
    
    # Get all content from math_content
    cur.execute("""
        SELECT module_id, title, content 
        FROM math_content 
        ORDER BY module_id
    """)
    contents = cur.fetchall()
    
    print(f"📚 Found {len(contents)} modules to process.\n")
    
    total_variants = 0
    
    for module_id, title, content in contents:
        print(f"📖 Processing: {title} ({module_id})")
        
        # Check if variants already exist
        cur.execute(
            "SELECT COUNT(*) FROM content_variants WHERE module_id = %s",
            (module_id,)
        )
        if cur.fetchone()[0] > 0:
            print("  ⏭️  Skipping (variants exist)")
            continue
        
        for variant_type in ['simple', 'normal', 'advanced']:
            print(f"  🔄 Generating {variant_type}...", end=' ', flush=True)
            
            variant_content = generate_variant(content, title, variant_type)
            
            if variant_content:
                cur.execute("""
                    INSERT INTO content_variants (module_id, variant_type, title, content)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (module_id, variant_type) DO UPDATE
                    SET content = EXCLUDED.content, title = EXCLUDED.title
                """, (module_id, variant_type, title, variant_content))
                conn.commit()
                print(f"✅ ({len(variant_content)} chars)")
                total_variants += 1
            else:
                print("❌ Failed")
            
            # Rate limit - wait between requests
            time.sleep(0.5)
        
        print()
    
    cur.close()
    conn.close()
    
    print(f"\n🎉 Done! Generated {total_variants} content variants.")


if __name__ == '__main__':
    main()
