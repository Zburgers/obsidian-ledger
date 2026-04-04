import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db.session import engine, async_session
from app.db.base import Base
from app.models.user import User, UserRole


@pytest_asyncio.fixture
async def client():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def admin_token(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "admin@test.com", "password": "Admin123!", "name": "Admin"},
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "admin@test.com", "password": "Admin123!"}
    )
    data = resp.json()
    return data["access_token"]


@pytest_asyncio.fixture
async def viewer_token(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "viewer@test.com", "password": "Viewer123!", "name": "Viewer"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "viewer@test.com", "password": "Viewer123!"},
    )
    data = resp.json()
    return data["access_token"]


@pytest.mark.asyncio
async def test_register_creates_viewer(client):
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@test.com",
            "password": "SecurePass1!",
            "name": "New User",
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "newuser@test.com"
    assert body["role"] == "viewer"


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_400(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "dup@test.com", "password": "SecurePass1!", "name": "Dup"},
    )
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "dup@test.com", "password": "SecurePass1!", "name": "Dup2"},
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_login_returns_access_and_refresh(client):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@test.com",
            "password": "SecurePass1!",
            "name": "Login",
        },
    )
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@test.com", "password": "SecurePass1!"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_refresh_returns_new_access(client, viewer_token):
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "refreshuser@test.com",
            "password": "SecurePass1!",
            "name": "Refresh",
        },
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "refreshuser@test.com", "password": "SecurePass1!"},
    )
    refresh_token = login_resp.json()["refresh_token"]
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_me_returns_current_user(client, viewer_token):
    r = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "viewer@test.com"


@pytest.mark.asyncio
async def test_me_unauthenticated_returns_401(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401
