# 🛠️ Samling AI Installation Guide

This document provides step-by-step instructions to set up the **Samling AI** project locally, covering both the frontend and backend.

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10 or higher)
- **pip** (Python package installer)

---

## 🖥️ Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be running at `http://localhost:5173`.*

---

## ⚙️ Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   * **Linux/macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
   * **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
5. Run the database migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend API will be running at `http://127.0.0.1:8000`. You can access the interactive Swagger documentation at `http://127.0.0.1:8000/docs`.*

---

## 🤖 AI Development Guidelines

For the AI development team working inside the `backend/app/ai` directory:

1. **Environment:** Always make sure the backend virtual environment (`.venv`) is activated before installing packages or running scripts.
2. **Dependencies:** If you need new packages (e.g., `openai`, `torch`, `transformers`), install them and update the requirements list:
   ```bash
   pip install <package-name>
   pip freeze > requirements.txt
   ```
3. **Model Weights Policy:** Do **NOT** commit large model files (such as `.pt`, `.bin`, `.safetensors`, `.onnx`) to Git. Keep them locally in the `backend/app/ai/models/` directory or load them from external storage.
4. **Detailed Guide:** Read the local `backend/app/ai/README.md` for folder structure, coding conventions, and integration patterns.