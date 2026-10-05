"""Tests for Post2PDF backend."""

import base64
import io
import unittest
from PIL import Image as PILImage
from starlette.testclient import TestClient

from app.main import app
from app.services.facebook_importer import validate_facebook_url
from app.utils.security import is_facebook_url, is_valid_url, is_safe_url, sanitize_filename


def create_test_image_base64(color="red", size=(200, 200), format="JPEG") -> str:
    """Generate a valid base64 image data URL."""
    buf = io.BytesIO()
    img = PILImage.new("RGB", size, color=color)
    img.save(buf, format=format)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


class TestSecurityUtils(unittest.TestCase):
    def test_url_validation(self):
        self.assertTrue(is_valid_url("https://www.facebook.com/post/123"))
        self.assertTrue(is_valid_url("http://example.com/image.jpg"))
        self.assertFalse(is_valid_url("not-a-url"))
        self.assertFalse(is_valid_url("ftp://example.com"))

    def test_facebook_url_detection(self):
        self.assertTrue(is_facebook_url("https://www.facebook.com/groups/123/posts/456"))
        self.assertTrue(is_facebook_url("https://facebook.com/photo.php?fbid=123"))
        self.assertTrue(is_facebook_url("https://m.facebook.com/story.php"))
        self.assertFalse(is_facebook_url("https://google.com"))
        self.assertFalse(is_facebook_url("https://fakefacebook.com"))

    def test_ssrf_prevention(self):
        self.assertFalse(is_safe_url("http://localhost:8000"))
        self.assertFalse(is_safe_url("http://127.0.0.1:8000"))
        self.assertFalse(is_safe_url("http://0.0.0.0:8000"))
        self.assertFalse(is_safe_url("http://[::1]:8000"))
        self.assertTrue(is_safe_url("https://www.facebook.com"))

    def test_sanitize_filename(self):
        self.assertEqual(sanitize_filename("../../etc/passwd"), "passwd")
        self.assertEqual(sanitize_filename("my file (1).pdf"), "my file _1_.pdf")


class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["service"], "post2pdf")

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")

    def test_facebook_import_invalid_url(self):
        response = self.client.post("/api/facebook/import", json={"url": "https://google.com"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["code"], "INVALID_URL")

    def test_pdf_generation_single_image(self):
        img_b64 = create_test_image_base64("blue", (300, 400))
        payload = {
            "images": [
                {
                    "image_data": img_b64,
                    "rotation": 0,
                    "order": 0,
                    "filename": "page1.jpg",
                }
            ],
            "page_size": "a4",
            "layout": "1",
            "image_fit": "fit",
            "margin": "small",
            "quality": "high",
            "filename": "test_output",
        }
        response = self.client.post("/api/pdf/generate", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))
        self.assertEqual(response.headers.get("x-page-count"), "1")

    def test_pdf_generation_with_rotation_and_layout(self):
        img1 = create_test_image_base64("red", (200, 200))
        img2 = create_test_image_base64("green", (200, 200))
        payload = {
            "images": [
                {"image_data": img1, "rotation": 90, "order": 0},
                {"image_data": img2, "rotation": 180, "order": 1},
            ],
            "page_size": "a4",
            "layout": "2",
            "image_fit": "fit",
            "margin": "none",
            "quality": "standard",
            "filename": "multi_image",
        }
        response = self.client.post("/api/pdf/generate", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.content.startswith(b"%PDF"))
        self.assertEqual(response.headers.get("x-page-count"), "1")


if __name__ == "__main__":
    unittest.main()
