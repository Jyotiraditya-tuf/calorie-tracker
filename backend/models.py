from typing import List, Literal
from pydantic import BaseModel, Field


class FoodItem(BaseModel):
    name: str = Field(description="Name of the food item or ingredient")
    estimated_portion: str = Field(description="Estimated portion size or serving description (e.g. '150g', '1 cup', '2 slices')")
    calories: float = Field(description="Estimated calories in kcal")
    protein_g: float = Field(description="Grams of protein")
    carbs_g: float = Field(description="Grams of carbohydrates")
    fat_g: float = Field(description="Grams of fat")
    fiber_g: float = Field(default=0.0, description="Grams of dietary fiber")


class MealTotals(BaseModel):
    calories: float = Field(description="Total calories in kcal")
    protein_g: float = Field(description="Total grams of protein")
    carbs_g: float = Field(description="Total grams of carbohydrates")
    fat_g: float = Field(description="Total grams of fat")
    fiber_g: float = Field(default=0.0, description="Total grams of dietary fiber")


class FoodAnalysisResult(BaseModel):
    meal_name: str = Field(description="Summary name of the dish or meal")
    confidence: Literal["high", "medium", "low"] = Field(
        default="high",
        description="Confidence level in the estimation based on visual clarity and preparation ambiguity"
    )
    clarification_chips: List[str] = Field(
        default_factory=list,
        description="2-3 quick refinement options or variations if confidence is medium or low (e.g. ['Whole milk', 'Oat milk', 'Skim milk'])"
    )
    items: List[FoodItem] = Field(
        default_factory=list,
        description="Decomposed individual food components on the plate"
    )
    totals: MealTotals = Field(
        description="Sum of all decomposed food component macros"
    )
    coach_tip: str = Field(
        description="1-sentence actionable nutrition insight based on the meal's macro balance"
    )
