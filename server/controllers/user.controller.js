import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const followAndUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userToFollow = await User.findById(id);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    const isFollowing = req.user.following.includes(id);

    if (isFollowing) {
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      return res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      const notification = new Notification({
        type: "follow",
        from: req.user._id,
        to: id,
      });

      await notification.save();

      return res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.log("Error in followAndUnfollowUser controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const users = await User.findById(userId).select("following");

    const followingList = users.following;

    const idxToExclude = [userId, ...followingList];

    const suggestedUsers = await User.aggregate([
      {
        $match: { _id: { $nin: idxToExclude } },
      },
      {
        $sample: { size: 4 },
      },
      {
        $project: { password: 0 },
      },
    ]);

    if (suggestedUsers.length > 0) {
      return res.status(200).json(suggestedUsers);
    }

    return res.status(404).json({ message: "There are no suggested users." });
  } catch (error) {
    console.log("Error in getSuggestedUsers controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;

  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);

    const emailRegx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (email && !emailRegx.test(email)) {
      return res.status(400).json({ message: "Email format is wrong." });
    }

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Please provide current and new password" });
      }

      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordCorrect) {
        return res
          .status(400)
          .json({ message: "Your current password is wrong." });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be atleast 6 characters long." });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }

      const response = await cloudinary.uploader.upload(profileImg);
      profileImg = response.secure_url;
    }

    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }

      const response = await cloudinary.uploader.upload(coverImg);
      coverImg = response.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    await user.save();

    user.password = undefined;

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in updateUser controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};
