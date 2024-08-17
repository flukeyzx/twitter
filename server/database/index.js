import mongoose from "mongoose";

const connectToDatabase = () => {
  try {
    mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => {
        console.log("Connection to database is successfull");
      })
      .catch((error) => {
        console.log("Connection to database failed", error.message);
      });
  } catch (error) {
    console.log("Connection to database failed", error.message);
  }
};

export default connectToDatabase;
