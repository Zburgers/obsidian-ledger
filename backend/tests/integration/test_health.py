import pytest


@pytest.mark.asyncio
async def test_health_returns_ok(client):
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()

    assert data["status"] in {"ok", "degraded"}
    assert "timestamp" in data
    assert "services" in data

    services = data["services"]
    assert "backend" in services
    assert "database" in services
    assert "frontend" in services

    assert services["backend"]["status"] == "ok"
    assert "port" in services["backend"]

    assert services["database"]["status"] in {"ok", "down"}
    assert "host" in services["database"]
    assert "port" in services["database"]

    assert services["frontend"]["status"] in {"ok", "down"}
    assert "host" in services["frontend"]
    assert "port" in services["frontend"]
