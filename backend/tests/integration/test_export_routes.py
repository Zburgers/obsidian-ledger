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
                email="admin-export@test.com",
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
                email="viewer-export@test.com",
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
                email="analyst-export@test.com",
                hashed_password=hash_password("Analyst123!"),
                name="Analyst",
                role=UserRole.analyst,
            )
        )
        await db.commit()
    return create_access_token({"sub": str(analyst_id)})


@pytest_asyncio.fixture
async def seed_export_data(client, admin_token, db_engine):
    async_session = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        from sqlalchemy import select

        result = await db.execute(
            select(User).where(User.email == "admin-export@test.com")
        )
        admin = result.scalar_one()
        records = [
            Record(
                user_id=admin.id,
                record_type=RecordType.income,
                category="Salary",
                amount=Decimal("5000"),
                description="Monthly salary",
                recorded_at=datetime.now(),
            ),
            Record(
                user_id=admin.id,
                record_type=RecordType.expense,
                category="Food",
                amount=Decimal("150"),
                description="Groceries",
                recorded_at=datetime.now(),
            ),
        ]
        for r in records:
            db.add(r)
        await db.commit()


@pytest.mark.asyncio
async def test_csv_export_returns_csv_content(client, admin_token, seed_export_data):
    r = await client.get(
        "/api/v1/export/csv",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert "records.csv" in r.headers.get("content-disposition", "")
    text = r.text
    assert "id,type,category,amount,description,recorded_at" in text
    assert "Salary" in text
    assert "Food" in text


@pytest.mark.asyncio
async def test_pdf_export_returns_file(client, admin_token, seed_export_data):
    r = await client.get(
        "/api/v1/export/pdf",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    assert "application/pdf" in r.headers.get("content-type", "")
    assert "records.pdf" in r.headers.get("content-disposition", "")
    assert r.content.startswith(b"%PDF-")


@pytest.mark.asyncio
async def test_viewer_export_can_see_global_data(
    client, viewer_token, seed_export_data
):
    r = await client.get(
        "/api/v1/export/csv",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert r.status_code == 200
    text = r.text
    lines = text.strip().split("\n")
    assert len(lines) > 1


@pytest.mark.asyncio
async def test_analyst_export_can_see_global_data(
    client, analyst_token, seed_export_data
):
    r = await client.get(
        "/api/v1/export/csv",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert r.status_code == 200
    text = r.text
    lines = text.strip().split("\n")
    assert len(lines) > 1
