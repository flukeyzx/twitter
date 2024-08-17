import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const isAuthorized = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "No Access token provided, Access denied!" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken.userId).select("-password");

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in the auth middleware", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};
