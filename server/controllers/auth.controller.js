import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    const emailRegx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegx.test(email)) {
      return res.status(400).json({ message: "Email format is wrong." });
    }

    const doesUserNameExists = await User.findOne({ username });

    if (doesUserNameExists) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    const doesEmailExists = await User.findOne({ email });

    if (doesEmailExists) {
      return res
        .status(400)
        .json({ message: "This Email is already registered." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must contain atleast 6 characters." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      fullName,
      password: hashedPassword,
    });

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();

      return res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
      });
    } else {
      return res.status(500).json({ message: "Internal server error." });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const isAlreadyAUser = await User.findOne({ username });

    if (!isAlreadyAUser) {
      return res.status(400).json({ message: "Username not found." });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      isAlreadyAUser.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Password is incorrect." });
    }

    generateTokenAndSetCookie(isAlreadyAUser._id, res);
    return res.status(200).json({
      _id: isAlreadyAUser._id,
      fullName: isAlreadyAUser.fullName,
      username: isAlreadyAUser.username,
      email: isAlreadyAUser.email,
      followers: isAlreadyAUser.followers,
      following: isAlreadyAUser.following,
      profileImg: isAlreadyAUser.profileImg,
      coverImg: isAlreadyAUser.coverImg,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const logout = async (_, res) => {
  try {
    return res
      .cookie("token", "", { maxAge: 0 })
      .status(200)
      .json({ message: "logged out successfully." });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const profile = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in profile controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};
