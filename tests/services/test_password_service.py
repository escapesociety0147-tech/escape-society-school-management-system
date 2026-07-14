"""
Unit tests for the password hashing service.

No database, no fixtures - these test pure Python logic and should run
in milliseconds. A meaningfully different shape from the ORM persistence
tests: this is the first pure unit-tested service in the project.
"""

import pytest

from app.services.password_service import hash_password, verify_password


def test_hash_password_returns_argon2id_hash():
    hashed = hash_password("correct-horse-battery-staple")
    assert hashed.startswith("$argon2id$")


def test_hash_password_rejects_empty_password():
    with pytest.raises(ValueError):
        hash_password("")


def test_verify_password_accepts_correct_password():
    hashed = hash_password("correct-horse-battery-staple")
    is_valid, _ = verify_password("correct-horse-battery-staple", hashed)
    assert is_valid is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("correct-horse-battery-staple")
    is_valid, _ = verify_password("wrong-password", hashed)
    assert is_valid is False


def test_hashing_same_password_twice_produces_different_hashes():
    first = hash_password("same-password")
    second = hash_password("same-password")
    assert first != second


def test_verify_password_returns_no_upgrade_for_fresh_hash():
    hashed = hash_password("correct-horse-battery-staple")
    _, upgraded_hash = verify_password("correct-horse-battery-staple", hashed)
    assert upgraded_hash is None


def test_verify_password_returns_false_for_invalid_hash():
    is_valid, upgraded_hash = verify_password("any-password", "not-a-real-hash")
    assert is_valid is False
    assert upgraded_hash is None