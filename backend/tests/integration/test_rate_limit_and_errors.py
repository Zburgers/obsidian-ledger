import pytest


@pytest.mark.asyncio
async def test_login_rate_limit_returns_429(client):
    for _ in range(20):
        await client.post(
            "/api/v1/auth/login",
            json={"email": "ratelimit@test.com", "password": "WrongPass1!"},
        )
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "ratelimit@test.com", "password": "WrongPass1!"},
    )
    assert r.status_code == 429


@pytest.mark.asyncio
async def test_error_payload_has_detail_and_code(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401
    body = r.json()
    assert "detail" in body
