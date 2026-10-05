"""Facebook public post image importer.

This module attempts to extract publicly accessible images from Facebook posts.
It does NOT:
- Bypass authentication or CAPTCHAs
- Access private posts
- Use stealth browser automation
- Store Facebook credentials

If Facebook blocks access, it returns a clear error for the frontend to handle.
"""

import re
import json
import logging
from typing import Optional
from urllib.parse import urlparse, urljoin, quote_plus

import httpx
from bs4 import BeautifulSoup

from app.config import FACEBOOK_REQUEST_TIMEOUT
from app.models.schemas import ImageInfo, FacebookImportResponse
from app.utils.security import is_facebook_url, is_valid_url

logger = logging.getLogger(__name__)

# Crawler headers that Facebook permits for public Open Graph link previews
_CRAWLER_HEADERS = [
    {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    },
    {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    },
]


def validate_facebook_url(url: str) -> tuple[bool, str]:
    """
    Validate that a URL is a valid Facebook URL.

    Returns:
        (is_valid, error_message)
    """
    if not url or not url.strip():
        return False, "URL is required."

    url = url.strip()

    if not is_valid_url(url):
        return False, "Please provide a valid URL."

    if not is_facebook_url(url):
        return False, "Please provide a Facebook URL (e.g., https://www.facebook.com/...)."

    return True, ""


async def fetch_public_page(url: str) -> tuple[Optional[str], Optional[str]]:
    """
    Fetch a publicly accessible Facebook page using crawler headers.
    Tries Googlebot and Facebook External Hit to retrieve public Open Graph metadata.

    Returns:
        (html_content, error_message)
    """
    last_error = None
    try:
        async with httpx.AsyncClient(
            timeout=FACEBOOK_REQUEST_TIMEOUT,
            follow_redirects=True,
            max_redirects=6,
        ) as client:
            for headers in _CRAWLER_HEADERS:
                try:
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200 and len(response.text) > 1000:
                        return response.text, None
                    elif response.status_code in (400, 401, 403):
                        last_error = "Facebook prevented automatic access to this post. You can upload the post images manually instead."
                    elif response.status_code == 404:
                        last_error = "The Facebook post was not found. It may have been deleted or is not publicly accessible."
                except httpx.RequestError as e:
                    logger.warning(f"Error fetching with crawler headers: {e}")
                    last_error = f"Could not connect to Facebook: {e}"

            if not last_error:
                last_error = "Facebook prevented automatic image retrieval for this post. You can upload the post images manually instead."
            return None, last_error

    except httpx.TimeoutException:
        return None, "The request to Facebook timed out. Please try again later."
    except httpx.ConnectError:
        return None, "Could not connect to Facebook. Please check your internet connection."
    except Exception as e:
        logger.error(f"Error fetching Facebook page: {e}")
        return None, "Facebook prevented automatic image retrieval for this post. You can upload the post images manually instead."


def extract_open_graph_images(html: str) -> list[ImageInfo]:
    """Extract images from Open Graph meta tags."""
    images: list[ImageInfo] = []
    try:
        try:
            soup = BeautifulSoup(html, "lxml")
        except Exception:
            soup = BeautifulSoup(html, "html.parser")

        # OG image tags
        og_tags = soup.find_all("meta", attrs={"property": re.compile(r"^og:image")})
        seen_urls: set[str] = set()

        for tag in og_tags:
            content = tag.get("content", "")
            prop = tag.get("property", "")

            if prop == "og:image" and content and content not in seen_urls:
                seen_urls.add(content)
                preview = f"/api/images/proxy?url={quote_plus(content)}" if ("fbsbx.com" in content or "fbcdn" in content) else content
                img = ImageInfo(url=content, preview_url=preview)

                # Try to find associated width/height
                for sibling in og_tags:
                    if sibling.get("property") == "og:image:width":
                        try:
                            img.width = int(sibling.get("content", 0))
                        except (ValueError, TypeError):
                            pass
                    elif sibling.get("property") == "og:image:height":
                        try:
                            img.height = int(sibling.get("content", 0))
                        except (ValueError, TypeError):
                            pass

                images.append(img)

    except Exception as e:
        logger.error(f"Error extracting OG images: {e}")

    return images


