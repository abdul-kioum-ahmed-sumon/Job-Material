"""PDF generation service using ReportLab.

Handles:
- Multiple page sizes (A4, Letter, Original)
- Multiple layouts (1, 2, or 4 images per page)
- Image fitting modes (fit, fill, original)
- Margins
- Image rotation
- Quality preservation
"""

import io
import base64
import logging
import math
from typing import Optional

import httpx
from PIL import Image as PILImage
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import mm, inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from app.models.schemas import (
    PDFImageItem,
    PageSize,
    Layout,
    ImageFit,
    Margin,
    Quality,
)
from app.utils.security import is_safe_image_url

logger = logging.getLogger(__name__)

# Margin values in points (1 point = 1/72 inch)
MARGIN_VALUES = {
    Margin.NONE: 0,
    Margin.SMALL: 15 * mm,
    Margin.MEDIUM: 25 * mm,
}

# JPEG quality levels
QUALITY_VALUES = {
    Quality.STANDARD: 80,
    Quality.HIGH: 95,
}


def _get_page_size(page_size: PageSize) -> tuple[float, float]:
    """Get the page dimensions in points."""
    if page_size == PageSize.A4:
        return A4  # (595.27, 841.89)
    elif page_size == PageSize.LETTER:
        return letter  # (612, 792)
    else:
        return A4  # Default, will be overridden for ORIGINAL


def _apply_rotation(img: PILImage.Image, rotation: int) -> PILImage.Image:
    """Apply rotation to a PIL Image. Rotation is clockwise in degrees."""
    rotation = rotation % 360
    if rotation == 0:
        return img
    # PIL rotates counter-clockwise, so negate
    return img.rotate(-rotation, expand=True)


def _fix_orientation(img: PILImage.Image) -> PILImage.Image:
    """Fix image orientation based on EXIF data."""
    try:
        exif = img.getexif()
        if exif:
            orientation = exif.get(274)  # 274 = Orientation tag
            transforms = {
                2: (PILImage.FLIP_LEFT_RIGHT,),
                3: (PILImage.ROTATE_180,),
                4: (PILImage.FLIP_TOP_BOTTOM,),
                5: (PILImage.FLIP_LEFT_RIGHT, PILImage.ROTATE_90),
                6: (PILImage.ROTATE_270,),
                7: (PILImage.FLIP_LEFT_RIGHT, PILImage.ROTATE_270),
                8: (PILImage.ROTATE_90,),
            }
            if orientation in transforms:
                for t in transforms[orientation]:
                    img = img.transpose(t)
    except Exception:
        pass
    return img


async def _load_image_from_url(url: str) -> Optional[PILImage.Image]:
    """Download and load an image from a URL with multiple crawler/browser header fallbacks."""
    if not is_safe_image_url(url):
        logger.warning(f"Unsafe image URL rejected: {url}")
        return None

    headers_list = [
        {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "image/*,*/*;q=0.8",
            "Referer": "https://www.facebook.com/",
        },
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Referer": "https://www.facebook.com/",
        },
        {
            "User-Agent": "Twitterbot/1.0",
            "Accept": "image/*,*/*;q=0.8",
            "Referer": "https://www.facebook.com/",
        },
    ]

    for headers in headers_list:
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200 and len(response.content) > 100:
                    img = PILImage.open(io.BytesIO(response.content))
                    img = _fix_orientation(img)
                    return img
                logger.warning(f"Download attempt returned status {response.status_code} for {url[:70]}")
        except Exception as e:
            logger.warning(f"Error downloading image from URL: {e}")

    logger.error(f"All download attempts failed for image URL: {url[:70]}")
    return None


def _load_image_from_base64(data: str) -> Optional[PILImage.Image]:
    """Load an image from base64-encoded data."""
    try:
        # Handle data URI format
        if "," in data:
            data = data.split(",", 1)[1]
        raw = base64.b64decode(data)
        img = PILImage.open(io.BytesIO(raw))
        img = _fix_orientation(img)
        return img
    except Exception as e:
        logger.error(f"Error loading base64 image: {e}")
        return None


def calculate_image_dimensions(
    img_width: int,
    img_height: int,
    slot_width: float,
    slot_height: float,
    fit_mode: ImageFit,
) -> tuple[float, float, float, float]:
    """
    Calculate the position and size for an image within a slot.

    Returns: (x, y, draw_width, draw_height) relative to slot origin.
    """
    if fit_mode == ImageFit.ORIGINAL:
        # Use original size, centered in slot
        draw_width = min(img_width, slot_width)
        draw_height = min(img_height, slot_height)
        # Maintain aspect ratio if we had to shrink
        if img_width > slot_width or img_height > slot_height:
            ratio = min(slot_width / img_width, slot_height / img_height)
            draw_width = img_width * ratio
            draw_height = img_height * ratio
        x = (slot_width - draw_width) / 2
        y = (slot_height - draw_height) / 2
        return x, y, draw_width, draw_height

    aspect_img = img_width / img_height
    aspect_slot = slot_width / slot_height

    if fit_mode == ImageFit.FIT:
        # Fit entirely within slot, preserving aspect ratio
        if aspect_img > aspect_slot:
            draw_width = slot_width
            draw_height = slot_width / aspect_img
        else:
            draw_height = slot_height
            draw_width = slot_height * aspect_img
    elif fit_mode == ImageFit.FILL:
        # Fill the slot, cropping if necessary
        if aspect_img > aspect_slot:
            draw_height = slot_height
            draw_width = slot_height * aspect_img
        else:
            draw_width = slot_width
            draw_height = slot_width / aspect_img
    else:
        draw_width = slot_width
        draw_height = slot_height

    x = (slot_width - draw_width) / 2
    y = (slot_height - draw_height) / 2

    return x, y, draw_width, draw_height


