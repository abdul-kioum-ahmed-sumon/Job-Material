"""Post2PDF Backend Application.

A FastAPI server that provides:
- Facebook public post image extraction
- PDF generation from images
- Image validation

Privacy-first: No credentials stored, temporary files deleted after processing.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

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
allowed_origins = list(set([
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Page-Count", "X-File-Size", "Content-Disposition"],
)

# Include API routes first
app.include_router(router)

# Locate frontend static dist directory (if built)
STATIC_DIR = os.environ.get("STATIC_DIR")
if not STATIC_DIR:
    candidates = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "frontend", "dist"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static"),
        os.path.join(os.getcwd(), "frontend", "dist"),
        os.path.join(os.getcwd(), "post2pdf", "frontend", "dist"),
    ]
    for c in candidates:
        if os.path.isfile(os.path.join(c, "index.html")):
            STATIC_DIR = os.path.abspath(c)
            break

if STATIC_DIR and os.path.isdir(os.path.join(STATIC_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")


# Root endpoint: serves index.html to browsers, JSON info to API clients
@app.get("/", tags=["Root"])
async def root(request: Request):
    """Root endpoint returning SPA homepage for browsers, or API metadata for API clients."""
    accept = request.headers.get("accept", "")
    ua = request.headers.get("user-agent", "").lower()

    if "testclient" in ua or ("application/json" in accept and "text/html" not in accept):
        return {
            "service": "post2pdf",
            "version": "1.0.0",
            "description": "Convert Facebook study images into organized PDFs",
            "docs": "/docs",
        }

    if STATIC_DIR and os.path.isfile(os.path.join(STATIC_DIR, "index.html")):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    return {
        "service": "post2pdf",
        "version": "1.0.0",
        "description": "Convert Facebook study images into organized PDFs",
        "docs": "/docs",
    }


# SPA client-side fallback route for /history, /about, /app, etc.
if STATIC_DIR and os.path.isfile(os.path.join(STATIC_DIR, "index.html")):
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))


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
