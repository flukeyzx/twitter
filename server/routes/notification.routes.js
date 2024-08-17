import { Router } from "express";

import {
  getUserNotifications,
  deleteUserNotifications,
} from "../controllers/notification.model.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", isAuthorized, getUserNotifications);
router.delete("/", isAuthorized, deleteUserNotifications);

export default router;
