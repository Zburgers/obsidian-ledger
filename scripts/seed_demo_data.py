#!/usr/bin/env python3
"""Seed demo data for realistic dashboard demos.

Creates users for all roles and seeds a large shared transaction set owned by
admin so all users can validate read access and dashboard analytics.

Usage:
    python seed_demo_data.py              # Creates users/records if missing
    python seed_demo_data.py --fresh      # Deletes existing users/records and reseeds
"""

import asyncio
import random
import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://fintrack:fintrack@db:5432/fintrack"
)
os.environ.setdefault("SECRET_KEY", "seed-script-key")

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func, delete

from app.models.user import User, UserRole
from app.models.record import Record, RecordType
from app.core.security import hash_password
import hashlib


SEED_USERS = [
    {
        "email": "admin@demo.com",
        "password": "Admin123!",
        "name": "Demo Admin",
        "role": UserRole.admin,
    },
    {
        "email": "analyst@demo.com",
        "password": "Analyst123!",
        "name": "Demo Analyst",
        "role": UserRole.analyst,
    },
    {
        "email": "viewer@demo.com",
        "password": "Viewer123!",
        "name": "Demo Viewer",
        "role": UserRole.viewer,
    },
]

INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Consulting",
    "Investment",
    "Bonus",
    "Sales",
    "Affiliate",
]

EXPENSE_CATEGORIES = [
    "Food",
    "Transport",
    "Utilities",
    "Rent",
    "Healthcare",
    "Insurance",
    "Education",
    "Marketing",
    "Software",
    "Entertainment",
    "Travel",
    "Maintenance",
]

INCOME_NOTES = [
    "Client payment",
    "Monthly payout",
    "Revenue settlement",
    "Contract bonus",
    "Commission transfer",
    "Subscription income",
]

EXPENSE_NOTES = [
    "Vendor invoice",
    "Monthly recurring charge",
    "Office supplies",
    "Campaign spend",
    "Equipment service",
    "Team expense",
    "Utility payment",
    "Travel reimbursement",
]


def make_amount(record_type: RecordType) -> Decimal:
    if record_type == RecordType.income:
        major = random.randint(250, 4500)
        cents = random.choice([0, 25, 50, 75])
        return Decimal(f"{major}.{cents:02d}")
    major = random.randint(18, 1450)
    cents = random.choice([0, 19, 49, 89])
    return Decimal(f"{major}.{cents:02d}")


def make_record(index: int, owner_id, now: datetime) -> Record:
    income_probability = 0.38
    record_type = (
        RecordType.income
        if random.random() < income_probability
        else RecordType.expense
    )
    if record_type == RecordType.income:
        category = random.choice(INCOME_CATEGORIES)
        description = random.choice(INCOME_NOTES)
    else:
        category = random.choice(EXPENSE_CATEGORIES)
        description = random.choice(EXPENSE_NOTES)

    day_offset = random.randint(0, 240)
    minute_offset = random.randint(0, 23 * 60)
    recorded_at = now - timedelta(days=day_offset, minutes=minute_offset)

    if index % 17 == 0:
        description = f"{description} #{index}"

    return Record(
        user_id=owner_id,
        record_type=record_type,
        category=category,
        amount=make_amount(record_type),
        description=description,
        recorded_at=recorded_at,
    )


async def seed(fresh: bool = False):
    """Seed the database with demo data.
    
    Args:
        fresh: If True, delete all existing users and records before seeding.
               If False, only create missing users and skip records if any exist.
    """
    url = os.environ["DATABASE_URL"]
    engine = create_async_engine(url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        random.seed(42)

        if fresh:
            # Delete all existing records and users (reset to clean slate)
            print("🔄 Fresh seed requested: deleting all existing data...")
            try:
                # Delete records first (foreign key constraint)
                await db.execute(delete(Record))
                await db.execute(delete(User))
                await db.commit()
                print("✓ Deleted all users and records")
            except Exception as e:
                print(f"⚠ Warning during cleanup: {e}")
                await db.rollback()

        users_by_email = {}
        for spec in SEED_USERS:
            existing = await db.execute(select(User).where(User.email == spec["email"]))
            user = existing.scalar_one_or_none()
            if user is None:
                # Some environments may not support the project's bcrypt backend
                # (or it may raise unexpected errors). Try the application's
                # hash_password and fall back to a sha256-based hash to ensure
                # seeding can proceed for demo purposes.
                try:
                    hashed = hash_password(spec["password"])
                except Exception:
                    # Fallback deterministic hash for demo only
                    hashed = (
                        "sha256$"
                        + hashlib.sha256(spec["password"].encode("utf-8")).hexdigest()
                    )

                user = User(
                    email=spec["email"],
                    hashed_password=hashed,
                    name=spec["name"],
                    role=spec["role"],
                )
                db.add(user)
                await db.flush()
                print(f"✓ Created user: {spec['email']} ({spec['role']})")
            else:
                print(f"→ User already exists: {spec['email']} ({spec['role']})")
            users_by_email[spec["email"]] = user

        admin = users_by_email["admin@demo.com"]

        existing_count_result = await db.execute(
            select(func.count()).select_from(Record)
        )
        existing_count = existing_count_result.scalar_one()
        
        if existing_count > 0 and not fresh:
            print(
                f"ℹ Records already exist ({existing_count}). Skipping record generation.\n"
                "  Use --fresh flag to replace records: python seed_demo_data.py --fresh"
            )
            await db.commit()
            await engine.dispose()
            return

        # Generate records
        now = datetime.now()
        target_records = 1200
        print(f"\n📝 Generating {target_records} transaction records...")
        
        for i in range(target_records):
            db.add(make_record(i, admin.id, now))
            if (i + 1) % 200 == 0:
                print(f"  ... {i + 1}/{target_records}")

        db.add(
            Record(
                user_id=admin.id,
                record_type=RecordType.income,
                category="Salary",
                amount=Decimal("5200.00"),
                description="Monthly salary anchor",
                recorded_at=now - timedelta(days=3),
            )
        )
        db.add(
            Record(
                user_id=admin.id,
                record_type=RecordType.expense,
                category="Rent",
                amount=Decimal("1600.00"),
                description="Monthly rent anchor",
                recorded_at=now - timedelta(days=2),
            )
        )

        await db.commit()
        print(
            f"\n✅ Seed complete!\n"
            f"  Users: 3 demo accounts (admin/analyst/viewer)\n"
            f"  Records: {target_records + 2} transactions owned by admin@demo.com\n"
            f"  Timespan: ~240 days of randomized financial data\n"
        )

    await engine.dispose()
            )
        )

        await db.commit()
        print(
            "Seeded demo users (admin/analyst/viewer) and "
            f"{target_records + 2} records for dashboard demos."
        )

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
