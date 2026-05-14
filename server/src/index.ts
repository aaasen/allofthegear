import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import { getDb } from "./db/database";
import bagsRouter from "./routes/bags";
import tripsRouter from "./routes/trips";
import itemsRouter from "./routes/items";
import weightRouter from "./routes/weight";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use((req, _res, next) => { console.log(req.method, req.path); next(); });

getDb();

app.use("/api/bags", bagsRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/trips/:id/items", itemsRouter);
app.use("/api/trips/:id/weight", weightRouter);

const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
