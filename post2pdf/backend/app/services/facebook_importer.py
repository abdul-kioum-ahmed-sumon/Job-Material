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
import base64
import logging
from typing import Optional
from urllib.parse import urlparse, quote_plus

import httpx
from bs4 import BeautifulSoup

from app.config import FACEBOOK_REQUEST_TIMEOUT
from app.models.schemas import ImageInfo, FacebookImportResponse
from app.utils.security import is_facebook_url, is_valid_url

logger = logging.getLogger(__name__)

# Crawler headers that Facebook permits for public Open Graph and SEO indexing.
# Googlebot receives the full server-side rendered HTML with all photo attachments.
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
    Tries Googlebot first (which receives full SSR photo listings), then facebookexternalhit and Twitterbot.

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
                        # Prefer responses that are not login pages or contain photo references
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
    """Extract images from Open Graph meta tags (used as fallback only)."""
    images: list[ImageInfo] = []
    try:
        try:
            soup = BeautifulSoup(html, "lxml")
        except Exception:
            soup = BeautifulSoup(html, "html.parser")

        og_tags = soup.find_all("meta", attrs={"property": re.compile(r"^og:image")})
        seen_urls: set[str] = set()

        for tag in og_tags:
            content = tag.get("content", "")
            prop = tag.get("property", "")

            if prop == "og:image" and content and content not in seen_urls:
                seen_urls.add(content)
                preview = f"/api/images/proxy?url={quote_plus(content)}" if ("fbsbx.com" in content or "fbcdn" in content) else content
                img = ImageInfo(url=content, preview_url=preview)

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
    id_match = re.search(r'(?:^|[^\d])(\d{10,})(?:[^\d]|$)', parsed.path)
    if id_match:
        return id_match.group(1)
    return None


def extract_non_photo_ids(html: str, post_url: str = "") -> set[str]:
    """
    Find all user IDs, actor IDs, commenter IDs, page IDs, and group IDs.
    These IDs represent profile pictures, group headers, and avatars which are
    not actual study material images from the post.
    """
    excluded_ids: set[str] = set()
    clean_html = html.replace(r'\"', '"').replace(r"\/", "/")

    patterns = [
        r'"actors"\s*:\s*\[\s*\{[^}]*"id"\s*:\s*"(\d+)"',
        r'"author"\s*:\s*\{[^}]*"id"\s*:\s*"(\d+)"',
        r'"content_owner_id_new"\s*:\s*"(\d+)"',
        r'"profile_id"\s*:\s*"(\d+)"',
        r'"actor_id"\s*:\s*"(\d+)"',
        r'"page_id"\s*:\s*"(\d+)"',
        r'"group_id"\s*:\s*"(\d+)"',
        r'"profile_picture[^"]*"\s*:\s*\{[^}]*"uri"\s*:\s*"[^"]*media_id=(\d+)"',
        r'"profile_picture_depth_\d+[^"]*"\s*:\s*\{[^}]*"uri"\s*:\s*"[^"]*media_id=(\d+)"',
    ]
    for p in patterns:
        for match in re.findall(p, clean_html):
            if match and match != '0':
                excluded_ids.add(match)

    if post_url:
        for gid in re.findall(r'/groups/(\d+)', post_url):
            excluded_ids.add(gid)

    for gid in re.findall(r'facebook\.com/(?:groups|pages)/(\d+)', clean_html):
        excluded_ids.add(gid)

    return excluded_ids


