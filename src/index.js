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
    allowedHeaders: ["Content-Type", "Accept"],
  })
);

await connectDB(process.env.MONGO_URI);

app.get("/", (req, res) => {
  res.json({ message: "Expense Tracker API running" });
});

// mount routes
app.use(expenseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
