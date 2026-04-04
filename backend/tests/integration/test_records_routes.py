import pytest
import pytest_asyncio

from app.models.user import User, UserRole
from app.core.security import hash_password, create_access_token
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
import uuid


@pytest_asyncio.fixture
async def admin_token(client, db_engine):
    admin_id = uuid.uuid4()
    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        db.add(
            User(
                id=admin_id,
                email="admin-records@test.com",
                hashed_password=hash_password("Admin123!"),
                name="Admin",
                role=UserRole.admin,
            )
        )
        await db.commit()
    return create_access_token({"sub": str(admin_id)})


@pytest_asyncio.fixture
async def viewer_token(client, db_engine):
    viewer_id = uuid.uuid4()
    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        db.add(
            User(
                id=viewer_id,
                email="viewer-records@test.com",
                hashed_password=hash_password("Viewer123!"),
                name="Viewer",
                role=UserRole.viewer,
            )
        )
        await db.commit()
    return create_access_token({"sub": str(viewer_id)})


@pytest.mark.asyncio
async def test_admin_can_create_record(client, admin_token):
    r = await client.post(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "record_type": "expense",
            "category": "Food",
            "amount": "25.50",
            "description": "Lunch",
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["record_type"] == "expense"
    assert body["category"] == "Food"
    assert body["amount"] == "25.50"


@pytest.mark.asyncio
async def test_viewer_cannot_create_record(client, viewer_token):
    r = await client.post(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={
            "record_type": "expense",
            "category": "Food",
            "amount": "25.50",
        },
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_viewer_sees_only_own_records(client, viewer_token):
    r = await client.get(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 0


@pytest.mark.asyncio
async def test_admin_can_list_records_with_pagination(client, admin_token):
    for i in range(5):
        await client.post(
            "/api/v1/records",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "record_type": "income",
                "category": "Salary",
                "amount": "1000",
                "description": f"Record {i}",
            },
        )

    r = await client.get(
        "/api/v1/records?page=1&page_size=2",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body["items"]) == 2
    assert body["total"] >= 5
    assert body["page"] == 1
    assert body["page_size"] == 2


@pytest.mark.asyncio
async def test_admin_can_filter_records(client, admin_token):
    await client.post(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "record_type": "expense",
            "category": "Transport",
            "amount": "50",
        },
    )
    r = await client.get(
        "/api/v1/records?type=expense",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert all(item["record_type"] == "expense" for item in body["items"])


@pytest.mark.asyncio
async def test_admin_can_update_record(client, admin_token):
    create_resp = await client.post(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "record_type": "expense",
            "category": "Food",
            "amount": "10",
        },
    )
    record_id = create_resp.json()["id"]

    r = await client.patch(
        f"/api/v1/records/{record_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"category": "Groceries", "amount": "15.50"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "Groceries"
    assert body["amount"] == "15.50"


@pytest.mark.asyncio
async def test_admin_can_soft_delete_record(client, admin_token):
    create_resp = await client.post(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "record_type": "income",
            "category": "Bonus",
            "amount": "500",
        },
    )
    record_id = create_resp.json()["id"]

    r = await client.delete(
        f"/api/v1/records/{record_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 204

    list_resp = await client.get(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ids = [item["id"] for item in list_resp.json()["items"]]
    assert record_id not in ids
