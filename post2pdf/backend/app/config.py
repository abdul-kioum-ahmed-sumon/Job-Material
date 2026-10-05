import os
from dotenv import load_dotenv

load_dotenv()

# CORS
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Upload limits
MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "15"))
MAX_IMAGES: int = int(os.getenv("MAX_IMAGES", "200"))
MAX_TOTAL_UPLOAD_MB: int = int(os.getenv("MAX_TOTAL_UPLOAD_MB", "100"))

# Computed byte limits
MAX_IMAGE_SIZE_BYTES: int = MAX_IMAGE_SIZE_MB * 1024 * 1024
MAX_TOTAL_UPLOAD_BYTES: int = MAX_TOTAL_UPLOAD_MB * 1024 * 1024

# Facebook
FACEBOOK_REQUEST_TIMEOUT: int = int(os.getenv("FACEBOOK_REQUEST_TIMEOUT", "30"))

# Rate limiting
RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "30"))
RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

import tempfile

# Temporary file directory
TEMP_DIR: str = os.getenv("TEMP_DIR", os.path.join(tempfile.gettempdir(), "post2pdf"))

# Allowed image MIME types
ALLOWED_MIME_TYPES: set = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}

# Allowed image extensions
ALLOWED_EXTENSIONS: set = {
    ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
}
