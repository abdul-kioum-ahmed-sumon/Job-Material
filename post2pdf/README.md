<div align="center">

# 📄 Post2PDF

**Convert multi-image Facebook study materials & notes into clean, organized PDFs.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![Render Deploy](https://img.shields.io/badge/Deploy-Render.com-46E3B7.svg?logo=render)](https://render.com)

*Designed for job exam candidates (BCS, Bank, Government, Teacher Registration) and students in South Asia revising Facebook notes offline.*

[Live Demo](#render-deployment) • [Features](#key-features) • [Local Setup](#local-development) • [Deployment](#render-deployment-step-by-step) • [Privacy](#privacy--security)

</div>

---

## 📖 Overview

In Bangladesh and across South Asia, high-yield exam preparation notes, handwritten solutions, and model tests are frequently published across Facebook public groups and pages as image galleries (5 to 40+ slides). Reading these on Facebook is distracting, burns mobile data, and makes revision difficult.

**Post2PDF** solves this with a streamlined two-pronged workflow:
1. **Public Facebook Post URL Import:** Paste a link to a public post; Post2PDF safely fetches public Open Graph and CDN image references.
2. **100% Reliable Manual Fallback:** Drag & drop screenshots or saved photos directly into the browser with zero external dependencies.

Once imported, users can reorder via drag-and-drop, rotate misaligned photos 90°, customize PDF dimensions (A4, Letter, Original Ratio), choose multi-image grids (1, 2, or 4 images per page), configure margins, and download an uncompressed, razor-sharp PDF.

---

## 🖼️ Application Preview

```text
┌────────────────────────────────────────────────────────────────────────┐
│  📄 Post2PDF                   [Home]  [My PDFs]  [About]   [ 🌙 ]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│               Convert Facebook Study Images into a PDF                 │
│                                                                        │
│     [ https://www.facebook.com/groups/jobstudy/posts/123...  ] [Fetch] │
│                                                                        │
│     ────────────────────────────── OR ──────────────────────────────   │
│                                                                        │
│           ┌──────────────────────────────────────────────┐             │
│           │   📁 Drag & drop study images or screenshots │             │
│           │            Supports: JPG, PNG, WEBP          │             │
│           └──────────────────────────────────────────────┘             │
│                                                                        │
│  Selected Images (4)                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Page 01  │  │ Page 02  │  │ Page 03  │  │ Page 04  │                │
│  │ [↷] [✕]  │  │ [↷] [✕]  │  │ [↷] [✕]  │  │ [↷] [✕]  │                │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                │
│                                                                        │
│  PDF Settings:  [ A4 / Letter ]   [ 1 / 2 / 4 per page ]  [ Margin ]   │
│                                                                        │
│                     [ 📥 Generate & Download PDF ]                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- **Public Facebook Import:** Automatically extracts public Open Graph and Facebook CDN image URLs without requiring user login or passwords.
- **100% Reliable Manual Fallback:** Independent client-side file picker and drag-and-drop zone for JPG, PNG, and WebP images.
- **Interactive Image Reordering:** Smooth drag-and-drop sorting powered by `@dnd-kit`.
- **90° Clockwise Rotation:** Fix misoriented phone scans or mobile screenshots instantly with canvas transformations.
- **Customizable PDF Formatting:**
  - **Page Sizes:** A4 (default standard), US Letter, or Original Image Ratio.
  - **Layouts:** 1 image/page, 2 images/page (vertical stack), 4 images/page (2x2 grid).
  - **Fit Modes:** Fit to page (preserves aspect ratio, no cropping), Fill page, or Original.
  - **Margins:** None (0mm), Small (5mm), Medium (10mm).
  - **Quality Levels:** High (95% JPEG quality, optimal text clarity) or Standard (80%).
- **Browser-Local PDF History:** Previously generated PDFs are cataloged in browser **IndexedDB** without needing an external database or account login. View, rename, re-download, or delete saved PDFs.
- **Responsive & Dark Mode:** Hand-tailored UI for Mobile, Tablet, and Desktop with System, Light, and Dark themes.
- **Bangla Support & Terminology:** Includes guidance for Bangladeshi job aspirants and multilingual labels.

---

## 🛡️ Privacy & Facebook Policy Reality

### The Facebook Scraping Reality (Section 6 & 17)
> **Notice:** Automatic Facebook image retrieval works exclusively on **publicly accessible posts** where Facebook serves image metadata without requiring an authenticated user session.
>
> Facebook anti-bot heuristics frequently display login walls or block automated HTTP crawlers on posts inside private groups or restricted profiles. **When this occurs, Post2PDF gracefully alerts the user with an actionable message to use the manual upload fallback.**

### Strict Privacy Architecture
- ❌ **No Facebook Credentials:** We never request, collect, or store Facebook passwords, session tokens, or personal cookies.
- 🔒 **Client-Side Generation:** For manually uploaded images, PDF generation is executed **entirely within the user's browser** via `jsPDF`. Images never touch a remote server.
- ⚡ **Zero Permanent Server Storage:** When server-side generation is invoked for remote Facebook CDN images, files are processed strictly in RAM and deleted immediately upon HTTP response transmission.
- 🛡️ **SSRF Protection:** Backend validates all URLs, blocking localhost (`127.0.0.1`), private RFC1918 subnets, and non-HTTP protocols.

---

## 🏗️ Architecture & Tech Stack

```text
post2pdf/
├── frontend/             # Single Page Application (SPA)
│   ├── React 19 + TypeScript
│   ├── Vite 8
│   ├── Tailwind CSS v4
│   ├── @dnd-kit (drag & drop reordering)
│   ├── jsPDF (client-side PDF generation)
│   ├── idb (IndexedDB local storage)
│   ├── Lucide React (accessible modern icons)
│   └── React Router DOM v7
│
├── backend/              # Python FastAPI Microservice
│   ├── Python 3.11 / 3.12
│   ├── FastAPI + Uvicorn
│   ├── Pydantic v2 (schema validation)
│   ├── httpx (async HTTP requests)
│   ├── BeautifulSoup4 + lxml (safe HTML metadata parser)
│   ├── Pillow (image orientation & EXIF rotation)
│   └── ReportLab (server-side PDF layout generator)
│
├── render.yaml           # Infrastructure as Code (Render Blueprint)
└── Dockerfile            # Container definition for Python backend
```

---

## 📁 Repository Structure

```text
post2pdf/
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── _redirects              # Static SPA rewrite for Render
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx          # Navigation, theme toggle, logo
│   │   │   ├── Footer.tsx          # Privacy disclaimer, Bengali tagline
│   │   │   ├── ImportSection.tsx   # Facebook URL bar & drag-drop upload
│   │   │   ├── ImageGrid.tsx       # Reorderable grid container
│   │   │   ├── SortableImageCard.tsx # Image card with rotate, remove, badge
│   │   │   ├── PDFSettingsPanel.tsx# Page size, layout, margin settings
│   │   │   └── ProgressOverlay.tsx # Generation loader & download modal
│   │   ├── hooks/
│   │   │   ├── useImages.ts        # Image management & ordering logic
│   │   │   └── useTheme.ts         # Light/Dark/System theme management
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # Complete conversion workflow
│   │   │   ├── HistoryPage.tsx     # IndexedDB saved PDF manager
│   │   │   └── AboutPage.tsx       # Privacy, limitations & study context
│   │   ├── services/
│   │   │   ├── api.ts              # Axios client with interceptors
│   │   │   ├── facebook.ts         # Facebook import client
│   │   │   ├── pdf.ts              # Client-side jsPDF & server generator
│   │   │   └── storage.ts          # IndexedDB service with idb
│   │   ├── types/                  # TypeScript interfaces
│   │   ├── utils/                  # ID generator, formatters, helpers
│   │   ├── App.tsx                 # Router & layout provider
│   │   ├── main.tsx                # React entrypoint
│   │   └── index.css               # Design system & Tailwind styling
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py           # HTTP endpoints (/health, /import, /pdf)
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── facebook_importer.py# Facebook metadata & CDN extractor
│   │   │   └── pdf_generator.py    # ReportLab PDF engine
│   │   ├── utils/
│   │   │   ├── rate_limiter.py     # In-memory sliding window rate limiter
│   │   │   └── security.py         # SSRF protection, URL & MIME validator
│   │   ├── config.py               # Environment configuration
│   │   └── main.py                 # FastAPI application factory & CORS
│   ├── tests/
│   │   └── test_api.py             # Unit & integration test suite
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile                  # Containerized deployment
│
├── render.yaml                     # Render.com Blueprint deployment spec
├── .gitignore                      # Git ignore rules
├── .env.example                    # Example environment variables
├── LICENSE                         # MIT License
└── README.md                       # Documentation
```

---

## 🚀 Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or v3.12

### 1. Clone Repository
```bash
git clone https://github.com/your-username/post2pdf.git
cd post2pdf
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Health Check: `http://127.0.0.1:8000/health`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
- Open browser at: `http://localhost:5173`

---

## 🧪 Testing

### Run Backend Unit Tests
```bash
cd backend
.\.venv\Scripts\python -m unittest tests/test_api.py
```
*Tests verify URL security, SSRF prevention, path sanitization, root endpoints, health checks, single/multi-page PDF generation, and image rotation.*

### Run Frontend Production Build Validation
```bash
cd frontend
npm run build
```
*Validates TypeScript compilation (`tsc -b`) and asset bundling via Vite.*

---

## 🌐 API Documentation

### `GET /health`
Returns system health status.
```json
{
  "status": "ok",
  "service": "post2pdf",
  "version": "1.0.0"
}
```

### `POST /api/facebook/import`
Extracts public image links from a Facebook post URL.
- **Request Body:**
  ```json
  {
    "url": "https://www.facebook.com/sample/posts/123456789"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "images": [
      { "url": "https://scontent.xx.fbcdn.net/...", "width": 1200, "height": 800 }
    ],
    "message": "Found 1 image(s)."
  }
  ```
- **Response (Blocked/Private):**
  ```json
  {
    "success": false,
    "code": "FACEBOOK_BLOCKED",
    "message": "Facebook prevented automatic image retrieval for this post. You can upload the post images manually instead."
  }
  ```

### `POST /api/pdf/generate`
Generates a PDF on the server for remote image URLs or large batches.
- **Request Body:**
  ```json
  {
    "images": [
      { "url": "https://...", "rotation": 0, "order": 0 }
    ],
    "page_size": "a4",
    "layout": "1",
    "image_fit": "fit",
    "margin": "small",
    "quality": "high",
    "filename": "Study_Notes_BCS"
  }
  ```
- **Response:** Raw binary PDF stream (`application/pdf`) with headers `X-Page-Count` and `Content-Disposition`.

---

## ☁️ Render Deployment (Step-by-Step)

The project includes a production-ready `render.yaml` Blueprint specification.

### 1. Push Code to GitHub
```bash
git add .
git commit -m "feat: complete production-ready Post2PDF app"
git branch -M main
git remote add origin https://github.com/<your-username>/post2pdf.git
git push -u origin main
```

### 2. Deploy via Render Blueprint
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → Select **Blueprint**.
3. Connect your GitHub repository (`post2pdf`).
4. Render automatically parses `render.yaml` and sets up two services:
   - **`post2pdf-backend`** (Python Web Service)
   - **`post2pdf-frontend`** (Static Site with SPA rewrite rules)
5. Click **Apply**.

### 3. Connect Environment Variables
1. Once `post2pdf-backend` is created, copy its public URL (e.g. `https://post2pdf-backend.onrender.com`).
2. Go to **`post2pdf-frontend`** → **Environment** → Set:
   ```env
   VITE_API_URL=https://post2pdf-backend.onrender.com
   ```
3. Go to **`post2pdf-backend`** → **Environment** → Set:
   ```env
   FRONTEND_URL=https://post2pdf-frontend.onrender.com
   ```
4. Trigger a manual deploy on the frontend to apply the backend URL.

---

## 🔒 Security Measures

- **In-Memory Rate Limiting:** Sliding-window rate limiter on `/api/facebook/import` and `/api/pdf/generate` (configurable via `RATE_LIMIT_REQUESTS=30` per `RATE_LIMIT_WINDOW_SECONDS=60`).
- **SSRF Prevention:** Blocks requests to private networks, loopback addresses (`127.0.0.1`), metadata endpoints, and link-local ranges.
- **MIME & Extension Whitelisting:** Enforces JPEG, PNG, and WebP types; verifies magic bytes on decoded images.
- **Path Traversal Protection:** Filenames are sanitized via `sanitize_filename` before inclusion in HTTP headers.
- **Configurable Upload Caps:** Configurable maximum file sizes (default: 15 MB/image, 100 MB/request, 100 images/request).

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `FACEBOOK_BLOCKED` response | Facebook bot detection or post requires login | Use the **Manual Upload** option: save images or take screenshots and drop them in the upload zone. |
| CORS error in browser console | `FRONTEND_URL` on backend does not match frontend origin | Set `FRONTEND_URL` in backend environment variables to your deployed frontend domain. |
| Client-side PDF generation fails on giant batch | Browser memory exhaustion on 50+ very high-res files | Choose **Standard Quality** or let the server generate the PDF via the fallback pipeline. |
| SPA page refresh returns 404 on Render | Missing static rewrite rule | Ensured by `public/_redirects` and `routes: [type: rewrite]` in `render.yaml`. |

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
