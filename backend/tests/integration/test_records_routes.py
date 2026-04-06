import pytest
import pytest_asyncio

from app.models.user import User, UserRole
from app.models.record import Record, RecordType
from app.core.security import hash_password, create_access_token
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime
from decimal import Decimal


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


@pytest_asyncio.fixture
async def analyst_token(client, db_engine):
    analyst_id = uuid.uuid4()
    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        db.add(
            User(
                id=analyst_id,
                email="analyst-records@test.com",
                hashed_password=hash_password("Analyst123!"),
                name="Analyst",
                role=UserRole.analyst,
            )
        )
        await db.commit()
    return create_access_token({"sub": str(analyst_id)})


@pytest_asyncio.fixture
async def seed_admin_record(db_engine):
    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        admin = User(
            email="records-seed-admin@test.com",
            hashed_password=hash_password("Admin123!"),
            name="Seed Admin",
            role=UserRole.admin,
        )
        db.add(admin)
        await db.flush()
        db.add(
            Record(
                user_id=admin.id,
                record_type=RecordType.income,
                category="SeedIncome",
                amount=Decimal("999.00"),
                description="Seeded for read visibility",
                recorded_at=datetime.now(),
            )
        )
        await db.commit()


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
async def test_viewer_can_see_global_records(client, viewer_token, seed_admin_record):
    r = await client.get(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert any(item["category"] == "SeedIncome" for item in body["items"])


@pytest.mark.asyncio
async def test_analyst_can_see_global_records(client, analyst_token, seed_admin_record):
    r = await client.get(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert any(item["category"] == "SeedIncome" for item in body["items"])


@pytest.mark.asyncio
async def test_viewer_cannot_use_advanced_search_filter(
    client, viewer_token, seed_admin_record
):
    r = await client.get(
        "/api/v1/records?search=Seeded",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_use_amount_range_filters(
    client, viewer_token, seed_admin_record
):
    r = await client.get(
        "/api/v1/records?amount_min=10&amount_max=1000",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_analyst_can_use_advanced_filters(
    client, analyst_token, seed_admin_record
):
    r = await client.get(
        "/api/v1/records?search=Seeded&amount_min=100&amount_max=2000",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1


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


@pytest.mark.asyncio
async def test_viewer_cannot_soft_delete_record(client, admin_token, viewer_token):
    create_resp = await client.post(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "record_type": "expense",
            "category": "Utilities",
            "amount": "88.00",
        },
    )
    record_id = create_resp.json()["id"]

    delete_resp = await client.delete(
        f"/api/v1/records/{record_id}",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert delete_resp.status_code == 403

    list_resp = await client.get(
        "/api/v1/records",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    ids = [item["id"] for item in list_resp.json()["items"]]
    assert record_id in ids
