"""
Unit tests for the JWT token service.

No database, no fixtures - pure Python logic. Runs against the real
application SECRET_KEY (verified to be 86 bytes, well above the 32-byte
minimum PyJWT recommends for HS256), so no test-specific secret override
is needed.
"""

import uuid
from datetime import timedelta

import jwt
import pytest

from app.models.user import UserRole
from app.services.token_service import create_access_token, decode_access_token


def test_create_access_token_returns_jwt():
    token = create_access_token(
        user_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        role=UserRole.ADMIN,
        school_id=uuid.uuid4(),
    )
    assert isinstance(token, str)
    assert token.count(".") == 2


def test_decode_access_token_round_trips_claims():
    user_id = uuid.uuid4()
    session_id = uuid.uuid4()
    school_id = uuid.uuid4()

    token = create_access_token(
        user_id=user_id,
        session_id=session_id,
        role=UserRole.TEACHER,
        school_id=school_id,
    )
    payload = decode_access_token(token)

    assert payload["sub"] == str(user_id)
    assert payload["sid"] == str(session_id)
    assert payload["school_id"] == str(school_id)
    assert payload["role"] == "teacher"
    assert "iat" in payload
    assert "exp" in payload


def test_default_expiration_is_used_when_none_supplied():
    token = create_access_token(
        user_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        role=UserRole.PARENT,
        school_id=uuid.uuid4(),
    )
    payload = decode_access_token(token)
    assert payload["exp"] > payload["iat"]


def test_custom_expiration_overrides_default():
    token = create_access_token(
        user_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        role=UserRole.STUDENT,
        school_id=uuid.uuid4(),
        expires_delta=timedelta(seconds=1),
    )
    payload = decode_access_token(token)
    assert (payload["exp"] - payload["iat"]) == 1


def test_decode_rejects_expired_token():
    token = create_access_token(
        user_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        role=UserRole.ADMIN,
        school_id=uuid.uuid4(),
        expires_delta=timedelta(seconds=-1),
    )
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_decode_rejects_token_with_invalid_signature():
    token = create_access_token(
        user_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        role=UserRole.ADMIN,
        school_id=uuid.uuid4(),
    )
    tampered_token = token[:-4] + "abcd"
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(tampered_token)


def test_decode_rejects_malformed_token():
    with pytest.raises(jwt.DecodeError):
        decode_access_token("not-a-real-jwt-token")


def test_uuid_claims_are_serialized_as_strings():
    user_id = uuid.uuid4()
    token = create_access_token(
        user_id=user_id,
        session_id=uuid.uuid4(),
        role=UserRole.ADMIN,
        school_id=uuid.uuid4(),
    )
    payload = decode_access_token(token)
    assert isinstance(payload["sub"], str)
    assert payload["sub"] == str(user_id)


def test_role_claim_uses_enum_value():
    token = create_access_token(
        user_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        role=UserRole.TEACHER,
        school_id=uuid.uuid4(),
    )
    payload = decode_access_token(token)
    assert payload["role"] == "teacher"