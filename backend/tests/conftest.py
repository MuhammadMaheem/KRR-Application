import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost/krrdb")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GROQ_API_KEY", "dummy-key-for-tests")
os.environ.setdefault("UPLOAD_DIR", "/tmp/krr_test_uploads")

from app.main import app
from app.database import Base, get_db

TEST_DB_URL = os.environ["DATABASE_URL"]

test_engine = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)


async def override_get_db():
    """Each call gets its own session — mirrors real app behaviour."""
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_client(client):
    """Returns (client, token) for an authenticated user."""
    email = "testuser@example.com"
    await client.post("/api/auth/register", json={"email": email, "password": "testpass123"})
    resp = await client.post("/api/auth/login", json={"email": email, "password": "testpass123"})
    token = resp.json()["token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client, token
