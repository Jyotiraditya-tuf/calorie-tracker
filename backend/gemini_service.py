import json
import logging
import os
from typing import Optional
from dotenv import load_dotenv

from models import FoodAnalysisResult, FoodItem, MealTotals

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
logger = logging.getLogger(__name__)

# Comprehensive nutrition dataset for Indian and global dishes
MOCK_MEALS = [
    {
        "keywords": ["moong dal", "yellow dal", "dal tadka", "lentil dal", "daal", "tadka dal"],
        "result": FoodAnalysisResult(
            meal_name="Yellow Moong Dal Tadka with Phulkas & Rice",
            confidence="high",
            clarification_chips=["Cooked with Desi Ghee", "Tempered with Cooking Oil", "Yellow Moong Dal vs Toor Dal"],
            items=[
                FoodItem(name="Yellow Moong Dal (Tadka)", estimated_portion="1 medium katori (180g)", calories=165, protein_g=9.2, carbs_g=22.0, fat_g=4.5, fiber_g=5.0),
                FoodItem(name="Whole Wheat Phulkas / Rotis", estimated_portion="2 rotis (60g)", calories=150, protein_g=5.8, carbs_g=30.2, fat_g=0.8, fiber_g=4.2),
                FoodItem(name="Steamed Basmati Rice", estimated_portion="1/2 cup cooked (100g)", calories=130, protein_g=2.7, carbs_g=28.2, fat_g=0.3, fiber_g=0.6),
                FoodItem(name="Ghee / Oil Tadka (Jeera, Garlic, Hing)", estimated_portion="1 tsp (5ml)", calories=45, protein_g=0.0, carbs_g=0.0, fat_g=5.0, fiber_g=0.0),
            ],
            totals=MealTotals(calories=490, protein_g=17.7, carbs_g=80.4, fat_g=10.6, fiber_g=9.8),
            coach_tip="Yellow moong dal is gentle on the stomach and rich in plant protein; combining it with whole grain roti provides a complete amino acid profile."
        )
    },
    {
        "keywords": ["dosa", "masala dosa", "plain dosa", "crispy dosa", "mysore masala dosa"],
        "result": FoodAnalysisResult(
            meal_name="Crispy Masala Dosa with Sambhar & Chutneys",
            confidence="high",
            clarification_chips=["Plain Dosa (No potato filling)", "Masala Dosa (With Aloo filling)", "Roasted in Ghee / Butter"],
            items=[
                FoodItem(name="Fermented Crispy Rice & Urad Dal Dosa", estimated_portion="1 large dosa (120g)", calories=165, protein_g=4.2, carbs_g=28.5, fat_g=3.8, fiber_g=1.8),
                FoodItem(name="Spiced Potato Onion Masala (Aloo Bhaji)", estimated_portion="1/2 cup (100g)", calories=125, protein_g=2.1, carbs_g=19.5, fat_g=4.5, fiber_g=2.4),
                FoodItem(name="Vegetable Toor Dal Sambhar", estimated_portion="1 small katori (120ml)", calories=75, protein_g=3.5, carbs_g=11.2, fat_g=2.0, fiber_g=3.0),
                FoodItem(name="Fresh Coconut Chutney", estimated_portion="2 tbsp (30g)", calories=60, protein_g=0.8, carbs_g=2.2, fat_g=5.4, fiber_g=1.5),
                FoodItem(name="Tomato Onion Kara Chutney", estimated_portion="2 tbsp (30g)", calories=30, protein_g=0.6, carbs_g=4.5, fat_g=1.1, fiber_g=1.0),
            ],
            totals=MealTotals(calories=455, protein_g=11.2, carbs_g=65.9, fat_g=16.8, fiber_g=9.7),
            coach_tip="Fermented dosa batter provides beneficial natural probiotics; enjoy with a generous bowl of sambhar to maximize vegetable fiber and protein."
        )
    },
    {
        "keywords": ["idli", "idlis", "sambhar idli", "vada sambhar"],
        "result": FoodAnalysisResult(
            meal_name="Steamed Idli Platter with Vegetable Sambhar & Coconut Chutney",
            confidence="high",
            clarification_chips=["With Medu Vada (+150 kcal)", "2 Idlis only", "Ghee Podi Idli"],
            items=[
                FoodItem(name="Steamed Rice & Urad Dal Idlis", estimated_portion="3 medium idlis (150g)", calories=175, protein_g=5.8, carbs_g=35.5, fat_g=0.8, fiber_g=2.5),
                FoodItem(name="Vegetable Sambhar with Drumsticks & Squash", estimated_portion="1 medium katori (150ml)", calories=95, protein_g=4.5, carbs_g=14.0, fat_g=2.5, fiber_g=3.8),
                FoodItem(name="Fresh Coconut Chutney", estimated_portion="2 tbsp (30g)", calories=60, protein_g=0.8, carbs_g=2.2, fat_g=5.4, fiber_g=1.5)
            ],
            totals=MealTotals(calories=330, protein_g=11.1, carbs_g=51.7, fat_g=8.7, fiber_g=7.8),
            coach_tip="Idlis are steamed and virtually oil-free; pairing them with fiber-packed lentil sambhar keeps post-meal glucose steady."
        )
    },
    {
        "keywords": ["chole", "chana", "chickpea", "rajma", "chana masala"],
        "result": FoodAnalysisResult(
            meal_name="Punjabi Chole Masala with Steamed Rice & Salad",
            confidence="high",
            clarification_chips=["Served with 1 Bhatura (+280 kcal)", "Served with Steamed Basmati", "Served with 2 Rotis"],
            items=[
                FoodItem(name="Punjabi Spiced Chickpea Curry (Chole)", estimated_portion="1 medium katori (200g)", calories=280, protein_g=13.5, carbs_g=38.0, fat_g=8.5, fiber_g=9.5),
                FoodItem(name="Steamed White Basmati Rice", estimated_portion="1 cup cooked (180g)", calories=210, protein_g=4.2, carbs_g=45.0, fat_g=0.5, fiber_g=1.0),
                FoodItem(name="Sliced Onion & Tomato Salad with Lemon", estimated_portion="1 small plate (60g)", calories=20, protein_g=0.8, carbs_g=4.2, fat_g=0.2, fiber_g=1.4)
            ],
            totals=MealTotals(calories=510, protein_g=18.5, carbs_g=87.2, fat_g=9.2, fiber_g=11.9),
            coach_tip="Chickpeas are an outstanding source of resistant starch and provide ~13.5g of filling plant protein."
        )
    },
    {
        "keywords": ["poha", "kanda poha", "flattened rice", "aval"],
        "result": FoodAnalysisResult(
            meal_name="Kanda Poha with Peanuts & Mustard Tadka",
            confidence="high",
            clarification_chips=["With Diced Potatoes (Aloo Poha)", "Standard Kanda Poha", "With Extra Peanuts"],
            items=[
                FoodItem(name="Tempered Flattened Rice (Poha) with Onions", estimated_portion="1.5 cups (180g)", calories=230, protein_g=4.2, carbs_g=42.0, fat_g=5.5, fiber_g=3.0),
                FoodItem(name="Roasted Crunchy Peanuts", estimated_portion="1 tbsp (15g)", calories=85, protein_g=3.8, carbs_g=2.4, fat_g=7.2, fiber_g=1.2),
                FoodItem(name="Fresh Coriander & Lemon Squeeze", estimated_portion="Garnish (15g)", calories=5, protein_g=0.2, carbs_g=1.0, fat_g=0.0, fiber_g=0.4)
            ],
            totals=MealTotals(calories=320, protein_g=8.2, carbs_g=45.4, fat_g=12.7, fiber_g=4.6),
            coach_tip="The peanuts provide healthy unsaturated fats and protein to balance out the easily digestible carbohydrates from poha."
        )
    },
    {
        "keywords": ["roti", "chapati", "phulka", "sabzi", "thali"],
        "result": FoodAnalysisResult(
            meal_name="Balanced Indian Thali (Rotis, Mixed Sabzi & Dal)",
            confidence="high",
            clarification_chips=["Rotis with Desi Ghee (+70 kcal)", "Dry roasted Phulkas (No ghee)", "Added 1/2 cup Rice"],
            items=[
                FoodItem(name="Whole Wheat Tawa Rotis", estimated_portion="2 rotis (65g)", calories=160, protein_g=6.0, carbs_g=32.0, fat_g=1.0, fiber_g=4.4),
                FoodItem(name="Seasonal Mixed Vegetable Sabzi", estimated_portion="1 katori (150g)", calories=110, protein_g=2.8, carbs_g=14.5, fat_g=4.8, fiber_g=4.0),
                FoodItem(name="Cooked Yellow Dal (Tadka)", estimated_portion="1 katori (150g)", calories=145, protein_g=7.8, carbs_g=20.0, fat_g=3.8, fiber_g=4.2),
                FoodItem(name="Fresh Plain Curd / Dahi", estimated_portion="1/2 cup (100g)", calories=60, protein_g=4.0, carbs_g=5.0, fat_g=3.0, fiber_g=0.0)
            ],
            totals=MealTotals(calories=475, protein_g=20.6, carbs_g=71.5, fat_g=12.6, fiber_g=12.6),
            coach_tip="A complete Indian staple plate delivering >12g dietary fiber and over 20g balanced protein between dal and curd."
        )
    },
    {
        "keywords": ["paneer", "cottage cheese", "grilled paneer", "palak paneer", "paneer tikka"],
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
        "keywords": ["biryani", "pulao", "chicken biryani", "veg biryani"],
        "result": FoodAnalysisResult(
            meal_name="Fragrant Basmati Dum Biryani with Cucumber Raita",
            confidence="high",
            clarification_chips=["Chicken Biryani (Higher Protein)", "Vegetable Biryani", "Cooked with Desi Ghee"],
            items=[
                FoodItem(name="Spiced Basmati Dum Biryani", estimated_portion="1.5 cups (250g)", calories=380, protein_g=12.0, carbs_g=58.0, fat_g=11.5, fiber_g=4.2),
                FoodItem(name="Chilled Cucumber & Cumin Raita", estimated_portion="1/2 cup (100g)", calories=65, protein_g=3.8, carbs_g=4.8, fat_g=3.2, fiber_g=0.5)
            ],
            totals=MealTotals(calories=445, protein_g=15.8, carbs_g=62.8, fat_g=14.7, fiber_g=4.7),
            coach_tip="Pairing aromatic basmati biryani with cooling dahi raita balances digestion and lowers the overall glycemic impact."
        )
    },
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
            clarification_chips=["Standard portion (1 serving)", "Large portion (1.5x)", "With cooking oil / ghee"],
            items=[
                FoodItem(name=title, estimated_portion="1 plate / serving (~250g)", calories=450, protein_g=22.0, carbs_g=48.0, fat_g=18.0, fiber_g=5.0),
                FoodItem(name="Accompaniment / Side", estimated_portion="1 small bowl", calories=120, protein_g=3.0, carbs_g=20.0, fat_g=3.5, fiber_g=2.0)
            ],
            totals=MealTotals(calories=570, protein_g=25.0, carbs_g=68.0, fat_g=21.5, fiber_g=7.0),
            coach_tip="Estimated from your description. Tap any ingredient card below to refine portion sizes and exact macros."
        )

    # Default fallback when only an image is provided without an API key or when offline
    return MOCK_MEALS[0]["result"]


