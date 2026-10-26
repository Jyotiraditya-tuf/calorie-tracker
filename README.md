# NutriLens AI - Calorie & Nutrition Tracker

[![Live Demo](https://img.shields.io/badge/Demo-Live_on_Vercel-success?style=for-the-badge&logo=vercel)](https://calorie-tracker-theta-lemon.vercel.app/)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-blue?style=for-the-badge&logo=react)](https://calorie-tracker-theta-lemon.vercel.app/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://calorie-tracker-theta-lemon.vercel.app/)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75C2?style=for-the-badge&logo=googlegemini)](https://calorie-tracker-theta-lemon.vercel.app/)
[![Database](https://img.shields.io/badge/Storage-Cloud_Sync_+_SQLite-003B57?style=for-the-badge&logo=sqlite)](https://calorie-tracker-theta-lemon.vercel.app/)

> **🌐 Live Deployment:** [https://calorie-tracker-theta-lemon.vercel.app/](https://calorie-tracker-theta-lemon.vercel.app/)

A full-stack, multimodal AI Calorie and Nutrition Tracker web application built with **Python FastAPI** and **React (Vite) + Tailwind CSS**, powered by the Google GenAI SDK (`gemini-3.5-flash`) with structured outputs for real-time plate decomposition, macro estimation, dynamic nutrition coaching, and persistent multi-device cloud synchronization.

---

## Highlights & Features

- **Multimodal AI Plate Decomposition (`gemini-3.5-flash`)**:
  - Upload a meal photo, snap directly using HTML5 camera (`facingMode: "environment"`) or 1-tap phone camera capture, or enter descriptive food notes.
  - Automatically identifies, separates, and decomposes complex plates into distinct food components with estimated portions and macros.
  - Specifically trained with deep clinical knowledge for Indian dishes (Yellow Moong Dal, Masala Dosa, Sambhar, Chutneys, Phulkas, Chole, Poha, Biryani) and international cuisines.
  - Dynamic fallback architecture ensures high-throughput reliability across `gemini-3.5-flash`, `gemini-3.5-flash-lite`, and `gemini-flash-lite-latest`.
- **USP 1: Interactive Multi-Item Plate Editor**:
  - Review decomposed plate components prior to logging.
  - Adjust portion multipliers (`0.75x`, `1.25x`, `1.5x`), edit macros inline, remove false detections, or add missing ingredients with live recalculation.
- **USP 2: 1-Tap Clarification Chips**:
  - When visual confidence is medium or low due to preparation ambiguity (e.g. whole milk vs. skim milk, oil-free vs. butter sautéed, ghee tadka vs. oil), clickable clarification chips let you refine the meal with one tap.
- **USP 3: Dynamic Macro Coaching Bar**:
  - Real-time comparison against customizable daily targets (Calories, Protein, Carbs, Fat, Fiber).
  - Contextual nutrition advice adapting to remaining macronutrient deficits before your next meal.
- **Multi-Device Cloud Synchronization (Permanent Storage)**:
  - Local-first architecture: instant offline responsiveness with automatic background cloud synchronization.
  - **1-Tap Sync Code Pairing**: Generate a memorable Sync Code (e.g., `NUTRI-AB8921`) and enter it on your phone or laptop to automatically link and synchronize all your meals and targets.
  - Supports FastAPI SQLite database sync, Firebase Firestore cloud sync, and offline JSON backup export/restore.
- **Graceful Fallback**:
  - Includes a fallback mock engine so the UI works seamlessly for development and testing even before a Gemini API key is configured or when offline.

---

## Project Structure

```
calorie-tracker/
├── backend/
│   ├── main.py              # FastAPI app with CORS, /api/analyze & /api/sync endpoints
│   ├── database.py          # Persistent SQLite database & two-way sync engine
│   ├── models.py            # Pydantic schemas (FoodItem, MealTotals, FoodAnalysisResult)
│   ├── gemini_service.py    # Google GenAI SDK integration with structured outputs
│   └── requirements.txt     # Backend dependencies
├── frontend/
│   ├── index.html           # HTML shell with responsive viewport
│   ├── vite.config.js       # Vite configuration with backend proxy
│   ├── tailwind.config.js   # Tailwind CSS theme configuration & dark mode
│   ├── src/
│   │   ├── App.jsx          # Root dashboard, modal orchestrator, and state
│   │   ├── main.jsx         # React DOM entry point
│   │   ├── index.css        # Tailwind styles and custom utilities
│   │   ├── components/      # Modular UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── MacroDashboard.jsx
│   │   │   ├── CameraModal.jsx
│   │   │   ├── PlateEditor.jsx
│   │   │   ├── ClarificationChips.jsx
│   │   │   ├── MealTimeline.jsx
│   │   │   ├── GoalSettingsModal.jsx
│   │   │   ├── BackupModal.jsx
│   │   │   ├── ApiSettingsModal.jsx
│   │   │   └── CloudSyncModal.jsx
│   │   ├── services/        # API client, localStorage, and cloudSync engine
│   │   └── types/           # Preset goals, categories, and utility helpers
│   └── package.json
├── .env.example             # Environment variable template
├── .gitignore               # Clean root git ignore
└── README.md                # Project documentation
```

---

## Multi-Device Cloud Synchronization

NutriLens uses a **Local-First + Cloud-Sync** hybrid architecture:
1. **Instant Offline Speed**: Meals are saved immediately to device storage so the interface never stutters or lags.
2. **Device Pairing with Sync Code**:
   - Tap the **Cloud icon (☁️)** in the top navigation bar.
   - Click **"Generate Code"** to receive your unique Sync Code (e.g. `NUTRI-XY8421`).
   - Enter that same code on any other phone, tablet, or PC to link them.
   - All meal entries, portion adjustments, and macro targets automatically merge across devices!
3. **Enterprise Firebase Firestore (Optional)**:
   - Provide your Firebase Project ID and Web API Key in the Cloud Sync Modal to store your data directly in your private Firebase Firestore cloud.

---

## Quickstart Guide

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (3.10+)

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root (or in `/backend/.env`):
```bash
cp .env.example .env
```
Add your Google Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
HOST=0.0.0.0
PORT=8000
```
*(If left empty or with the default placeholder, the backend runs in realistic Demo Fallback mode so the interface can be tested instantly).*

---

### 3. Start the FastAPI Backend

In a terminal, navigate to `/backend`:
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
Backend will start on `http://localhost:8000`. You can verify API docs at `http://localhost:8000/docs`.

---

### 4. Start the React Frontend

In another terminal, navigate to `/frontend`:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Live Deployment (Vercel)

The frontend is deployed on Vercel at:
👉 **[https://calorie-tracker-theta-lemon.vercel.app/](https://calorie-tracker-theta-lemon.vercel.app/)**

### Building Frontend for Production
```bash
cd frontend
npm run build
```
Build output is saved to `/frontend/dist/`.

---

## API Endpoints

### `GET /health`
Returns service status and Gemini API key configuration:
```json
{
  "status": "healthy",
  "gemini_configured": true,
  "database_ready": true,
  "model": "gemini-3.5-flash"
}
```

### `POST /api/analyze`
Multimodal food analysis endpoint:
- **`image`** (Multipart file, optional): Image of plate or food item.
- **`text`** (Form string, optional): Optional context (e.g. *"1 katori yellow moong dal tadka with 2 rotis"*).

### `POST /api/sync/generate-id`
Generates a unique 6-character alphanumeric sync code for cross-device linking:
```json
{
  "sync_id": "NUTRI-XY8421"
}
```

### `GET /api/sync/{sync_id}`
Fetches all stored meal logs and macro goals for a specific sync ID.

### `POST /api/sync/{sync_id}`
Synchronizes client logs and targets, merges with cloud data, and returns the unified state:
```json
{
  "sync_id": "NUTRI-XY8421",
  "logs": { ... },
  "goals": { ... },
  "updated_at": "2026-10-26T08:15:00Z"
}
```