def _get_slot_positions(
    page_width: float,
    page_height: float,
    margin: float,
    layout: Layout,
) -> list[tuple[float, float, float, float]]:
    """
    Calculate slot positions for the given layout.

    Returns list of (x, y, width, height) for each slot on the page.
    Y is from bottom in ReportLab coordinates.
    """
    usable_w = page_width - 2 * margin
    usable_h = page_height - 2 * margin
    gap = 5 * mm if margin > 0 else 0

    if layout == Layout.ONE_PER_PAGE:
        return [(margin, margin, usable_w, usable_h)]

    elif layout == Layout.TWO_PER_PAGE:
        slot_h = (usable_h - gap) / 2
        return [
            (margin, margin + slot_h + gap, usable_w, slot_h),  # Top
            (margin, margin, usable_w, slot_h),                  # Bottom
        ]

    elif layout == Layout.FOUR_PER_PAGE:
        slot_w = (usable_w - gap) / 2
        slot_h = (usable_h - gap) / 2
        return [
            (margin, margin + slot_h + gap, slot_w, slot_h),                  # Top-left
            (margin + slot_w + gap, margin + slot_h + gap, slot_w, slot_h),   # Top-right
            (margin, margin, slot_w, slot_h),                                  # Bottom-left
            (margin + slot_w + gap, margin, slot_w, slot_h),                   # Bottom-right
        ]

    return [(margin, margin, usable_w, usable_h)]


async def create_pdf(
    images: list[PDFImageItem],
    page_size: PageSize = PageSize.A4,
    layout: Layout = Layout.ONE_PER_PAGE,
    image_fit: ImageFit = ImageFit.FIT,
    margin: Margin = Margin.SMALL,
    quality: Quality = Quality.HIGH,
) -> tuple[Optional[bytes], int, Optional[str]]:
    """
    Generate a PDF from a list of images.

    Returns:
        (pdf_bytes, page_count, error_message)
    """
    # Sort by order
    sorted_images = sorted(images, key=lambda x: x.order)

    # Load all PIL images
    pil_images: list[PILImage.Image] = []

    for item in sorted_images:
        img = None
        if item.image_data:
            img = _load_image_from_base64(item.image_data)
        elif item.url:
            img = await _load_image_from_url(item.url)

        if img is None:
            logger.warning(f"Skipping unloadable image (order={item.order})")
            continue

        # Apply user rotation
        if item.rotation:
            img = _apply_rotation(img, item.rotation)

        # Convert to RGB for PDF compatibility
        if img.mode in ("RGBA", "P", "LA"):
            background = PILImage.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        pil_images.append(img)

    if not pil_images:
        return None, 0, "No valid images could be loaded."

    # Get page dimensions
    base_page_w, base_page_h = _get_page_size(page_size)
    margin_val = MARGIN_VALUES[margin]
    jpeg_quality = QUALITY_VALUES[quality]

    # Determine slots per page
    slots_per_page = int(layout.value)

    # Calculate total pages
    total_pages = math.ceil(len(pil_images) / slots_per_page)

    # Create PDF buffer
    buffer = io.BytesIO()

    # Build pages
    img_index = 0

    # For "original" page size, we set each page to the image size
    if page_size == PageSize.ORIGINAL and slots_per_page == 1:
        c = canvas.Canvas(buffer)
        for img in pil_images:
            page_w = float(img.width)
            page_h = float(img.height)
            c.setPageSize((page_w, page_h))

            # Convert PIL to ReportLab ImageReader
            img_buffer = io.BytesIO()
            img.save(img_buffer, format="JPEG", quality=jpeg_quality, optimize=True)
            img_buffer.seek(0)
            img_reader = ImageReader(img_buffer)

            c.drawImage(
                img_reader,
                margin_val,
                margin_val,
                page_w - 2 * margin_val,
                page_h - 2 * margin_val,
                preserveAspectRatio=True,
            )
            c.showPage()
        c.save()
    else:
        c = canvas.Canvas(buffer, pagesize=(base_page_w, base_page_h))

        while img_index < len(pil_images):
            slots = _get_slot_positions(base_page_w, base_page_h, margin_val, layout)

            for slot_x, slot_y, slot_w, slot_h in slots:
                if img_index >= len(pil_images):
                    break

                img = pil_images[img_index]
                img_index += 1

                # Calculate dimensions
                x_off, y_off, draw_w, draw_h = calculate_image_dimensions(
                    img.width, img.height, slot_w, slot_h, image_fit
                )

                # Convert to JPEG bytes for embedding
                img_buffer = io.BytesIO()
                img.save(img_buffer, format="JPEG", quality=jpeg_quality, optimize=True)
                img_buffer.seek(0)
                img_reader = ImageReader(img_buffer)

                # Draw image
                draw_x = slot_x + x_off
                draw_y = slot_y + y_off

                # For FILL mode, clip to slot
                if image_fit == ImageFit.FILL:
                    c.saveState()
                    path = c.beginPath()
                    path.rect(slot_x, slot_y, slot_w, slot_h)
                    path.close()
                    c.clipPath(path, stroke=0, fill=0)
                    c.drawImage(img_reader, draw_x, draw_y, draw_w, draw_h)
                    c.restoreState()
                else:
                    c.drawImage(img_reader, draw_x, draw_y, draw_w, draw_h)

            c.showPage()

        c.save()

    pdf_bytes = buffer.getvalue()
    return pdf_bytes, total_pages, None
