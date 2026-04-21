import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import queryRoutes from "./routes/queryRoutes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = 5001; // Only one declaration!

// 1. Security & Logging
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));

// 2. CORS - Allow port 3000 to talk to 5001
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// 3. Body Parsing
app.use(express.json());

// 4. Routes
app.use("/api/v1/queries", queryRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SQL Query Analyzer API is running on Port 5001!",
    version: "1.0.0",
  });
});

app.use(errorHandler);

// 5. Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/v1/queries`);
});