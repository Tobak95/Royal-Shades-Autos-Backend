require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4152;
const userRouter = require("./routes/userRouter");

//middlewares
app.use(express.json());

//routes
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Autos Api is running successfully!" });
});
//the userROuter which is imported above in line 6 would be called below
app.use("/api/auth", userRouter);

//error handling routes
app.use((req, res) => {
  res.status(400).json({ success: false, message: "Route not found!" });
});

//start-server

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, { dbName: "Autos" });
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to the database");
  }
};
startServer();
