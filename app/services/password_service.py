"""
Password hashing service.

Thin wrapper around pwdlib's Argon2id hasher. This module is the
application's contract for password hashing/verification - callers
should never import pwdlib directly. That keeps the hashing library an
implementation detail we can swap or upgrade without touching anything
outside this file.
"""

from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

_password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hashes a plaintext password using Argon2id.

    Raises ValueError on an empty password - this indicates a
    programming/configuration error upstream (e.g. a form submitted
    without validation), not a legitimate use case, and should never
    reach this function in normal operation.
    """
    if not password:
        raise ValueError("Password must not be empty.")

    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> tuple[bool, str | None]:
    """
    Verifies a plaintext password against a stored hash.

    Returns (is_valid, upgraded_hash). upgraded_hash is None unless the
    password was valid AND the stored hash's parameters are stale (e.g.
    recommended Argon2id cost factors changed since the hash was
    created) - in which case it's the new hash the caller should persist
    to replace the old one. Never re-hashes on a failed verification.

    An unrecognized/corrupted hash (UnknownHashError) is treated
    identically to a wrong password: (False, None). Authentication
    callers only ever need one failure path - whether the credentials
    are usable or not. A malformed stored hash is a data-integrity
    problem worth logging by the caller, not a distinct authentication
    outcome exposed through this function's return value.

    Unlike hash_password, an empty password here is a legitimate (if
    always-incorrect) login attempt, not a programming error - no
    special-cased guard, it flows through to a normal (False, None).
    """
    try:
        return _password_hasher.verify_and_update(password, password_hash)
    except UnknownHashError:
        return False, None