import { Router } from "express";
import {
  signup,
  login,
  logout,
  profile,
} from "../controllers/auth.controller.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", isAuthorized, profile);

export default router;
