import { Router } from "express";

import MealsController from "./mealsController";

const router = Router();

router.post("/", MealsController.createMeal);
router.get("/by-user/:userId", MealsController.getUserMeals);
router.get("/:mealId", MealsController.getMeal);

const mealsRouter = router;

export default mealsRouter;
