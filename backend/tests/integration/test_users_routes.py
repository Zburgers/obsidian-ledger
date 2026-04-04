import uuid

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole


@pytest_asyncio.fixture
async def admin_token(client, db_engine):
    admin_id = uuid.uuid4()
    admin_user = User(
        id=admin_id,
        email="admin-users@test.com",
        hashed_password=hash_password("Admin123!"),
        name="Admin",
        role=UserRole.admin,
    )

    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        db.add(admin_user)
        await db.commit()

    return create_access_token({"sub": str(admin_id)}), str(admin_id)


@pytest_asyncio.fixture
async def viewer_token(client):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "viewer-users@test.com",
            "password": "Viewer123!",
            "name": "Viewer",
        },
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "viewer-users@test.com", "password": "Viewer123!"},
    )
    return login_resp.json()["access_token"]


@pytest_asyncio.fixture
async def analyst_token(client, db_engine):
    email = "analyst-users@test.com"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Analyst123!", "name": "Analyst"},
    )

    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == email))
        analyst = result.scalar_one()
        analyst.role = UserRole.analyst
        await db.commit()

    login_resp = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "Analyst123!"}
    )
    return login_resp.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_can_list_users(client, admin_token):
    token, _ = admin_token
    r = await client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert "items" in body
    assert "total" in body


@pytest.mark.asyncio
async def test_unauthenticated_user_cannot_access_users_list(client):
    r = await client.get("/api/v1/users")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_viewer_gets_403_on_users_list(client, viewer_token):
    r = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_analyst_gets_403_on_users_list(client, analyst_token):
    r = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {analyst_token}"}
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_create_user(client, admin_token):
    token, _ = admin_token
    r = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "newuser@test.com",
            "password": "SecurePass1!",
            "name": "New User",
            "role": "analyst",
        },
    )
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_admin_can_update_user(client, admin_token):
    token, _ = admin_token
    created = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "updateuser@test.com",
            "password": "SecurePass1!",
            "name": "Update Me",
            "role": "viewer",
        },
    )
    user_id = created.json()["id"]

    r = await client.patch(
        f"/api/v1/users/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Updated Name", "role": "admin"},
    )
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_admin_can_soft_delete_user(client, admin_token):
    token, _ = admin_token
    created = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "deleteuser@test.com", "password": "SecurePass1!"},
    )
    user_id = created.json()["id"]

    r = await client.delete(
        f"/api/v1/users/{user_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_admin_cannot_delete_self_when_not_last_admin(client, admin_token):
    token, admin_id = admin_token
    # Create another admin so this triggers self-protection, not last-admin protection
    await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "second-admin@test.com",
            "password": "SecurePass1!",
            "role": "admin",
        },
    )

    r = await client.delete(
        f"/api/v1/users/{admin_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 400
    assert "own account" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_cannot_deactivate_self_when_not_last_admin(client, admin_token):
    token, admin_id = admin_token
    await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "third-admin@test.com",
            "password": "SecurePass1!",
            "role": "admin",
        },
    )

    r = await client.patch(
        f"/api/v1/users/{admin_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_active": False},
    )
    assert r.status_code == 400
    assert "own account" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_cannot_demote_self_when_not_last_admin(client, admin_token):
    token, admin_id = admin_token
    await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "fourth-admin@test.com",
            "password": "SecurePass1!",
            "role": "admin",
        },
    )

    r = await client.patch(
        f"/api/v1/users/{admin_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"role": "viewer"},
    )
    assert r.status_code == 400
    assert "own role" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_cannot_delete_last_admin(client, admin_token):
    token, admin_id = admin_token
    r = await client.delete(
        f"/api/v1/users/{admin_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 400
    assert "last active admin" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_cannot_demote_last_admin(client, admin_token):
    token, admin_id = admin_token
    r = await client.patch(
        f"/api/v1/users/{admin_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"role": "viewer"},
    )
    assert r.status_code == 400
    assert "last active admin" in r.json()["detail"].lower()