def extract_public_image_urls(html: str) -> list[ImageInfo]:
    """
    Extract publicly accessible image URLs from page HTML.
    Looks for high-resolution Facebook CDN image URLs and crawler media URLs.
    """
    images: list[ImageInfo] = []
    seen_urls: set[str] = set()

    try:
        # 1. Match lookaside crawler media URLs (used in multi-photo public posts)
        lookaside_pattern = r'https?://lookaside\.fbsbx\.com/lookaside/crawler/media/\?media_id=\d+'
        for match in re.findall(lookaside_pattern, html, re.IGNORECASE):
            if match not in seen_urls:
                media_id = match.split("media_id=")[-1]
                # Photo media IDs are 16+ digits; profile/user IDs are 15 digits or shorter
                if len(media_id) >= 16:
                    seen_urls.add(match)
                    images.append(ImageInfo(
                        url=match,
                        preview_url=f"/api/images/proxy?url={quote_plus(match)}",
                    ))

        # 2. Match Facebook CDN image URLs (scontent / fbcdn)
        fb_cdn_patterns = [
            r'https?://scontent[^"\'\\]+\.(?:jpg|jpeg|png|webp)[^"\'\\]*',
            r'https?://external[^"\'\\]+\.(?:jpg|jpeg|png|webp)[^"\'\\]*',
            r'https?://[^"\'\\]*fbcdn[^"\'\\]+\.(?:jpg|jpeg|png|webp)[^"\'\\]*',
        ]

        for pattern in fb_cdn_patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            for url in matches:
                clean_url = url.replace("\\u0025", "%").replace("\\/", "/")
                clean_url = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), clean_url)

                # Skip small thumbnails or emojis
                if any(skip in clean_url.lower() for skip in ["_t.", "_s.", "_q.", "50x50", "100x100", "rsrc.php"]):
                    continue

                if clean_url not in seen_urls:
                    seen_urls.add(clean_url)
                    images.append(ImageInfo(
                        url=clean_url,
                        preview_url=f"/api/images/proxy?url={quote_plus(clean_url)}",
                    ))

        # 3. Parse <img> tags from rendered HTML
        try:
            soup = BeautifulSoup(html, "lxml")
        except Exception:
            soup = BeautifulSoup(html, "html.parser")

        for img_tag in soup.find_all("img"):
            src = img_tag.get("src", "") or img_tag.get("data-src", "")
            if src and is_valid_url(src) and src not in seen_urls:
                parsed = urlparse(src)
                hostname = parsed.hostname or ""
                if any(domain in hostname for domain in ["fbcdn", "scontent", "fbsbx"]):
                    width = img_tag.get("width")
                    height = img_tag.get("height")
                    if width and int(width) < 100:
                        continue
                    if "lookaside" in src:
                        mid = src.split("media_id=")[-1]
                        if len(mid) < 16:
                            continue
                    seen_urls.add(src)
                    img_info = ImageInfo(
                        url=src,
                        preview_url=f"/api/images/proxy?url={quote_plus(src)}",
                    )
                    if width:
                        try:
                            img_info.width = int(width)
                        except ValueError:
                            pass
                    if height:
                        try:
                            img_info.height = int(height)
                        except ValueError:
                            pass
                    images.append(img_info)

    except Exception as e:
        logger.error(f"Error extracting image URLs: {e}")

    return images


def _deduplicate_images(images: list[ImageInfo]) -> list[ImageInfo]:
    """Remove duplicate images, preserving lookaside media IDs and higher resolution versions."""
    seen: dict[str, ImageInfo] = {}

    for img in images:
        parsed = urlparse(img.url)
        if "lookaside" in (parsed.netloc or ""):
            key = f"{parsed.path}?{parsed.query}"
        else:
            key = parsed.path

        if key not in seen:
            seen[key] = img
        elif img.width and seen[key].width:
            if img.width > seen[key].width:
                seen[key] = img

    return list(seen.values())


async def import_facebook_images(url: str) -> FacebookImportResponse:
    """
    Main entry point: attempt to import images from a public Facebook post.

    This function:
    1. Validates the URL
    2. Fetches the public page HTML with crawler headers
    3. Extracts OG and CDN / lookaside image URLs
    4. Returns found images or an appropriate error
    """
    is_valid, error_msg = validate_facebook_url(url)
    if not is_valid:
        return FacebookImportResponse(
            success=False,
            code="INVALID_URL",
            message=error_msg,
        )

    html, fetch_error = await fetch_public_page(url)
    if html is None:
        return FacebookImportResponse(
            success=False,
            code="FACEBOOK_BLOCKED",
            message=fetch_error or "Facebook prevented automatic image retrieval for this post. You can upload the post images manually instead.",
        )

    if _is_login_page(html):
        return FacebookImportResponse(
            success=False,
            code="FACEBOOK_BLOCKED",
            message=(
                "Facebook prevented automatic image retrieval for this post. "
                "The post may require login to view. "
                "You can upload the post images manually instead."
            ),
        )

    all_images: list[ImageInfo] = []

    og_images = extract_open_graph_images(html)
    all_images.extend(og_images)

    cdn_images = extract_public_image_urls(html)
    all_images.extend(cdn_images)

    unique_images = _deduplicate_images(all_images)

    if not unique_images:
        return FacebookImportResponse(
            success=False,
            code="NO_IMAGES_FOUND",
            message=(
                "No images were found in this post. "
                "The post may not contain images, or Facebook may have "
                "prevented access. You can upload the images manually."
            ),
        )

    return FacebookImportResponse(
        success=True,
        images=unique_images,
        message=f"Found {len(unique_images)} image(s).",
    )


def _is_login_page(html: str) -> bool:
    """Check if the returned HTML is a Facebook login page."""
    login_indicators = [
        "login_form",
        "Log in to Facebook",
        "Log Into Facebook",
        "Create new account",
        "/login/",
    ]
    html_lower = html.lower()
    matches = sum(1 for indicator in login_indicators if indicator.lower() in html_lower)
    return matches >= 2
