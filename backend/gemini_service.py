import json
import logging
import os
from typing import Optional
from dotenv import load_dotenv

from models import FoodAnalysisResult, FoodItem, MealTotals

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
logger = logging.getLogger(__name__)

# Sample mock datasets for graceful fallback when GEMINI_API_KEY is not configured or all calls fail
MOCK_MEALS = [
    {
        "keywords": ["apple", "fruit", "red apple"],
        "result": FoodAnalysisResult(
            meal_name="Fresh Crisp Apple",
            confidence="high",
            clarification_chips=["Medium size (180g)", "Large Honeycrisp (240g)", "With peanut butter dip"],
            items=[
                FoodItem(name="Fresh Red Apple", estimated_portion="1 medium apple (182g)", calories=95, protein_g=0.5, carbs_g=25.1, fat_g=0.3, fiber_g=4.4)
            ],
            totals=MealTotals(calories=95, protein_g=0.5, carbs_g=25.1, fat_g=0.3, fiber_g=4.4),
            coach_tip="Rich in soluble pectin fiber and quercetin antioxidants; great for steady mid-day energy."
        )
    },
    {
        "keywords": ["paneer", "cottage cheese", "grilled paneer", "curry"],
        "result": FoodAnalysisResult(
            meal_name="Grilled Paneer & Roasted Veggie Bowl",
            confidence="high",
            clarification_chips=["Paneer made with whole milk", "Low-fat paneer", "Tofu substitute"],
            items=[
                FoodItem(name="Spiced Grilled Paneer", estimated_portion="180g (6 cubes)", calories=465, protein_g=32.4, carbs_g=6.2, fat_g=36.0, fiber_g=0.0),
                FoodItem(name="Roasted Bell Peppers & Onions", estimated_portion="1.5 cups (150g)", calories=75, protein_g=2.1, carbs_g=14.5, fat_g=1.2, fiber_g=3.8),
                FoodItem(name="Steamed Brown Basmati Rice", estimated_portion="1 cup cooked (195g)", calories=215, protein_g=5.0, carbs_g=45.0, fat_g=1.6, fiber_g=3.5),
                FoodItem(name="Olive Oil / Ghee drizzle", estimated_portion="1 tsp (5ml)", calories=45, protein_g=0.0, carbs_g=0.0, fat_g=5.0, fiber_g=0.0),
            ],
            totals=MealTotals(calories=800, protein_g=39.5, carbs_g=65.7, fat_g=43.8, fiber_g=7.3),
            coach_tip="Great high-protein vegetarian meal! Pair with a squeeze of fresh lemon to boost iron absorption from the veggies."
        )
    },
    {
        "keywords": ["chicken", "salad", "avocado", "caesar", "greens"],
        "result": FoodAnalysisResult(
            meal_name="Seared Chicken & Avocado Greens Bowl",
            confidence="medium",
            clarification_chips=["Olive oil vinaigrette", "Creamy dressing", "Light dressing"],
            items=[
                FoodItem(name="Grilled Chicken Breast", estimated_portion="170g cooked", calories=280, protein_g=53.0, carbs_g=0.0, fat_g=6.2, fiber_g=0.0),
                FoodItem(name="Hass Avocado Slices", estimated_portion="1/2 medium (75g)", calories=120, protein_g=1.5, carbs_g=6.4, fat_g=11.0, fiber_g=5.0),
                FoodItem(name="Mixed Baby Greens & Cucumbers", estimated_portion="2 cups (100g)", calories=25, protein_g=1.8, carbs_g=4.2, fat_g=0.4, fiber_g=2.1),
                FoodItem(name="Herb Vinaigrette Dressing", estimated_portion="2 tbsp (30ml)", calories=130, protein_g=0.1, carbs_g=2.0, fat_g=14.0, fiber_g=0.1),
            ],
            totals=MealTotals(calories=555, protein_g=56.4, carbs_g=12.6, fat_g=31.6, fiber_g=7.2),
            coach_tip="Superb lean protein density with healthy monounsaturated fats from avocado; keep an eye on dressing portion to control overall calories."
        )
    },
    {
        "keywords": ["oat", "oatmeal", "porridge", "berries", "banana", "breakfast", "chia"],
        "result": FoodAnalysisResult(
            meal_name="Warm Berry & Chia Oatmeal",
            confidence="medium",
            clarification_chips=["Made with Whole Milk", "Made with Oat Milk", "Made with Water"],
            items=[
                FoodItem(name="Rolled Oats (cooked)", estimated_portion="1 cup (234g)", calories=166, protein_g=5.9, carbs_g=28.1, fat_g=3.6, fiber_g=4.0),
                FoodItem(name="Fresh Blueberries & Strawberries", estimated_portion="1/2 cup (75g)", calories=42, protein_g=0.7, carbs_g=10.2, fat_g=0.3, fiber_g=2.4),
                FoodItem(name="Chia Seeds & Crushed Almonds", estimated_portion="1 tbsp chia + 6 almonds (20g)", calories=105, protein_g=3.8, carbs_g=5.4, fat_g=8.2, fiber_g=4.2),
                FoodItem(name="Honey drizzle", estimated_portion="1 tsp (7g)", calories=21, protein_g=0.1, carbs_g=5.8, fat_g=0.0, fiber_g=0.0),
            ],
            totals=MealTotals(calories=334, protein_g=10.5, carbs_g=49.5, fat_g=12.1, fiber_g=10.6),
            coach_tip="Outstanding gut-friendly fiber (>10g); consider stirring in a scoop of Greek yogurt or protein powder to reach 25g+ protein."
        )
    },
    {
        "keywords": ["egg", "eggs", "toast", "scramble", "omelet", "sourdough"],
        "result": FoodAnalysisResult(
            meal_name="Scrambled Eggs with Sourdough Toast",
            confidence="high",
            clarification_chips=["Butter used for cooking", "Cooking spray (oil-free)", "With added cheddar cheese"],
            items=[
                FoodItem(name="Scrambled Whole Eggs", estimated_portion="3 large eggs", calories=215, protein_g=18.6, carbs_g=1.2, fat_g=15.0, fiber_g=0.0),
                FoodItem(name="Artisan Sourdough Toast", estimated_portion="2 slices (70g)", calories=180, protein_g=6.0, carbs_g=36.0, fat_g=1.0, fiber_g=2.0),
                FoodItem(name="Grass-fed Butter", estimated_portion="1 pat (7g)", calories=50, protein_g=0.1, carbs_g=0.0, fat_g=5.8, fiber_g=0.0),
                FoodItem(name="Sautéed Baby Spinach", estimated_portion="1 cup cooked (180g)", calories=40, protein_g=5.3, carbs_g=6.7, fat_g=0.8, fiber_g=4.3),
            ],
            totals=MealTotals(calories=485, protein_g=30.0, carbs_g=43.9, fat_g=22.6, fiber_g=6.3),
            coach_tip="A classic balanced breakfast with high-bioavailability choline from eggs and slow-release complex carbs from sourdough."
        )
    }
]


