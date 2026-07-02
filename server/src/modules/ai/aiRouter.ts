import { Router } from "express";
import AiController from "./aiController";

const router = Router();

router.get("/health", AiController.health);
router.post("/diet-check", AiController.dietCheck);
router.post("/advisor", AiController.advisor);
router.post("/cook-for-me", AiController.cookForMe);
router.post("/chat", AiController.chat);
router.post("/stt", AiController.stt);
router.post("/tts", AiController.tts);

export default router;
