import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Notification } from "../models/notification.model.js";
import formidable from "formidable";

export const createPost = async (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (error, fields, files) => {
    if (error) {
      return res.status(500).json({ message: "Form parsing error" });
    }

    try {
      let { text } = fields;
      let { image } = files;

      text = text.join(" ");

      const user = await User.findById(req.user._id);

      if (!user) return res.status(404).json({ message: "User not found." });

      if (!text && !image) {
        return res
          .status(400)
          .json({ message: "Post must have the text or an image." });
      }

      if (image) {
        image = image[0]; // as image is an array get the first object
        const response = await cloudinary.uploader.upload(image.filepath);
        image = response.secure_url;
      }

      const newPost = new Post({
        user: user._id,
        text,
        image,
      });

      const post = await newPost.save();

      return res.status(201).json(post);
    } catch (error) {
      console.log("Error in createPost controller", error.message);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found." });

    if (req.user._id.toString() !== post.user.toString()) {
      return res
        .status(400)
        .json({ message: "Posts can only be deleted by their owner." });
    }

    if (post.image) {
      await cloudinary.uploader.destroy(
        post.image.split("/").pop().split(".")[0]
      );
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    console.log("Error in deletePost controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const commentOnPost = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const userId = req.user._id;

  try {
    const post = await Post.findById(id);

    if (!post) return res.status(404).json({ message: "Post not found." });

    if (!comment) {
      return res
        .status(400)
        .json({ message: "Please pass some text on the comment." });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        $push: { comments: { user: userId, comment: comment } },
      },
      { new: true }
    ).populate("comments.user", "username profileImg fullName");

    const updatedComments = updatedPost.comments;

    return res.status(201).json(updatedComments);
  } catch (error) {
    console.log("Error in commentOnPost controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const likeUnlikePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const isAlreadyLiked = post.likes.includes(userId);

    if (isAlreadyLiked) {
      await Post.findByIdAndUpdate(id, { $pull: { likes: userId } });
      await User.findByIdAndUpdate(userId, { $pull: { likedPosts: id } });

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      return res.status(200).json(updatedLikes);
    } else {
      await Post.findByIdAndUpdate(id, { $push: { likes: userId } });
      await User.findByIdAndUpdate(userId, { $push: { likedPosts: id } });

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });

      await notification.save();

      post.likes.push(userId);
      const updatedLikes = post.likes;

      return res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log("Error in likeUnlike controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getAllPosts controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getLikedPosts = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "user not found." });

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error in getLikedPosts controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getFollowingPosts = async (req, res) => {
  const id = req.user._id;

  try {
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "user not found." });

    const followingPosts = await Post.find({ user: { $in: user.following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(followingPosts);
  } catch (error) {
    console.log("Error in getFollowingPosts controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getUserPosts = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ message: "user not found." });

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments",
        select: "-password",
      });

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getUserPosts controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};