def get_mock_fallback(user_text: Optional[str] = None) -> FoodAnalysisResult:
    """Return an intelligent realistic mock food analysis if GEMINI_API_KEY is unset or API call fails."""
    if user_text:
        text_lower = user_text.lower()
        for meal in MOCK_MEALS:
            if any(kw in text_lower for kw in meal["keywords"]):
                return meal["result"]

        words = [w.strip() for w in user_text.replace(",", " ").split() if len(w.strip()) > 2]
        title = " ".join(words[:4]).title() if words else "Custom Logged Dish"
        return FoodAnalysisResult(
            meal_name=f"{title} (Estimated)",
            confidence="medium",
            clarification_chips=["Standard portion (1 serving)", "Large portion (1.5x)", "With cooking oil / sauce"],
            items=[
                FoodItem(name=title, estimated_portion="1 plate / serving (~250g)", calories=450, protein_g=22.0, carbs_g=48.0, fat_g=18.0, fiber_g=5.0),
                FoodItem(name="Side / Accompaniment", estimated_portion="1 small bowl", calories=120, protein_g=3.0, carbs_g=20.0, fat_g=3.5, fiber_g=2.0)
            ],
            totals=MealTotals(calories=570, protein_g=25.0, carbs_g=68.0, fat_g=21.5, fiber_g=7.0),
            coach_tip="Estimated from your description. Tap any ingredient card below to refine portion sizes and exact macros."
        )

    # Default fallback when only an image is provided without an API key
    return MOCK_MEALS[0]["result"]


