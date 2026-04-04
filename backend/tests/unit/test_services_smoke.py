import pytest

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)
from app.schemas.auth import RegisterRequest
from app.schemas.record import RecordCreateRequest


class TestSecurity:
    def test_hash_and_verify(self):
        pw = "SecurePass1!"
        hashed = hash_password(pw)
        assert verify_password(pw, hashed)
        assert not verify_password("wrong", hashed)

    def test_different_hashes_for_same_password(self):
        h1 = hash_password("SamePass1")
        h2 = hash_password("SamePass1")
        assert h1 != h2

    def test_create_and_decode_token(self):
        token = create_access_token({"sub": "test-id"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "test-id"
        assert payload["type"] == "access"

    def test_decode_tampered_token_returns_none(self):
        assert decode_token("garbage.token.value") is None


class TestSchemas:
    def test_register_request_valid(self):
        req = RegisterRequest(
            email="test@example.com", password="SecurePass1!", name="Test"
        )
        assert req.email == "test@example.com"

    def test_register_request_normalizes_email(self):
        req = RegisterRequest(email="TEST@Example.COM", password="SecurePass1!")
        assert req.email == "test@example.com"

    def test_register_request_rejects_weak_password(self):
        with pytest.raises(Exception):
            RegisterRequest(email="test@example.com", password="weak")

    def test_record_create_valid(self):
        req = RecordCreateRequest(
            record_type="expense", category="Food", amount="25.50"
        )
        assert req.record_type == "expense"

    def test_record_create_rejects_negative_amount(self):
        with pytest.raises(Exception):
            RecordCreateRequest(record_type="expense", category="Food", amount="-10")

    def test_record_create_rejects_invalid_type(self):
        with pytest.raises(Exception):
            RecordCreateRequest(record_type="invalid", category="Food", amount="10")
