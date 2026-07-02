import { Router } from "express";
import MealsController from "./mealsController";
import isAuthenticated from "../../middlewares/auth";

const router = Router();

router.use(isAuthenticated);

router.post("/", MealsController.createMeal);
router.get("/by-user/:userId", MealsController.getUserMeals);
router.get("/:mealId", MealsController.getMeal);

const mealsRouter = router;
export default mealsRouter;
