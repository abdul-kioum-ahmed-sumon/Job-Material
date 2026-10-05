from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from enum import Enum


# ─── Facebook Import ─────────────────────────────────────────────

class FacebookImportRequest(BaseModel):
    url: str = Field(..., description="Facebook public post URL")


class ImageInfo(BaseModel):
    url: str
    width: Optional[int] = None
    height: Optional[int] = None


class FacebookImportResponse(BaseModel):
    success: bool
    images: list[ImageInfo] = []
    code: Optional[str] = None
    message: Optional[str] = None


# ─── PDF Generation ──────────────────────────────────────────────

class PageSize(str, Enum):
    A4 = "a4"
    LETTER = "letter"
    ORIGINAL = "original"


class Layout(str, Enum):
    ONE_PER_PAGE = "1"
    TWO_PER_PAGE = "2"
    FOUR_PER_PAGE = "4"


class ImageFit(str, Enum):
    FIT = "fit"
    FILL = "fill"
    ORIGINAL = "original"


class Margin(str, Enum):
    NONE = "none"
    SMALL = "small"
    MEDIUM = "medium"


class Quality(str, Enum):
    STANDARD = "standard"
    HIGH = "high"


class PDFImageItem(BaseModel):
    image_data: Optional[str] = Field(None, description="Base64-encoded image data")
    url: Optional[str] = Field(None, description="Remote image URL")
    rotation: int = Field(0, description="Rotation in degrees (0, 90, 180, 270)")
    order: int = Field(0, description="Image order in PDF")
    filename: Optional[str] = None


class PDFGenerateRequest(BaseModel):
    images: list[PDFImageItem]
    page_size: PageSize = PageSize.A4
    layout: Layout = Layout.ONE_PER_PAGE
    image_fit: ImageFit = ImageFit.FIT
    margin: Margin = Margin.SMALL
    quality: Quality = Quality.HIGH
    filename: Optional[str] = None


class PDFGenerateResponse(BaseModel):
    success: bool
    filename: Optional[str] = None
    page_count: Optional[int] = None
    size_bytes: Optional[int] = None
    message: Optional[str] = None


# ─── Health Check ────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "post2pdf"


# ─── Validation ──────────────────────────────────────────────────

class ImageValidateRequest(BaseModel):
    urls: list[str] = Field(default_factory=list)


class ImageValidateResponse(BaseModel):
    valid: list[str] = []
    invalid: list[str] = []
