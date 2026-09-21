from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# asyncpg takes SSL configuration through connect_args; Neon URLs commonly
# include libpq-only query parameters such as sslmode=require.
base_url = settings.DATABASE_URL.split("?")[0]
DATABASE_URL = base_url.replace("postgres://", "postgresql://", 1)
DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"ssl": settings.DATABASE_SSL},
    pool_pre_ping=True,
    pool_recycle=300
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
