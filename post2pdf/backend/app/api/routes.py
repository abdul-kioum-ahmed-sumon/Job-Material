"""API routes for Facebook image import, PDF generation, and health checks."""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response, JSONResponse

from app.models.schemas import (
    FacebookImportRequest,
    FacebookImportResponse,
    PDFGenerateRequest,
    PDFGenerateResponse,
    HealthResponse,
)
from app.services.facebook_importer import import_facebook_images
from app.services.pdf_generator import create_pdf
from app.utils.rate_limiter import RateLimiter
from app.config import MAX_IMAGES, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS

logger = logging.getLogger(__name__)

router = APIRouter()

# Rate limiters
facebook_limiter = RateLimiter(
    max_requests=RATE_LIMIT_REQUESTS,
    window_seconds=RATE_LIMIT_WINDOW_SECONDS,
)
pdf_limiter = RateLimiter(
    max_requests=RATE_LIMIT_REQUESTS,
    window_seconds=RATE_LIMIT_WINDOW_SECONDS,
)


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ─── Health ──────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse()


# ─── Facebook Import ─────────────────────────────────────────────

@router.post(
    "/api/facebook/import",
    response_model=FacebookImportResponse,
    tags=["Facebook"],
    summary="Import images from a public Facebook post",
    description=(
        "Attempts to extract publicly accessible images from a Facebook post. "
        "Does NOT bypass authentication, CAPTCHA, or privacy restrictions. "
        "Returns an error if Facebook blocks access."
    ),
)
async def facebook_import(body: FacebookImportRequest, request: Request):
    """Import images from a public Facebook post URL."""
    client_ip = _get_client_ip(request)

    if not facebook_limiter.is_allowed(client_ip):
        remaining = facebook_limiter.reset_time(client_ip)
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Too many requests. Please try again later.",
                "retry_after_seconds": round(remaining) if remaining else 60,
            },
        )

    result = await import_facebook_images(body.url)
    return result


# ─── PDF Generation ──────────────────────────────────────────────

@router.post(
    "/api/pdf/generate",
    tags=["PDF"],
    summary="Generate a PDF from images",
    description="Generate a PDF document from uploaded or imported images with customizable settings.",
)
async def generate_pdf(body: PDFGenerateRequest, request: Request):
    """Generate a PDF from the provided images."""
    client_ip = _get_client_ip(request)

    if not pdf_limiter.is_allowed(client_ip):
        remaining = pdf_limiter.reset_time(client_ip)
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Too many requests. Please try again later.",
                "retry_after_seconds": round(remaining) if remaining else 60,
            },
        )

    # Validate image count
    if len(body.images) == 0:
        raise HTTPException(status_code=400, detail="At least one image is required.")

    if len(body.images) > MAX_IMAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_IMAGES} images allowed per request.",
        )

    # Validate each image has data or URL
    for i, img in enumerate(body.images):
        if not img.image_data and not img.url:
            raise HTTPException(
                status_code=400,
                detail=f"Image at index {i} has no image data or URL.",
            )

    try:
        pdf_bytes, page_count, error = await create_pdf(
            images=body.images,
            page_size=body.page_size,
            layout=body.layout,
            image_fit=body.image_fit,
            margin=body.margin,
            quality=body.quality,
        )

        if error or pdf_bytes is None:
            raise HTTPException(
                status_code=500,
                detail=error or "Failed to generate PDF.",
            )

        # Generate filename
        filename = body.filename
        if not filename:
            now = datetime.now()
            filename = f"Post2PDF_{now.strftime('%Y-%m-%d_%H-%M')}.pdf"
        elif not filename.endswith(".pdf"):
            filename += ".pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Page-Count": str(page_count),
                "X-File-Size": str(len(pdf_bytes)),
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating the PDF. Please try again.",
        )


# ─── Image Validation ────────────────────────────────────────────

@router.post(
    "/api/images/validate",
    tags=["Images"],
    summary="Validate image URLs",
    description="Check if image URLs are accessible and valid.",
)
async def validate_images(body: dict, request: Request):
    """Validate that image URLs are accessible."""
    import httpx
    from app.utils.security import is_safe_image_url

    urls = body.get("urls", [])
    if not urls:
        return {"valid": [], "invalid": []}

    valid = []
    invalid = []

    async with httpx.AsyncClient(timeout=10) as client:
        for url in urls[:MAX_IMAGES]:
            if not is_safe_image_url(url):
                invalid.append(url)
                continue
            try:
                resp = await client.head(url, follow_redirects=True)
                content_type = resp.headers.get("content-type", "")
                if resp.status_code == 200 and content_type.startswith("image/"):
                    valid.append(url)
                else:
                    invalid.append(url)
            except Exception:
                invalid.append(url)

    return {"valid": valid, "invalid": invalid}
