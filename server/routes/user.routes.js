import { Router } from "express";
import {
  getUserProfile,
  followAndUnfollowUser,
  getSuggestedUsers,
  updateUser,
} from "../controllers/user.controller.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/profile/:username", isAuthorized, getUserProfile);
router.get("/suggestion", isAuthorized, getSuggestedUsers);
router.post("/follow/:id", isAuthorized, followAndUnfollowUser);
router.post("/update", isAuthorized, updateUser);

export default router;
