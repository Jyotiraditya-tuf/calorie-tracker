# NutriLens AI - Calorie & Nutrition Tracker

A full-stack, multimodal AI Calorie and Nutrition Tracker web application built with **Python FastAPI** and **React (Vite) + Tailwind CSS**, powered by the Google GenAI SDK (`gemini-2.5-flash`) with structured outputs for real-time plate decomposition, macro estimation, and dynamic nutrition coaching.

---

## Highlights & Features

- **Multimodal AI Plate Decomposition (`gemini-2.5-flash`)**:
  - Upload a meal photo, snap directly using HTML5 camera (`facingMode: "environment"`), or enter descriptive food notes.
  - Automatically identifies, separates, and decomposes complex plates into distinct food components with estimated portions and macros.
- **USP 1: Interactive Multi-Item Plate Editor**:
  - Review decomposed plate components prior to logging.
  - Adjust portion multipliers (`0.75x`, `1.25x`, `1.5x`), edit macros inline, remove false detections, or add missing ingredients with live recalculation.
- **USP 2: 1-Tap Clarification Chips**:
  - When visual confidence is medium or low due to preparation ambiguity (e.g. whole milk vs. skim milk, oil-free vs. butter sautéed), clickable clarification chips let you refine the meal with one tap.
- **USP 3: Dynamic Macro Coaching Bar**:
  - Real-time comparison against customizable daily targets (Calories, Protein, Carbs, Fat, Fiber).
  - Contextual nutrition advice adapting to remaining macronutrient deficits before your next meal.
- **Full-Day Tracking & Persistence**:
  - Grouped meal slots (`Breakfast`, `Lunch`, `Dinner`, `Snacks`) with timestamps.
  - Multi-day calendar navigator (`YYYY-MM-DD`).
  - Offline-ready `localStorage` persistence with one-click JSON backup export and restore.
- **Graceful Fallback**:
  - Includes a fallback mock engine so the UI works immediately for development and testing even before a Gemini API key is configured.

---

## Project Structure

```
calorie-tracker/
├── backend/
│   ├── main.py              # FastAPI app with CORS & /api/analyze endpoint
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
│   │   │   └── BackupModal.jsx
│   │   ├── services/        # API client and localStorage persistence
│   │   └── types/           # Preset goals, categories, and utility helpers
│   └── package.json
├── .env.example             # Environment variable template
├── .gitignore               # Clean root git ignore
└── README.md                # Project documentation
```

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
GEMINI_MODEL=gemini-2.5-flash
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

## API Endpoints

### `GET /health`
Returns service status and Gemini API key configuration:
```json
{
  "status": "healthy",
  "gemini_configured": true,
  "model": "gemini-2.5-flash"
}
```

### `POST /api/analyze`
Multimodal food analysis endpoint:
- **`image`** (Multipart file, optional): Image of plate or food item.
- **`text`** (Form string, optional): Optional context (e.g. *"200g grilled paneer with brown basmati rice and 1 tsp olive oil"*).

**Response format (`FoodAnalysisResult`):**
```json
{
  "meal_name": "Grilled Paneer & Roasted Veggie Bowl",
  "confidence": "high",
  "clarification_chips": [
    "Paneer made with whole milk",
    "Low-fat paneer",
    "Tofu substitute"
  ],
  "items": [
    {
      "name": "Spiced Grilled Paneer",
      "estimated_portion": "180g (6 cubes)",
      "calories": 465,
      "protein_g": 32.4,
      "carbs_g": 6.2,
      "fat_g": 36.0,
      "fiber_g": 0.0
    },
    {
      "name": "Steamed Brown Basmati Rice",
      "estimated_portion": "1 cup cooked (195g)",
      "calories": 215,
      "protein_g": 5.0,
      "carbs_g": 45.0,
      "fat_g": 1.6,
      "fiber_g": 3.5
    }
  ],
  "totals": {
    "calories": 680,
    "protein_g": 37.4,
    "carbs_g": 51.2,
    "fat_g": 37.6,
    "fiber_g": 3.5
  },
  "coach_tip": "Great high-protein vegetarian meal! Pair with a squeeze of fresh lemon to boost iron absorption from the veggies."
}
```

---

## Verification & Build
To build the frontend for production:
```bash
cd frontend
npm run build
```
Build output is saved to `/frontend/dist/`.
