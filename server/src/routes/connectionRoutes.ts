import { Router } from "express";
import {
  listConnections,
  createConnection,
  deleteConnection,
  testConnection,
} from "../controllers/connectionController";

const router = Router();

router.get("/", listConnections);
router.post("/", createConnection);
router.delete("/:id", deleteConnection);
router.post("/:id/test", testConnection);

export default router;