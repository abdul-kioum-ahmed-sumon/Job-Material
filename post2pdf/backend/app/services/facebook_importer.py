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
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    },
    {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    },
    {
        "User-Agent": "Twitterbot/1.0",
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
    Tries facebookexternalhit, Googlebot, and Twitterbot to retrieve public Open Graph metadata.

    Returns:
        (html_content, error_message)
    """
    last_error = None
    last_html = None
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
                        # Prefer responses that are not login pages or already contain images
                        if not _is_login_page(response.text) or "lookaside.fbsbx.com" in response.text:
                            return response.text, None
                        last_html = response.text
                    elif response.status_code in (400, 401, 403):
                        last_error = "Facebook prevented automatic access to this post. You can upload the post images manually instead."
                    elif response.status_code == 404:
                        last_error = "The Facebook post was not found. It may have been deleted or is not publicly accessible."
                except httpx.RequestError as e:
                    logger.warning(f"Error fetching with crawler headers: {e}")
                    last_error = f"Could not connect to Facebook: {e}"

            if last_html:
                return last_html, None

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


def _get_media_id_from_url(url: str) -> Optional[str]:
    """Extract Facebook media/photo ID from URL."""
    if "media_id=" in url:
        return url.split("media_id=")[-1].split("&")[0]
    parsed = urlparse(url)
    id_match = re.search(r'(?:^|[^\d])(\d{16,})(?:[^\d]|$)', parsed.path)
    if id_match:
        return id_match.group(1)
    return None


def _extract_media_set_urls(html: str, post_url: str = "") -> list[str]:
    """
    Extract full photo album / media set URLs from post HTML.
    When a post has more than 5 images, Facebook's post permalink only embeds
    the first 5 images in the feed collage. The full set is accessible via the
    media/set URL.
    """
    found: list[str] = []

    def _add(u: str):
        clean = u.replace(r"\/", "/").replace("&amp;", "&").rstrip('\\"\'')
        if clean.startswith("/"):
            clean = "https://www.facebook.com" + clean
        if clean not in found:
            found.append(clean)

    # 1. Direct media/set URLs in HTML or JSON
    patterns = [
        r'https?(?::\\/\\/|://)[^\s"\'<>\\]*facebook\.com(?:\\/|/)media(?:\\/|/)set(?:\\/|/)\?[^\s"\'<>\\]+',
        r'(?:\\/|/)media(?:\\/|/)set(?:\\/|/)\?[^\s"\'<>\\]+',
    ]
    for pattern in patterns:
        for match in re.findall(pattern, html, re.IGNORECASE):
            _add(match)

    # 2. mediaset_token pattern: e.g. "mediaset_token":"pcb.1103012279131150"
    for match in re.findall(r'"mediaset_token"\s*:\s*"([^"]+)"', html):
        _add(f"https://www.facebook.com/media/set/?set={match}&type=1")

    # 3. Construct from set=pcb.<id>, set=gm.<id>, or set=a.<id>
    for match in re.findall(r'set=(?:pcb|gm|a)\.(\d+)', html.replace(r"\/", "/")):
        _add(f"https://www.facebook.com/media/set/?set=pcb.{match}&type=1")

    # 4. Canonical post URL or og:url IDs (e.g. /posts/<id> or /permalink/<id>)
    for match in re.findall(r'facebook\.com/(?:[^"\'<>\s]+/)?(?:posts|permalink)/(\d+)', html.replace(r"\/", "/")):
        _add(f"https://www.facebook.com/media/set/?set=pcb.{match}&type=1")

    # 5. Check if the post_url itself has a post ID
    if post_url:
        for match in re.findall(r'/(?:posts|permalink)/(\d+)', post_url):
            _add(f"https://www.facebook.com/media/set/?set=pcb.{match}&type=1")

    return found


def extract_public_image_urls(html: str) -> list[ImageInfo]:
    """
    Extract publicly accessible image URLs from page HTML.
    Looks for high-resolution Facebook CDN image URLs and crawler media URLs.
    Handles both raw HTML and JSON-escaped strings (\/).
    """
    images: list[ImageInfo] = []
    seen_urls: set[str] = set()

    try:
        # 1. Match lookaside crawler media URLs (used in multi-photo public posts)
        lookaside_pattern = (
            r'https?(?::\\/\\/|://)lookaside\.fbsbx\.com'
            r'(?:\\/|/)lookaside(?:\\/|/)crawler(?:\\/|/)media(?:\\/|/)\?media_id=\d+'
        )
        for match in re.findall(lookaside_pattern, html, re.IGNORECASE):
            clean_url = match.replace(r"\/", "/")
            if clean_url not in seen_urls:
                media_id = clean_url.split("media_id=")[-1]
                # Photo media IDs are 16+ digits; profile/user IDs are 15 digits or shorter
                if len(media_id) >= 16:
                    seen_urls.add(clean_url)
                    images.append(ImageInfo(
                        url=clean_url,
                        preview_url=f"/api/images/proxy?url={quote_plus(clean_url)}",
                    ))

        # 2. Match Facebook CDN image URLs (scontent / fbcdn)
        fb_cdn_patterns = [
            r'https?(?::\\/\\/|://)scontent[^"\'\\]+\.(?:jpg|jpeg|png|webp)[^"\'\\]*',
            r'https?(?::\\/\\/|://)external[^"\'\\]+\.(?:jpg|jpeg|png|webp)[^"\'\\]*',
            r'https?(?::\\/\\/|://)[^"\'\\]*fbcdn[^"\'\\]+\.(?:jpg|jpeg|png|webp)[^"\'\\]*',
        ]

        for pattern in fb_cdn_patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            for url in matches:
                clean_url = url.replace("\\u0025", "%").replace(r"\/", "/")
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
    """
    Remove duplicate images, preserving original order, lookaside media IDs,
    and higher resolution versions.
    """
    seen: dict[str, ImageInfo] = {}
    seen_media_ids: set[str] = set()

    for img in images:
        parsed = urlparse(img.url)
        is_lookaside = "lookaside" in (parsed.netloc or "")

        media_id = _get_media_id_from_url(img.url)
        if media_id:
            if media_id in seen_media_ids:
                continue
            seen_media_ids.add(media_id)

        key = f"{parsed.path}?{parsed.query}" if is_lookaside else parsed.path

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
    4. If the post is an album (>5 photos), fetches the media/set to retrieve all images
    5. Returns found images or an appropriate error
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

    cdn_images = extract_public_image_urls(html)

    # Check if this post is a multi-photo album where Facebook truncated the feed grid preview
    sub_counts = [
        int(c) for c in re.findall(r'"all_subattachments"\s*:\s*\{\s*"count"\s*:\s*(\d+)', html)
    ]
    expected_count = max(sub_counts) if sub_counts else None

    media_set_urls = _extract_media_set_urls(html, url)

    # If an album URL exists and we either need more images or media_set exists
    if media_set_urls:
        for ms_url in media_set_urls:
            try:
                ms_html, _ = await fetch_public_page(ms_url)
                if ms_html:
                    ms_images = extract_public_image_urls(ms_html)
                    if expected_count and len(ms_images) >= expected_count:
                        # Full media set contains pure album photos without feed clutter
                        cdn_images = ms_images
                        break
                    elif len(ms_images) > 0:
                        existing_mids = {_get_media_id_from_url(img.url) for img in cdn_images}
                        existing_mids.discard(None)
                        existing_urls = {img.url for img in cdn_images}

                        for img in ms_images:
                            mid = _get_media_id_from_url(img.url)
                            if mid:
                                if mid not in existing_mids:
                                    existing_mids.add(mid)
                                    cdn_images.append(img)
                            elif img.url not in existing_urls:
                                existing_urls.add(img.url)
                                cdn_images.append(img)

                        if expected_count and len(_deduplicate_images(cdn_images)) >= expected_count:
                            break
            except Exception as e:
                logger.warning(f"Error fetching media set URL {ms_url}: {e}")

    all_images: list[ImageInfo] = []
    all_images.extend(cdn_images)

    og_images = extract_open_graph_images(html)
    all_images.extend(og_images)

    unique_images = _deduplicate_images(all_images)

    if not unique_images:
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
    html_lower = html.lower()

    if "<title>log in to facebook" in html_lower or "<title>log into facebook" in html_lower:
        return True
    if 'id="login_form"' in html_lower or 'action="/login' in html_lower or 'name="login"' in html_lower:
        return True

    login_indicators = [
        "login_form",
        "log in to facebook",
        "log into facebook",
        "create new account",
    ]
    matches = sum(1 for indicator in login_indicators if indicator in html_lower)
    return matches >= 3
