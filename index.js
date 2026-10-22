require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4152;
const userRouter = require("./routes/userRouter");
const cors = require("cors");

//middlewares
app.use(express.json());
//only the local dev frontend and the deployed frontend may call this API
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL && process.env.FRONTEND_URL.replace(/\/+$/, ""),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      //requests with no origin (Postman, curl, Render health checks) are allowed
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);

//routes
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Autos Api is running successfully!" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
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
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL environment variable is not set");
    }
    await mongoose.connect(process.env.MONGO_URL, { dbName: "Autos" });
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (error) {
    //exit so Render shows the real error instead of "No open ports detected"
    console.error(`Error connecting to the database: ${error.message}`);
    process.exit(1);
  }
};
startServer();