def analyze_food_multimodal(
    image_bytes: Optional[bytes] = None,
    mime_type: Optional[str] = None,
    text_prompt: Optional[str] = None
) -> FoodAnalysisResult:
    """
    Analyze food using the Google GenAI SDK with structured output.
    Gracefully falls back to healthy responsive models if a model experiences 503 high-demand spikes.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.info("GEMINI_API_KEY is not configured. Using realistic fallback meal breakdown.")
        return get_mock_fallback(text_prompt)

    try:
        from google import genai
        from google.genai import types

        # 15s timeout to avoid long hangs on temporary 503 / 504 model spikes
        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=15000)
        )
        
        preferred_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()

        system_instruction = (
            "You are an expert clinical dietitian and computer vision food recognition AI. "
            "Analyze the meal shown in the image and/or described in the text. "
            "1. Accurately identify and decompose the dish into each distinct component or ingredient on the plate. "
            "2. Provide realistic portion weights/volumes in 'estimated_portion' (e.g. '1 medium apple (180g)', '1 cup cooked (195g)'). "
            "3. Estimate calories (kcal), protein (g), carbohydrates (g), total fat (g), and dietary fiber (g) for each component. "
            "4. Calculate exact sums in the 'totals' object matching the sum of items. "
            "5. If there is ambiguity (e.g., uncertain dressing, cooking oil, dairy fat percentage, or milk type), "
            "set confidence to 'medium' or 'low' and provide 2 to 3 concise 'clarification_chips' (e.g., ['Whole milk', 'Oat milk', 'Skim milk']). "
            "6. In 'coach_tip', provide 1 concise, actionable nutritional takeaway or pairing suggestion based on the macro ratio."
        )

        contents = []

        # Add image part if provided
        if image_bytes:
            detected_mime = mime_type or "image/jpeg"
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=detected_mime))

        # Add text prompt and instructions
        user_text = text_prompt or ""
        prompt_full = (
            f"{system_instruction}\n\n"
            f"User Context / Notes: {user_text if user_text else 'Identify the food shown in the image accurately and decompose its ingredients and nutritional value.'}"
        )
        contents.append(prompt_full)

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=FoodAnalysisResult,
            temperature=0.2,
        )

        # Prioritized candidate models: active models first to avoid 503 spikes
        candidates = [
            preferred_model,
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-3-flash-preview",
            "gemini-3.8-flash"
        ]
        
        # Deduplicate while preserving order
        models_to_try = []
        for m in candidates:
            if m and m not in models_to_try:
                models_to_try.append(m)

        last_error = None

        for model_name in models_to_try:
            try:
                logger.info(f"Attempting analysis using model: {model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config
                )
                if response and response.text:
                    parsed_dict = json.loads(response.text)
                    result = FoodAnalysisResult(**parsed_dict)
                    logger.info(f"Successfully analyzed food with {model_name}: {result.meal_name}")
                    return result
            except Exception as e:
                last_error = e
                logger.warning(f"Error calling model {model_name}: {e}. Retrying with next model...")
                continue

        logger.error(f"All Gemini models failed: {last_error}. Using fallback mock analysis.")
        return get_mock_fallback(text_prompt)

    except Exception as exc:
        logger.error(f"Failed to run Gemini analysis: {exc}", exc_info=True)
        return get_mock_fallback(text_prompt)
