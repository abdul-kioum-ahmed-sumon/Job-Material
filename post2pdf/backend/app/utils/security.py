"""Security utilities for URL validation and SSRF prevention."""

import ipaddress
import socket
from urllib.parse import urlparse
import re
import os
import mimetypes
from typing import Optional

from app.config import ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_IMAGE_SIZE_BYTES


def is_valid_url(url: str) -> bool:
    """Validate that a string is a well-formed HTTP/HTTPS URL."""
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def is_facebook_url(url: str) -> bool:
    """Validate that a URL belongs to Facebook."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        return hostname in (
            "facebook.com",
            "www.facebook.com",
            "m.facebook.com",
            "web.facebook.com",
            "mbasic.facebook.com",
        )
    except Exception:
        return False


def is_safe_url(url: str) -> bool:
    """
    Check that a URL does not point to localhost or internal/private IPs.
    Prevents SSRF attacks.
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # Block obvious localhost
        if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
            return False

        # Resolve and check IP
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for family, _, _, _, sockaddr in addr_info:
                ip = ipaddress.ip_address(sockaddr[0])
                if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
                    return False
        except (socket.gaierror, ValueError):
            return False

        return True
    except Exception:
        return False


def is_safe_image_url(url: str) -> bool:
    """Check that a URL is safe and could plausibly be an image."""
    if not is_valid_url(url):
        return False
    if not is_safe_url(url):
        return False
    return True


def sanitize_filename(filename: str) -> str:
    """
    Remove path traversal characters and dangerous components from filenames.
    """
    # Remove path separators
    filename = os.path.basename(filename)
    # Remove null bytes
    filename = filename.replace("\x00", "")
    # Remove path traversal patterns
    filename = re.sub(r"\.\.", "", filename)
    # Keep only safe characters
    filename = re.sub(r"[^\w\-. ]", "_", filename)
    # Limit length
    if len(filename) > 200:
        name, ext = os.path.splitext(filename)
        filename = name[:196] + ext
    return filename or "image"


def validate_image_content_type(content_type: Optional[str]) -> bool:
    """Validate that a content type is an allowed image type."""
    if not content_type:
        return False
    # Normalize
    ct = content_type.lower().split(";")[0].strip()
    return ct in ALLOWED_MIME_TYPES


def validate_file_extension(filename: str) -> bool:
    """Validate that a filename has an allowed image extension."""
    ext = os.path.splitext(filename.lower())[1]
    return ext in ALLOWED_EXTENSIONS


def validate_image_size(size_bytes: int) -> bool:
    """Check that an image doesn't exceed the maximum allowed size."""
    return 0 < size_bytes <= MAX_IMAGE_SIZE_BYTES
