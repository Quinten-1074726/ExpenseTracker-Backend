import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import expenseRoutes from "./routes/expense.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    preflightContinue: true, 
  })
);

app.options(/.*/, (req, res) => {
  res.set("Allow", "GET,POST,PUT,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  return res.sendStatus(204);
});

await connectDB(process.env.MONGO_URI);

app.get("/", (req, res) => {
  res.json({ message: "Expense Tracker API running" });
});

// mount routes
app.use(expenseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
