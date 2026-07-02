import express = require("express");
import AuthController from "./authController";
import isAuthenticated from "../../middlewares/auth";

const router = express.Router();

router.post("/register", AuthController.createUser);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", isAuthenticated, AuthController.getUser);

const authRouter = router;
export default authRouter;
