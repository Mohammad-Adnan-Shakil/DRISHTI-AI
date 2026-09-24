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
        # Patients columns
        await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent BOOLEAN DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS email VARCHAR;"))
        
        # Verify columns in screenings
        res = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'screenings' AND column_name IN ('email_status', 'email_sent_at');
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
