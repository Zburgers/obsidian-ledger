import csv
import io

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.record import Record, RecordType
from app.models.user import User


def _user_filter(user: User):
    return Record.is_deleted == False


async def get_records_csv(db: AsyncSession, user: User) -> str:
    base = select(Record).where(_user_filter(user)).order_by(Record.recorded_at.desc())
    result = await db.execute(base)
    records = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "type", "category", "amount", "description", "recorded_at"])
    for r in records:
        writer.writerow(
            [
                str(r.id),
                r.record_type.value,
                r.category,
                str(r.amount),
                r.description or "",
                r.recorded_at.isoformat(),
            ]
        )
    return output.getvalue()


async def get_records_text(db: AsyncSession, user: User) -> bytes:
    base = select(Record).where(_user_filter(user)).order_by(Record.recorded_at.desc())
    result = await db.execute(base)
    records = result.scalars().all()

    lines = ["FinTrack Export", "=" * 40, ""]
    lines.append(f"{'Type':<10} {'Category':<15} {'Amount':>12} {'Date':<12}")
    lines.append("-" * 55)
    for r in records:
        lines.append(
            f"{r.record_type.value:<10} {r.category:<15} {r.amount:>12} {r.recorded_at.strftime('%Y-%m-%d'):<12}"
        )
    lines.append("")
    lines.append(f"Total records: {len(records)}")

    return "\n".join(lines).encode("utf-8")
