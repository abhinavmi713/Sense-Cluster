import pytest

from app.rate_limit import RateLimiter, auth_rate_limiter


def test_rate_limiter_allows_requests_under_the_limit():
    limiter = RateLimiter(max_requests=3, window_seconds=60)

    limiter.check("client-a")
    limiter.check("client-a")
    limiter.check("client-a")


def test_rate_limiter_blocks_requests_over_the_limit():
    limiter = RateLimiter(max_requests=3, window_seconds=60)

    limiter.check("client-a")
    limiter.check("client-a")
    limiter.check("client-a")

    with pytest.raises(Exception) as exc_info:
        limiter.check("client-a")

    assert exc_info.value.status_code == 429


def test_rate_limiter_tracks_keys_independently():
    limiter = RateLimiter(max_requests=1, window_seconds=60)

    limiter.check("client-a")
    limiter.check("client-b")  # different key, should not raise


def test_auth_endpoints_are_rate_limited(client):
    auth_rate_limiter._hits.clear()

    for _ in range(auth_rate_limiter.max_requests):
        response = client.post(
            "/api/v1/auth/token",
            json={"email": "nobody@example.com", "password": "wrong-password"},
        )
        assert response.status_code == 401

    blocked = client.post(
        "/api/v1/auth/token",
        json={"email": "nobody@example.com", "password": "wrong-password"},
    )

    assert blocked.status_code == 429
