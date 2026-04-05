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


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _build_simple_pdf(lines: list[str]) -> bytes:
    encoded_lines = [f"({_escape_pdf_text(line)}) Tj" for line in lines]
    text_commands = (
        "BT\n/F1 11 Tf\n50 790 Td\n14 TL\n" + "\nT*\n".join(encoded_lines) + "\nET"
    )
    stream = text_commands.encode("utf-8")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length "
        + str(len(stream)).encode("ascii")
        + b" >>\nstream\n"
        + stream
        + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("ascii"))
        output.extend(obj)
        output.extend(b"\nendobj\n")

    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    output.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "ascii"
        )
    )
    return bytes(output)


async def get_records_pdf(db: AsyncSession, user: User) -> bytes:
    base = select(Record).where(_user_filter(user)).order_by(Record.recorded_at.desc())
    result = await db.execute(base)
    records = result.scalars().all()

    lines = [
        "FinTrack Export",
        "",
        "Type       Category              Amount        Date",
        "-----------------------------------------------------",
    ]
    for r in records[:40]:
        amount = f"{r.amount:.2f}" if r.amount is not None else "0.00"
        lines.append(
            f"{r.record_type.value:<10} {r.category[:18]:<18} {amount:>12}   {r.recorded_at.strftime('%Y-%m-%d')}"
        )

    if len(records) > 40:
        lines.append(f"... {len(records) - 40} more records omitted")

    lines.extend(["", f"Total records: {len(records)}"])
    return _build_simple_pdf(lines)
