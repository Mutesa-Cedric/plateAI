import express = require("express");
import AuthController from "./authController";

const router = express.Router();

router.post("/register", AuthController.createUser);
router.post("/login", AuthController.login);

const authRouter = router;
export default authRouter;