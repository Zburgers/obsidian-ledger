import pytest
import pytest_asyncio

from app.models.user import User, UserRole
from app.models.record import Record, RecordType
from app.core.security import hash_password, create_access_token
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime, timedelta
from decimal import Decimal


@pytest_asyncio.fixture
async def admin_token(client, db_engine):
    admin_id = uuid.uuid4()
    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        db.add(
            User(
                id=admin_id,
                email="admin-dash@test.com",
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
                email="viewer-dash@test.com",
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
                email="analyst-dash@test.com",
                hashed_password=hash_password("Analyst123!"),
                name="Analyst",
                role=UserRole.analyst,
            )
        )
        await db.commit()
    return create_access_token({"sub": str(analyst_id)})


@pytest_asyncio.fixture
async def seed_records(client, admin_token, db_engine):
    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        from sqlalchemy import select

        result = await db.execute(
            select(User).where(User.email == "admin-dash@test.com")
        )
        admin = result.scalar_one()

        records = [
            Record(
                user_id=admin.id,
                record_type=RecordType.income,
                category="Salary",
                amount=Decimal("5000"),
                description="Monthly salary",
                recorded_at=datetime.now() - timedelta(days=5),
            ),
            Record(
                user_id=admin.id,
                record_type=RecordType.expense,
                category="Food",
                amount=Decimal("150"),
                description="Groceries",
                recorded_at=datetime.now() - timedelta(days=3),
            ),
            Record(
                user_id=admin.id,
                record_type=RecordType.expense,
                category="Transport",
                amount=Decimal("50"),
                description="Gas",
                recorded_at=datetime.now() - timedelta(days=1),
            ),
        ]
        for r in records:
            db.add(r)
        await db.commit()


@pytest.mark.asyncio
async def test_summary_returns_totals(client, admin_token, seed_records):
    r = await client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total_income"] == "5000.00"
    assert body["total_expense"] == "200.00"
    assert body["net"] == "4800.00"
    assert body["record_count"] == 3


@pytest.mark.asyncio
async def test_viewer_summary_can_see_global_data(client, viewer_token, seed_records):
    r = await client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total_income"] == "5000.00"
    assert body["total_expense"] == "200.00"


@pytest.mark.asyncio
async def test_analyst_summary_can_see_global_data(client, analyst_token, seed_records):
    r = await client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total_income"] == "5000.00"
    assert body["total_expense"] == "200.00"


@pytest.mark.asyncio
async def test_by_category_returns_grouped_data(client, admin_token, seed_records):
    r = await client.get(
        "/api/v1/dashboard/by-category",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    categories = [item["category"] for item in body["items"]]
    assert "Salary" in categories
    assert "Food" in categories


@pytest.mark.asyncio
async def test_viewer_cannot_access_category_breakdown(
    client, viewer_token, seed_records
):
    r = await client.get(
        "/api/v1/dashboard/by-category",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_trends_returns_periods(client, admin_token, seed_records):
    r = await client.get(
        "/api/v1/dashboard/trends",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "items" in body


@pytest.mark.asyncio
async def test_viewer_cannot_access_trends(client, viewer_token, seed_records):
    r = await client.get(
        "/api/v1/dashboard/trends",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_analyst_can_access_trends(client, analyst_token, seed_records):
    r = await client.get(
        "/api/v1/dashboard/trends",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert r.status_code == 200
    assert "items" in r.json()


@pytest.mark.asyncio
async def test_viewer_cannot_access_monthly_comparison(
    client, viewer_token, seed_records
):
    r = await client.get(
        "/api/v1/dashboard/comparison?period_a=2026-01&period_b=2026-02",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_analyst_can_access_monthly_comparison(
    client, analyst_token, seed_records
):
    r = await client.get(
        "/api/v1/dashboard/comparison?period_a=2026-01&period_b=2026-02",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["period_a"] == "2026-01"
    assert body["period_b"] == "2026-02"
    assert "income_delta" in body
    assert "expense_delta" in body


@pytest.mark.asyncio
async def test_admin_can_access_monthly_comparison(client, admin_token, seed_records):
    r = await client.get(
        "/api/v1/dashboard/comparison?period_a=2026-01&period_b=2026-02",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_recent_returns_latest_records(client, admin_token, seed_records):
    r = await client.get(
        "/api/v1/dashboard/recent",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body["items"]) <= 3
    assert body["items"][0]["category"] == "Transport"
