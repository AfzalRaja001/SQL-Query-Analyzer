import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import queryRoutes from "./routes/queryRoutes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers (XSS protection, content-type sniffing, etc.)
app.use(helmet());

// Enable Cross-Origin requests so the Next.js frontend (port 3000) can talk to this API (port 5000)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// HTTP request logger — prints every incoming request to the console for debugging
app.use(morgan("dev"));


// Mount the query router at /api/v1/queries
app.use("/api/v1/queries", queryRoutes);

// Root health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SQL Query Analyzer API is running!",
    version: "1.0.0",
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/v1/queries`);
});
