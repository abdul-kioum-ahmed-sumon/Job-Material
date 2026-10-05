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

</div>

---

## 📖 Quick Links

- **Main Application Code:** [`post2pdf/`](file:///c:/Users/sumon/Desktop/Job-Material/post2pdf)
  - Frontend (React + TypeScript + Vite + Tailwind CSS): [`post2pdf/frontend/`](file:///c:/Users/sumon/Desktop/Job-Material/post2pdf/frontend)
  - Backend (Python + FastAPI + ReportLab + Pillow): [`post2pdf/backend/`](file:///c:/Users/sumon/Desktop/Job-Material/post2pdf/backend)
- **Deployment Blueprint:** [`render.yaml`](file:///c:/Users/sumon/Desktop/Job-Material/render.yaml) & [`post2pdf/render.yaml`](file:///c:/Users/sumon/Desktop/Job-Material/post2pdf/render.yaml)
- **Comprehensive Documentation:** [`post2pdf/README.md`](file:///c:/Users/sumon/Desktop/Job-Material/post2pdf/README.md)

---

## 🚀 Quick Start

### Backend
```bash
cd post2pdf/backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Health Check: `http://localhost:8000/health`  
API Docs: `http://localhost:8000/docs`

### Frontend
```bash
cd post2pdf/frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.