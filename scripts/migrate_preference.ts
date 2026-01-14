
import { query } from "../lib/db";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function migratePreference() {
    console.log("🚀 Starting preference system migration...");

    try {
        console.log("📦 Adding is_preference_set column to users...");
        await query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_preference_set BOOLEAN DEFAULT FALSE;
        `);

        // Optional: Update existing users to have is_preference_set = true if they already have a preference set?
        // But schema says default is 'text'. So we can't distinguish who set it vs default.
        // We'll leave it FALSE for everyone so they are forced to choose once.
        // Unless we want to be nice to existing users named 'Student'.

        // Let's set it to TRUE for the default seeded user 'Student' to avoid annoying dev flow
        await query(`
            UPDATE users 
            SET is_preference_set = TRUE 
            WHERE name = 'Student';
        `);

        console.log("✅ Migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    }
}

migratePreference();