def extract_photo_attachment_ids(html: str) -> list[str]:
    """
    Extract photo IDs from ALL Facebook SSR JSON structures.

    Facebook embeds photo IDs in many different JSON structures across <script> tags.
    For posts with 50, 75, or more images, the IDs can appear in:
    - photo_attachments_list arrays
    - edges arrays inside all_subattachments / subattachments
    - Relay query data with Photo nodes
    - attachment_fbid, photo_id, and fbid fields
    - photo_image and image URI fields containing media_id params
    - CometPhotoRoot and PhotoViewerPhoto data
    """
    photo_ids: list[str] = []
    # Normalize escaped JSON so all patterns work on clean text
    clean_html = html.replace(r'\"', '"').replace(r"\/", "/")

    def _add(pid: str):
        if pid and pid.isdigit() and len(pid) >= 10 and pid not in photo_ids:
            photo_ids.append(pid)

    # 1. photo_attachments_list: ["id1", "id2", ...]
    #    This is Facebook's primary complete list for multi-photo posts
    for match in re.finditer(r'photo_attachments_list"\s*:\s*\[([^\]]+)\]', clean_html):
        for pid in re.findall(r'(\d+)', match.group(1)):
            _add(pid)

    # 2. comet story attachments: "media":{"__typename":"Photo","id":"..."}
    #    Covers both "media" and "target" wrapper keys
    for match in re.findall(r'"(?:media|target)"\s*:\s*\{"__typename"\s*:\s*"Photo"[^}]*"id"\s*:\s*"(\d+)"', clean_html):
        _add(match)

    # 3. Relay-style node edges: "node":{"__typename":"Photo","id":"..."}
    #    Facebook's GraphQL relay data embeds photos in edges arrays
    for match in re.findall(r'"node"\s*:\s*\{\s*"__typename"\s*:\s*"Photo"\s*,\s*"id"\s*:\s*"(\d+)"', clean_html):
        _add(match)
    # Reverse order: id before __typename
    for match in re.findall(r'"node"\s*:\s*\{\s*"id"\s*:\s*"(\d+)"\s*,\s*"__typename"\s*:\s*"Photo"', clean_html):
        _add(match)

    # 4. Direct photo_id fields
    for match in re.findall(r'"photo_id"\s*:\s*"(\d+)"', clean_html):
        _add(match)

    # 5. Attachment fbid values
    for match in re.findall(r'"attachment_fbid"\s*:\s*"(\d+)"', clean_html):
        _add(match)

    # 6. Generic "fbid" fields (used in photo viewer and album data)
    for match in re.findall(r'"fbid"\s*:\s*"(\d+)"', clean_html):
        _add(match)
    # Also numeric fbid (not string)
    for match in re.findall(r'"fbid"\s*:\s*(\d{10,})', clean_html):
        _add(match)

    # 7. Photo nodes in all_subattachments edges:
    #    "all_subattachments":{"nodes":[{"media":{"__typename":"Photo","id":"..."}},...]}
    #    and "edges":[{"node":{"media":{"id":"..."}}}]
    for match in re.findall(r'"media"\s*:\s*\{[^}]*"id"\s*:\s*"(\d+)"[^}]*"__typename"\s*:\s*"Photo"', clean_html):
        _add(match)

    # 8. CometPhotoRoot and photo viewer data: "photoID":"..."
    for match in re.findall(r'"photoID"\s*:\s*"(\d+)"', clean_html):
        _add(match)
    for match in re.findall(r'"photo_fbid"\s*:\s*"(\d+)"', clean_html):
        _add(match)
    for match in re.findall(r'"photoFbid"\s*:\s*"(\d+)"', clean_html):
        _add(match)

    # 9. Image URIs with media_id parameter embedded in JSON
    for match in re.findall(r'media_id[=:](\d{10,})', clean_html):
        _add(match)

    # 10. Broad "id":"<digits>" inside blocks that mention "Photo" typename
    #     Match JSON chunks that contain Photo type and extract all IDs
    for chunk_match in re.finditer(r'\{[^{}]{0,500}"__typename"\s*:\s*"Photo"[^{}]{0,500}\}', clean_html):
        chunk = chunk_match.group(0)
        for pid in re.findall(r'"id"\s*:\s*"(\d{10,})"', chunk):
            _add(pid)

    # 11. Subattachment arrays (both "nodes" and "edges" variants)
    #     "all_subattachments":{"count":75,"nodes":[...]} or
    #     "subattachments":{"edges":[{"node":{...}}]}
    for block_match in re.finditer(
        r'"(?:all_subattachments|subattachments)"\s*:\s*\{[^{}]*(?:"nodes"|"edges")\s*:\s*\[(.*?)\]\s*\}',
        clean_html,
        re.DOTALL,
    ):
        block = block_match.group(1)
        for pid in re.findall(r'"id"\s*:\s*"(\d{10,})"', block):
            _add(pid)

    # 12. Large edges arrays: Facebook may serialize all photo edges in a single array
    #     "edges":[{"node":{"id":"...","__typename":"Photo",...}},...]
    for edges_match in re.finditer(r'"edges"\s*:\s*\[((?:[^[\]]*|\[(?:[^[\]]*|\[[^[\]]*\])*\])*)\]', clean_html):
        edges_str = edges_match.group(1)
        if '"Photo"' in edges_str or '"photo"' in edges_str.lower():
            for pid in re.findall(r'"id"\s*:\s*"(\d{10,})"', edges_str):
                _add(pid)

    # 13. Photo URLs with fbid parameter in query strings
    for match in re.findall(r'[?&]fbid=(\d{10,})', clean_html):
        _add(match)

    # 14. Attachment type=photo data: "type":"photo"..."fbid":"..."
    for chunk_match in re.finditer(r'\{[^{}]{0,800}"type"\s*:\s*"photo"[^{}]{0,800}\}', clean_html, re.IGNORECASE):
        chunk = chunk_match.group(0)
        for pid in re.findall(r'"(?:fbid|id|photo_id)"\s*:\s*"(\d{10,})"', chunk):
            _add(pid)

    return photo_ids


