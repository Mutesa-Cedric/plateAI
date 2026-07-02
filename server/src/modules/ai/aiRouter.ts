import { Router } from "express";
import AiController from "./aiController";
import isAuthenticated from "../../middlewares/auth";

const router = Router();

// Public probe (no model cost).
router.get("/health", AiController.health);

// All AI features require a valid session (ABUSE-01).
router.use(isAuthenticated);

router.post("/diet-check", AiController.dietCheck);
router.post("/advisor", AiController.advisor);
router.post("/cook-for-me", AiController.cookForMe);
router.post("/chat", AiController.chat);
router.post("/stt", AiController.stt);
router.post("/tts", AiController.tts);

export default router;
