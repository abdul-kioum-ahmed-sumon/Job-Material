"""Post2PDF Backend Application.

A FastAPI server that provides:
- Facebook public post image extraction
- PDF generation from images
- Image validation

Privacy-first: No credentials stored, temporary files deleted after processing.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import FRONTEND_URL
from app.api.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Post2PDF backend starting up...")
    logger.info(f"CORS allowed origin: {FRONTEND_URL}")
    yield
    logger.info("Post2PDF backend shutting down...")


app = FastAPI(
    title="Post2PDF API",
    description=(
        "Convert Facebook study images into organized PDFs. "
        "Supports public Facebook post image import and manual image upload."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
allowed_origins = [FRONTEND_URL]
# Always allow localhost for development
if "localhost" not in FRONTEND_URL:
    allowed_origins.extend([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Page-Count", "X-File-Size", "Content-Disposition"],
)

# Include routes
app.include_router(router)


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint returning service information."""
    return {
        "service": "post2pdf",
        "version": "1.0.0",
        "description": "Convert Facebook study images into organized PDFs",
        "docs": "/docs",
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle unhandled exceptions gracefully."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
        },
    )
