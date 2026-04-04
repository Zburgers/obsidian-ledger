#!/usr/bin/env python3
"""Seed demo data: admin user, sample records across categories."""

import asyncio
import os
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://fintrack:fintrack@db:5432/fintrack"
)
os.environ.setdefault("SECRET_KEY", "seed-script-key")

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.user import User, UserRole
from app.models.record import Record, RecordType
from app.core.security import hash_password


SAMPLE_RECORDS = [
    ("income", "Salary", "5000", "Monthly salary"),
    ("income", "Freelance", "1200", "Web project"),
    ("income", "Investment", "300", "Dividend payout"),
    ("expense", "Food", "150", "Weekly groceries"),
    ("expense", "Food", "45", "Restaurant dinner"),
    ("expense", "Transport", "80", "Gas fill-up"),
    ("expense", "Transport", "25", "Parking fees"),
    ("expense", "Entertainment", "60", "Movie tickets"),
    ("expense", "Utilities", "120", "Electricity bill"),
    ("expense", "Healthcare", "200", "Doctor visit"),
]


async def seed():
    url = os.environ["DATABASE_URL"]
    engine = create_async_engine(url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        admin = User(
            email="admin@demo.com",
            hashed_password=hash_password("Admin123!"),
            name="Demo Admin",
            role=UserRole.admin,
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)

        now = datetime.now()
        for i, (rtype, category, amount, desc) in enumerate(SAMPLE_RECORDS):
            db.add(
                Record(
                    user_id=admin.id,
                    record_type=RecordType(rtype),
                    category=category,
                    amount=Decimal(amount),
                    description=desc,
                    recorded_at=now - timedelta(days=i * 2),
                )
            )
        await db.commit()
        print(f"Seeded admin user and {len(SAMPLE_RECORDS)} records.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