def analyze_food_multimodal(
    image_bytes: Optional[bytes] = None,
    mime_type: Optional[str] = None,
    text_prompt: Optional[str] = None
) -> FoodAnalysisResult:
    """
    Analyze food using the Google GenAI SDK with structured output.
    Gracefully falls back to healthy responsive models if a model experiences 503 high-demand spikes.
    Specially tuned with clinical knowledge for Indian and international dishes.
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
            "You are a world-class clinical dietitian and multimodal computer vision food recognition AI with deep specialization in Indian, Asian, and global cuisines. "
            "Analyze the meal shown in the image and/or described in the text with granular accuracy.\n\n"
            "--- CRITICAL SPECIALIZATION: INDIAN & REGIONAL DISHES ---\n"
            "1. DALS & LENTIL DISHES: "
            "Accurately differentiate Yellow Moong Dal (split yellow gram, light consistency, gentle on gut, ~150-180 kcal/katori) from Toor/Arhar Dal (golden-yellow, richer, ~180-210 kcal/katori), Chana Dal (coarser, firmer Bengal gram, ~210-240 kcal), and Dal Makhani (black urad beans in butter/cream gravy, ~320-380 kcal). Always identify the tempering (Tadka: cumin seeds, mustard seeds, garlic, hing, curry leaves) and cooking fat (ghee vs oil).\n"
            "2. DOSAS, IDLIS & SOUTH INDIAN: "
            "Differentiate Plain Dosa (crispy fermented rice & urad dal crepe, ~140-170 kcal) from Masala Dosa (filled with spiced potato onion aloo bhaji, ~300-360 kcal). Break down individual side accompaniments: Vegetable Sambhar (~80-110 kcal), Fresh Coconut Chutney (~50-70 kcal), and Tomato/Onion Kara Chutney (~30-40 kcal).\n"
            "3. FLATBREADS & GRAINS: "
            "Distinguish dry-roasted Tawa Phulka / Roti (~75 kcal each, ~3g protein) from Ghee Roti (~110 kcal), Plain Paratha (~190-220 kcal), Stuffed Aloo/Paneer Paratha (~280-350 kcal), and Naan (~260-320 kcal). Calibrate Basmati Rice (~130 kcal/100g cooked), Poha (~230-260 kcal/bowl), Upma (~200-240 kcal/bowl), and Khichdi (~220-280 kcal/bowl).\n"
            "4. CURRIES & PROTEINS: "
            "Correctly identify Paneer dishes (Palak Paneer, Paneer Tikka, Paneer Butter Masala), Chole (chickpea curry), Rajma (red kidney beans), Egg Curry, Butter Chicken, and Dahi / Curd.\n"
            "5. CLARIFICATION CHIPS: "
            "When preparation method, fat type (Desi Ghee vs Cooking Oil), or dish variation is visually ambiguous, set confidence to 'medium' or 'low' and provide 2-3 precise clarification_chips (e.g. ['Cooked with Desi Ghee', 'Tempered with Cooking Oil', 'Plain Dosa vs Masala Dosa', 'Moong Dal vs Toor Dal']).\n"
            "6. DECOMPOSITION & PORTIONS: "
            "Decompose complex plates into individual components with realistic Indian household measurements (e.g. '1 medium katori (180g)', '2 rotis (60g)', '1 large dosa (120g)', '1 cup cooked (195g)'). "
            "Calculate exact sums in 'totals'.\n"
            "7. COACH TIP: "
            "Provide 1 actionable, science-based nutritional insight regarding macronutrient balance, glycemic load, or micronutrient synergies (e.g. combining lentils with rice/roti for complete protein, or adding lemon juice for iron absorption)."
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
            f"User Context / Notes: {user_text if user_text else 'Accurately identify all dishes and ingredients in the image, especially if Indian or regional specialties, and decompose into plate components with exact macro estimation.'}"
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
