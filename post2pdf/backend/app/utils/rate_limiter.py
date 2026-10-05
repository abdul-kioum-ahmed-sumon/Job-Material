"""Rate limiter using in-memory sliding window."""

import time
from collections import defaultdict
from typing import Optional


class RateLimiter:
    """Simple in-memory sliding window rate limiter."""

    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        """Check if a request from the given key is allowed."""
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old entries
        self._requests[key] = [
            t for t in self._requests[key] if t > window_start
        ]

        if len(self._requests[key]) >= self.max_requests:
            return False

        self._requests[key].append(now)
        return True

    def remaining(self, key: str) -> int:
        """Get remaining requests for this key."""
        now = time.time()
        window_start = now - self.window_seconds
        self._requests[key] = [
            t for t in self._requests[key] if t > window_start
        ]
        return max(0, self.max_requests - len(self._requests[key]))

    def reset_time(self, key: str) -> Optional[float]:
        """Get seconds until the oldest request in the window expires."""
        now = time.time()
        window_start = now - self.window_seconds
        self._requests[key] = [
            t for t in self._requests[key] if t > window_start
        ]
        if self._requests[key]:
            return self._requests[key][0] + self.window_seconds - now
        return None
