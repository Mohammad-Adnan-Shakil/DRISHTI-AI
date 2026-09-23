from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

limiter = Limiter(key_func=get_remote_address)

from app.core.database import get_db

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "drishti-sih-2026-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
router = APIRouter()

# Fallback demo users if DB lookup fails
DEMO_USERS = {
    "asha_worker": {
        "username": "asha_worker",
        "password_hash": pwd_context.hash("drishti123"),
        "role": "health_worker",
        "name": "Kavya N.",
        "phc_id": "PHC Hosakote"
    },
    "dr_sharma": {
        "username": "dr_sharma",
        "password_hash": pwd_context.hash("drishti123"),
        "role": "doctor",
        "name": "Dr. Arjun Sharma",
        "phc_id": "PHC Hosakote"
    },
    "admin": {
        "username": "admin",
        "password_hash": pwd_context.hash("drishti123"),
        "role": "admin",
        "name": "Admin User",
        "phc_id": "District HQ"
    },
}


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    phc_id: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        return TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception


def require_role(*roles):
    def checker(token_data: TokenData = Depends(verify_token)):
        if token_data.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(roles)}"
            )
        return token_data
    return checker


async def create_users_table(db: AsyncSession):
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            name VARCHAR(200) NOT NULL,
            phc_id VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW()
        )
    """))
    await db.commit()

    # Seed demo users if table is empty
    result = await db.execute(text("SELECT COUNT(*) FROM users"))
    count = result.scalar()
    if count == 0:
        for user in DEMO_USERS.values():
            await db.execute(text("""
                INSERT INTO users (username, password_hash, role, name, phc_id)
                VALUES (:username, :password_hash, :role, :name, :phc_id)
                ON CONFLICT (username) DO NOTHING
            """), user)
        await db.commit()


@router.post("/auth/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Ensure users table exists
    await create_users_table(db)

    # Try DB lookup first
    try:
        result = await db.execute(
            text("SELECT * FROM users WHERE username = :username"),
            {"username": form_data.username}
        )
        user_row = result.mappings().first()

        if user_row and pwd_context.verify(form_data.password, user_row["password_hash"]):
            access_token = create_access_token(
                data={"sub": user_row["username"], "role": user_row["role"]},
                expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "role": user_row["role"],
                "name": user_row["name"],
                "phc_id": user_row["phc_id"] or "PHC Hosakote"
            }
    except Exception as e:
        # DB unavailable — fall back to demo users
        print(f"DB login failed, using fallback: {e}")
        demo_user = DEMO_USERS.get(form_data.username)
        if demo_user and pwd_context.verify(form_data.password, demo_user["password_hash"]):
            access_token = create_access_token(
                data={"sub": demo_user["username"], "role": demo_user["role"]},
                expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "role": demo_user["role"],
                "name": demo_user["name"],
                "phc_id": demo_user["phc_id"]
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )