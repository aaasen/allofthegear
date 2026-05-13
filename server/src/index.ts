import express from "express";
import cors from "cors";
import { getDb } from "./db/database";
import bagsRouter from "./routes/bags";
import tripsRouter from "./routes/trips";
import itemsRouter from "./routes/items";
import weightRouter from "./routes/weight";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize DB on startup
getDb();

app.use("/api/bags", bagsRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/trips/:id/items", itemsRouter);
app.use("/api/trips/:id/weight", weightRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