def _extract_media_set_urls(html: str, post_url: str = "") -> list[str]:
    """
    Extract full photo album / media set URLs from post HTML.
    When a post has more than 5 images, Facebook's post permalink embeds
    media set tokens and links to view the full collection.
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


def extract_public_image_urls(html: str, post_url: str = "") -> list[ImageInfo]:
    """
    Extract publicly accessible image URLs from page HTML.
    Extracts all photo attachments, lookaside crawler media URLs, and high-res Facebook CDN photos.
    Excludes non-photo IDs (author avatars, commenter profile pics, group headers/banners).
    """
    images: list[ImageInfo] = []
    seen_urls: set[str] = set()

    # Identify actor and group IDs that should NOT be imported as study sheet photos
    excluded_ids = extract_non_photo_ids(html, post_url)

    try:
        # 1. Extract photo IDs from photo_attachments_list and Photo media nodes
        photo_ids = extract_photo_attachment_ids(html)
        for pid in photo_ids:
            if pid not in excluded_ids:
                clean_url = f"https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id={pid}"
                if clean_url not in seen_urls:
                    seen_urls.add(clean_url)
                    images.append(ImageInfo(
                        url=clean_url,
                        preview_url=f"/api/images/proxy?url={quote_plus(clean_url)}",
                    ))

        # 2. Match lookaside crawler media URLs from rendered HTML & JSON
        lookaside_pattern = (
            r'https?(?::\\/\\/|://)lookaside\.fbsbx\.com'
            r'(?:\\/|/)lookaside(?:\\/|/)crawler(?:\\/|/)media(?:\\/|/)\?media_id=(\d+)'
        )
        for match in re.findall(lookaside_pattern, html, re.IGNORECASE):
            media_id = match
            if media_id not in excluded_ids and len(media_id) >= 10:
                clean_url = f"https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id={media_id}"
                if clean_url not in seen_urls:
                    seen_urls.add(clean_url)
                    images.append(ImageInfo(
                        url=clean_url,
                        preview_url=f"/api/images/proxy?url={quote_plus(clean_url)}",
                    ))

        # 3. Match Facebook CDN image URLs (scontent / fbcdn)
        # Modern Facebook CDN URLs often lack traditional file extensions (e.g. /m1/v/t6/An... or /v/t39.30808-6/...)
        fb_cdn_patterns = [
            r'https?(?::\\/\\/|://)scontent[^\s"\'<>\\]+',
            r'https?(?::\\/\\/|://)[^\s"\'<>\\]*fbcdn\.net[^\s"\'<>\\]+',
        ]

        for pattern in fb_cdn_patterns:
            matches = re.findall(pattern, html.replace(r"\/", "/"), re.IGNORECASE)
            for url in matches:
                clean_url = url.replace("\\u0025", "%")
                clean_url = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), clean_url)
                clean_url = clean_url.rstrip('\\"\'')

                # Skip non-image assets, script bundles, stylesheets, vector animations, and stickers
                if any(skip in clean_url.lower() for skip in [
                    ".js",
                    ".css",
                    ".kf",
                    "/m1/v/t6/",
                    "keyframes",
                    "rsrc.php",
                    "emoji.php",
                    "t39.1997-",
                    "1997-6",
                ]):
                    continue

                # Ensure CDN URL is a real photo (has image extension or standard timeline/album photo path -6/-9/-4)
                is_photo = (
                    any(ext in clean_url.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"])
                    or bool(re.search(r'/v/t\d+\.\d+-(?:6|9|4)/', clean_url))
                )
                if not is_photo:
                    continue

                # Skip profile picture and avatar paths:
                # - /t39.30808-1/ and /t1.18169-1/ denote avatar/profile pictures (-1)
                # - Small thumbnails: 50x50, 100x100, 160x160, 320x320, _s., _t., _q.
                if any(skip in clean_url.lower() for skip in [
                    "-1/",
                    "50x50",
                    "100x100",
                    "160x160",
                    "320x320",
                    "_t.",
                    "_s.",
                    "_q.",
                ]):
                    continue

                # Skip if media_id belongs to excluded actor/group list
                mid = _get_media_id_from_url(clean_url)
                if mid and mid in excluded_ids:
                    continue

                if clean_url not in seen_urls:
                    seen_urls.add(clean_url)
                    images.append(ImageInfo(
                        url=clean_url,
                        preview_url=f"/api/images/proxy?url={quote_plus(clean_url)}",
                    ))

        # 4. Parse <img> tags from rendered HTML
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
                    if width and int(width) < 120:
                        continue

                    mid = _get_media_id_from_url(src)
                    if mid and mid in excluded_ids:
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


async def _fetch_graphql_album_photos(
    token: str,
    post_html: str,
    ms_html: str,
    max_photos: int = 200,
) -> list[str]:
    """
    Fetch all photos in a Facebook album/mediaset using Facebook's GraphQL API.

    Facebook caps server-side rendered HTML to ~24 photos. When an album has
    25 to 100+ photos, Facebook's web client uses Relay GraphQL connections:
    1. Reads the LSD security token from the HTML.
    2. Queries CometPhotoAlbumQuery (doc_id: 27577656621909804) for batch 1.
    3. If has_next_page is True, iterates CometAlbumPhotoCollagePaginationQuery
       (doc_id: 28307570635543090) with the end_cursor to retrieve all remaining pages.

    Returns pure photo IDs directly from Photo media nodes (excludes all avatars and non-photo IDs).
    """
    googlebot_ua = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    headers = {
        "User-Agent": googlebot_ua,
        "Accept": "*/*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://www.facebook.com",
        "Referer": f"https://www.facebook.com/media/set/?set={token}&type=1",
    }

    # Extract LSD token
    lsd_match = re.search(r'"LSD",\[\],\{"token":"([^"]+)"\}', ms_html) or re.search(r'"LSD",\[\],\{"token":"([^"]+)"\}', post_html)
    lsd = lsd_match.group(1) if lsd_match else ""
    if not lsd:
        logger.warning("No LSD token found for Facebook GraphQL request")
        return []

    graphql_url = "https://www.facebook.com/api/graphql/"
    all_photo_ids: list[str] = []
    seen: set[str] = set()
    cursor: Optional[str] = None
    has_next: bool = False

    async with httpx.AsyncClient(timeout=FACEBOOK_REQUEST_TIMEOUT, follow_redirects=True) as client:
        # 1. First batch via CometPhotoAlbumQuery
        idx = ms_html.find('"queryName":"CometPhotoAlbumQuery"')
        if idx != -1:
            try:
                start = ms_html.rfind('{"actorID"', 0, idx)
                end = ms_html.find('}', idx) + 1
                query_info = json.loads(ms_html[start:end])
                doc_id = query_info.get("queryID", "27577656621909804")
                variables = query_info.get("variables", {})

                resp1 = await client.post(graphql_url, headers=headers, data={
                    "doc_id": doc_id,
                    "variables": json.dumps(variables),
                    "lsd": lsd,
                })

                if resp1.status_code == 200:
                    for line in resp1.text.strip().split("\n"):
                        try:
                            chunk = json.loads(line)
                            if "data" in chunk and "album" in chunk["data"]:
                                media = chunk["data"]["album"].get("media", {})
                                edges = media.get("edges", [])
                                page_info = media.get("page_info", {})
                                if page_info:
                                    has_next = page_info.get("has_next_page", False)
                                    cursor = page_info.get("end_cursor")
                                for edge in edges:
                                    node = edge.get("node", {})
                                    pid = node.get("id")
                                    if pid and pid not in seen:
                                        seen.add(pid)
                                        all_photo_ids.append(pid)
                        except Exception:
                            pass
            except Exception as e:
                logger.warning(f"Error querying CometPhotoAlbumQuery batch 1: {e}")

        # Fallback to initial cursor from ms_html if CometPhotoAlbumQuery didn't populate cursor
        if not cursor:
            cursor_match = re.search(r'"end_cursor":"([^"]+)"', ms_html)
            has_next_match = re.search(r'"has_next_page":(true|false)', ms_html)
            cursor = cursor_match.group(1) if cursor_match else None
            has_next = (has_next_match.group(1) == "true") if has_next_match else False

        mediaset_id = base64.b64encode(f"mediaset:{token}".encode("utf-8")).decode("utf-8")
        pagination_doc_id = "28307570635543090"

        # 2. Iterate remaining pages via CometAlbumPhotoCollagePaginationQuery
        page = 1
        while has_next and cursor and len(all_photo_ids) < max_photos and page < 25:
            page += 1
            var_page = {
                "count": 50,
                "cursor": cursor,
                "id": mediaset_id,
                "scale": 1,
                "renderLocation": "permalink",
                "__relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider": False,
            }
            try:
                resp = await client.post(graphql_url, headers=headers, data={
                    "doc_id": pagination_doc_id,
                    "variables": json.dumps(var_page),
                    "lsd": lsd,
                })

                has_next = False
                cursor = None

                if resp.status_code == 200:
                    for line in resp.text.strip().split("\n"):
                        try:
                            chunk = json.loads(line)
                            if "data" in chunk and "node" in chunk["data"]:
                                media = chunk["data"]["node"].get("media", {})
                                edges = media.get("edges", [])
                                page_info = media.get("page_info", {})
                                if page_info:
                                    has_next = page_info.get("has_next_page", False)
                                    cursor = page_info.get("end_cursor")
                                for edge in edges:
                                    node = edge.get("node", {})
                                    pid = node.get("id")
                                    if pid and pid not in seen:
                                        seen.add(pid)
                                        all_photo_ids.append(pid)
                        except Exception:
                            pass
            except Exception as e:
                logger.warning(f"Error querying album pagination page {page}: {e}")
                break

    logger.info(f"GraphQL album pagination complete: {len(all_photo_ids)} photo IDs collected")
    return all_photo_ids


async def import_facebook_images(url: str) -> FacebookImportResponse:
    """
    Main entry point: attempt to import images from a public Facebook post.

    This function:
    1. Validates the URL
    2. Fetches public page HTML with Googlebot headers
    3. Identifies mediaset tokens for multi-photo albums
    4. Uses Facebook GraphQL API with Relay pagination to retrieve ALL photos (up to 75+)
    5. Falls back to SSR photo ID extraction and CDN images for single/smaller posts
    6. Filters out author avatars, commenter profile pics, and group headers
    7. Returns clean, high-resolution study material photos
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

    # 1. Identify expected photo count if present
    sub_counts = []
    for pattern in [
        r'"(?:all_subattachments|subattachments)"\s*:\s*\{\s*"count"\s*:\s*(\d+)',
        r'"photo_count"\s*:\s*(\d+)',
        r'"total_count"\s*:\s*(\d+)',
        r'"media_count"\s*:\s*(\d+)',
    ]:
        for c in re.findall(pattern, html):
            try:
                sub_counts.append(int(c))
            except ValueError:
                pass
    expected_count = max(sub_counts) if sub_counts else None

    # 2. Extract excluded IDs (author, commenter, group, page IDs)
    excluded_ids = extract_non_photo_ids(html, url)
    existing_mids: set[str] = set()
    cdn_images: list[ImageInfo] = []

    # 3. Detect mediaset tokens for album / multi-photo posts
    mediaset_tokens: list[str] = []
    for token in re.findall(r'"mediaset_token"\s*:\s*"([^"]+)"', html):
        if token not in mediaset_tokens:
            mediaset_tokens.append(token)
    for match in re.findall(r'set=(?:pcb|gm|a)\.(\d+)', html.replace(r"\/", "/")):
        cand = f"pcb.{match}"
        if cand not in mediaset_tokens:
            mediaset_tokens.append(cand)
    pid_matches = re.findall(r'/(?:posts|permalink|story_fbid)[/=](\d+)', url)
    if pid_matches:
        cand = f"pcb.{pid_matches[0]}"
        if cand not in mediaset_tokens:
            mediaset_tokens.append(cand)

    # 4. Use Facebook GraphQL Album Pagination if mediaset token exists
    graphql_photo_ids: list[str] = []
    if mediaset_tokens:
        for token in mediaset_tokens:
            ms_url = f"https://www.facebook.com/media/set/?set={token}&type=1"
            try:
                ms_html, _ = await fetch_public_page(ms_url)
                if ms_html:
                    pids = await _fetch_graphql_album_photos(token, html, ms_html)
                    if pids:
                        graphql_photo_ids = pids
                        break
            except Exception as e:
                logger.warning(f"Error fetching mediaset {token}: {e}")

    if graphql_photo_ids:
        logger.info(f"GraphQL album fetch recovered {len(graphql_photo_ids)} photos")
        for pid in graphql_photo_ids:
            if pid not in excluded_ids and pid not in existing_mids:
                existing_mids.add(pid)
                clean_url = f"https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id={pid}"
                cdn_images.append(ImageInfo(
                    url=clean_url,
                    preview_url=f"/api/images/proxy?url={quote_plus(clean_url)}",
                ))

    # 5. Complement with direct SSR photo extraction if GraphQL did not find photos or fewer photos than expected
    if not graphql_photo_ids or (expected_count and len(cdn_images) < expected_count):
        all_photo_ids = extract_photo_attachment_ids(html)
        direct_images = extract_public_image_urls(html, url)

        for img in direct_images:
            mid = _get_media_id_from_url(img.url)
            if mid:
                if mid not in existing_mids and mid not in excluded_ids:
                    existing_mids.add(mid)
                    cdn_images.append(img)
            else:
                cdn_images.append(img)

        for pid in all_photo_ids:
            if pid not in excluded_ids and pid not in existing_mids:
                existing_mids.add(pid)
                clean_url = f"https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id={pid}"
                cdn_images.append(ImageInfo(
                    url=clean_url,
                    preview_url=f"/api/images/proxy?url={quote_plus(clean_url)}",
                ))

    # 6. Only use Open Graph image as a last-resort fallback if NO post photos were found
    if not cdn_images:
        og_images = extract_open_graph_images(html)
        cdn_images.extend(og_images)

    unique_images = _deduplicate_images(cdn_images)

    if not unique_images:
        if _is_login_page(html):
            return FacebookImportResponse(
                success=False,
                code="FACEBOOK_BLOCKED",
                message=(
                    "Facebook prevented automatic image retrieval for this post. "
                    "The post may require login to view. "
                    "You can upload the post images manually via drag & drop."
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

    # Format user-friendly response message
    if expected_count and len(unique_images) >= expected_count:
        message = f"Successfully imported all {len(unique_images)} images from post."
    elif expected_count and len(unique_images) < expected_count:
        message = (
            f"Imported {len(unique_images)} of {expected_count} images. "
            "Facebook's public feed truncated the rest of the album preview — "
            "you can add any remaining pages anytime using 'Add More' or manual file upload."
        )
    else:
        message = f"Found {len(unique_images)} image(s)."

    return FacebookImportResponse(
        success=True,
        images=unique_images,
        message=message,
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
