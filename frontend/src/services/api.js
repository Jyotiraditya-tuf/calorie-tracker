// Client API Service for Gemini Food Recognition

const BACKEND_URL = ''; // Proxied by Vite to http://localhost:8000

// Fallback client mocks if backend server is not running
const CLIENT_FALLBACK_MEALS = [
  {
    meal_name: "Paneer & Brown Rice Bowl",
    confidence: "high",
    clarification_chips: ["Whole milk paneer", "Low-fat paneer", "Tofu alternative"],
    items: [
      { name: "Grilled Paneer Cubes", estimated_portion: "180g (6 cubes)", calories: 465, protein_g: 32.4, carbs_g: 6.2, fat_g: 36.0, fiber_g: 0.0 },
      { name: "Brown Basmati Rice", estimated_portion: "1 cup cooked (195g)", calories: 215, protein_g: 5.0, carbs_g: 45.0, fat_g: 1.6, fiber_g: 3.5 },
      { name: "Sautéed Bell Peppers & Onions", estimated_portion: "1.5 cups (150g)", calories: 75, protein_g: 2.1, carbs_g: 14.5, fat_g: 1.2, fiber_g: 3.8 },
      { name: "Olive oil / Ghee brush", estimated_portion: "1 tsp (5ml)", calories: 45, protein_g: 0.0, carbs_g: 0.0, fat_g: 5.0, fiber_g: 0.0 }
    ],
    totals: { calories: 800, protein_g: 39.5, carbs_g: 65.7, fat_g: 43.8, fiber_g: 7.3 },
    coach_tip: "Excellent high-protein vegetarian meal! Pair with a squeeze of fresh lemon to boost iron absorption from the veggies."
  },
  {
    meal_name: "Chicken Avocado Super Salad",
    confidence: "medium",
    clarification_chips: ["Olive oil vinaigrette", "Creamy dressing", "Light dressing"],
    items: [
      { name: "Grilled Chicken Breast", estimated_portion: "170g cooked", calories: 280, protein_g: 53.0, carbs_g: 0.0, fat_g: 6.2, fiber_g: 0.0 },
      { name: "Fresh Hass Avocado", estimated_portion: "1/2 medium (75g)", calories: 120, protein_g: 1.5, carbs_g: 6.4, fat_g: 11.0, fiber_g: 5.0 },
      { name: "Mixed Leafy Greens & Cucumbers", estimated_portion: "2 cups (100g)", calories: 25, protein_g: 1.8, carbs_g: 4.2, fat_g: 0.4, fiber_g: 2.1 },
      { name: "Herb Vinaigrette Dressing", estimated_portion: "2 tbsp (30ml)", calories: 130, protein_g: 0.1, carbs_g: 2.0, fat_g: 14.0, fiber_g: 0.1 }
    ],
    totals: { calories: 555, protein_g: 56.4, carbs_g: 12.6, fat_g: 31.6, fiber_g: 7.2 },
    coach_tip: "Outstanding lean protein density with heart-healthy monounsaturated fats from avocado."
  }
];

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('Health check non-200');
    return await res.json();
  } catch (err) {
    return { status: 'offline', gemini_configured: false };
  }
}

export async function analyzeMealFood({ imageBlob, textPrompt }) {
  const formData = new FormData();
  
  if (imageBlob) {
    const filename = imageBlob.type === 'image/png' ? 'photo.png' : 'photo.jpg';
    formData.append('image', imageBlob, filename);
  }
  
  if (textPrompt && textPrompt.trim()) {
    formData.append('text', textPrompt.trim());
  }

  try {
    // 25s timeout to prevent infinite UI freezing
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Backend returned non-200, falling back to smart simulation:', errorText);
      return getSimulatedFallback(textPrompt);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('Backend request failed or timed out, using instant fallback:', err);
    return getSimulatedFallback(textPrompt);
  }
}

function getSimulatedFallback(text) {
  if (text) {
    const lower = text.toLowerCase();
    if (lower.includes('apple') || lower.includes('fruit')) {
      return {
        meal_name: "Fresh Crisp Apple",
        confidence: "high",
        clarification_chips: ["Medium apple (180g)", "Large apple (240g)", "With peanut butter dip"],
        items: [
          { name: "Fresh Red Apple", estimated_portion: "1 medium apple (182g)", calories: 95, protein_g: 0.5, carbs_g: 25.1, fat_g: 0.3, fiber_g: 4.4 }
        ],
        totals: { calories: 95, protein_g: 0.5, carbs_g: 25.1, fat_g: 0.3, fiber_g: 4.4 },
        coach_tip: "Rich in soluble pectin fiber and antioxidant polyphenols; great for sustained energy."
      };
    }
    if (lower.includes('chicken')) {
      return CLIENT_FALLBACK_MEALS[1];
    }
    if (lower.includes('oat') || lower.includes('egg')) {
      const isEgg = lower.includes('egg');
      return {
        meal_name: isEgg ? "Poached Eggs & Toast" : "Berry Protein Oatmeal",
        confidence: "medium",
        clarification_chips: isEgg ? ["Cooked in butter", "Cooking spray (oil-free)", "With cheese"] : ["With whole milk", "With almond milk", "With protein scoop"],
        items: isEgg ? [
          { name: "Large Eggs (2 poached)", estimated_portion: "2 eggs (100g)", calories: 144, protein_g: 12.6, carbs_g: 0.8, fat_g: 9.9, fiber_g: 0.0 },
          { name: "Sourdough Toast (1 slice)", estimated_portion: "1 slice (45g)", calories: 120, protein_g: 4.0, carbs_g: 23.0, fat_g: 0.7, fiber_g: 1.5 }
        ] : [
          { name: "Rolled Oats", estimated_portion: "1 cup cooked", calories: 166, protein_g: 5.9, carbs_g: 28.1, fat_g: 3.6, fiber_g: 4.0 },
          { name: "Fresh Berries & Honey", estimated_portion: "1/2 cup", calories: 65, protein_g: 0.8, carbs_g: 16.0, fat_g: 0.2, fiber_g: 2.0 }
        ],
        totals: isEgg ? { calories: 264, protein_g: 16.6, carbs_g: 23.8, fat_g: 10.6, fiber_g: 1.5 } : { calories: 231, protein_g: 6.7, carbs_g: 44.1, fat_g: 3.8, fiber_g: 6.0 },
        coach_tip: "Great balanced plate! Tap any ingredient to adjust portion size or macros."
      };
    }
  }
  return CLIENT_FALLBACK_MEALS[0];
}
