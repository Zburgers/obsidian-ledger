import pytest
import pytest_asyncio


@pytest_asyncio.fixture
async def admin_token(client, db_engine):
    from app.models.user import User, UserRole
    from app.core.security import (
        hash_password,
        create_access_token,
        create_refresh_token,
    )
    from sqlalchemy import select
    import uuid

    admin_id = uuid.uuid4()
    admin_user = User(
        id=admin_id,
        email="admin-users@test.com",
        hashed_password=hash_password("Admin123!"),
        name="Admin",
        role=UserRole.admin,
    )
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker

    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        db.add(admin_user)
        await db.commit()

    access_token = create_access_token({"sub": str(admin_id)})
    return access_token


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


@pytest.mark.asyncio
async def test_admin_can_list_users(client, admin_token):
    r = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r.status_code == 200
    body = r.json()
    assert "items" in body
    assert "total" in body
    assert "page" in body
    assert "page_size" in body


@pytest.mark.asyncio
async def test_viewer_gets_403_on_users_list(client, viewer_token):
    r = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_create_user(client, admin_token):
    r = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": "newuser@test.com",
            "password": "SecurePass1!",
            "name": "New User",
            "role": "analyst",
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "newuser@test.com"
    assert body["role"] == "analyst"


@pytest.mark.asyncio
async def test_admin_can_update_user(client, admin_token):
    create_resp = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": "updateuser@test.com",
            "password": "SecurePass1!",
            "name": "Update Me",
            "role": "viewer",
        },
    )
    user_id = create_resp.json()["id"]

    r = await client.patch(
        f"/api/v1/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Updated Name", "role": "admin"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Updated Name"
    assert body["role"] == "admin"


@pytest.mark.asyncio
async def test_admin_can_soft_delete_user(client, admin_token):
    create_resp = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": "deleteuser@test.com",
            "password": "SecurePass1!",
            "name": "Delete Me",
        },
    )
    user_id = create_resp.json()["id"]

    r = await client.delete(
        f"/api/v1/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 204

    list_resp = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {admin_token}"}
    )
    emails = [u["email"] for u in list_resp.json()["items"]]
    assert "deleteuser@test.com" not in emails
