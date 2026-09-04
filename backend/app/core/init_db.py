import asyncio
from app.core.database import engine, Base
from app.models import patient, screening, referral  # import so Base knows the tables

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[DB] Tables created successfully")

if __name__ == "__main__":
    asyncio.run(init())