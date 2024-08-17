import { Router } from "express";
import {
  createPost,
  deletePost,
  commentOnPost,
  likeUnlikePost,
  getAllPosts,
  getLikedPosts,
  getFollowingPosts,
  getUserPosts,
} from "../controllers/post.controller.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getAllPosts);
router.get("/likes/:id", isAuthorized, getLikedPosts);
router.get("/followings", isAuthorized, getFollowingPosts);
router.get("/user/:username", isAuthorized, getUserPosts);
router.post("/create", isAuthorized, createPost);
router.post("/comment/:id", isAuthorized, commentOnPost);
router.post("/like/:id", isAuthorized, likeUnlikePost);
router.delete("/:id", isAuthorized, deletePost);

export default router;
