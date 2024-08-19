import { Notification } from "../models/notification.model.js";

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "from",
        select: "username fullName profileImg",
      });

    await Notification.updateMany({ to: userId }, { read: true });

    return res.status(200).json(notifications);
  } catch (error) {
    console.log("Error in getuserNotification controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    return res
      .status(200)
      .json({ message: "Notifications deleted successfully." });
  } catch (error) {
    console.log("Error in deleteNotifications controller", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};
