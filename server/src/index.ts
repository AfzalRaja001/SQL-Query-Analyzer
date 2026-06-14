import dotenv from "dotenv";
dotenv.config(); // MUST BE FIRST

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import queryRoutes from "./routes/queryRoutes";
import connectionRoutes from "./routes/connectionRoutes";
import historyRoutes from "./routes/history"; // Import the file we fixed
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 5001;

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// LINKING THE ROUTES
app.use("/api/v1/queries", queryRoutes);
app.use("/api/v1/history", historyRoutes); // We are giving history its own clean link
app.use("/api/v1/connections", connectionRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: `SQL Query Analyzer API is running on Port ${PORT}!`,
    version: "1.0.0",
  });
});

app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});