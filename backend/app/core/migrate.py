import asyncio
from sqlalchemy import text
from app.core.database import engine
from app.core.logging_config import logger

async def run_migrations():
    logger.info("Running database migrations...")
    async with engine.begin() as conn:
        # Screenings columns
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS email_status VARCHAR;"))
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;"))
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS microaneurysm_count INTEGER DEFAULT 0;"))
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS microaneurysm_url VARCHAR;"))
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS exudate_area_percent FLOAT DEFAULT 0.0;"))
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS exudate_url VARCHAR;"))
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS hemorrhage_count INTEGER DEFAULT 0;"))
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS hemorrhage_url VARCHAR;"))
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS optic_disc_center JSON;"))
        await conn.execute(text("ALTER TABLE screenings ADD COLUMN IF NOT EXISTS optic_disc_url VARCHAR;"))
        # Patients columns
        await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent BOOLEAN DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS email VARCHAR;"))
        
        # Verify columns in screenings
        res = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'screenings' AND column_name IN ('email_status', 'email_sent_at', 'microaneurysm_count', 'exudate_area_percent', 'hemorrhage_count');
        """))
        screenings_cols = res.fetchall()
        logger.info(f"Screenings migrated columns: {screenings_cols}")

        # Verify columns in patients
        res = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'patients' AND column_name IN ('consent');
        """))
        patients_cols = res.fetchall()
        logger.info(f"Patients migrated columns: {patients_cols}")
    print("[MIGRATION] Migration completed successfully.")

if __name__ == "__main__":
    asyncio.run(run_migrations())
