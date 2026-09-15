import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


class RateLimiter:
    """Fixed-window limiter keyed by an arbitrary string (e.g. client IP).

    In-memory and per-process: fine for a single API instance, but does not
    share state across multiple workers/replicas.
    """

    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> None:
        now = time.monotonic()

        with self._lock:
            hits = self._hits[key]

            while hits and now - hits[0] > self.window_seconds:
                hits.popleft()

            if len(hits) >= self.max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                )

            hits.append(now)


auth_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)


def enforce_auth_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    auth_rate_limiter.check(client_ip)
