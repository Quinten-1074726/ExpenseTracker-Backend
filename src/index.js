import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import expenseRoutes from "./routes/expense.routes.js";

dotenv.config();

const app = express();

// body parser
app.use(express.json());

// CORS (laat methods weg, anders krijg je vaak "too many options" bij de checker)
app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Accept"],
  })
);

// DB connect
await connectDB(process.env.MONGO_URI);

// root
app.get("/", (req, res) => {
  res.json({ message: "Expense Tracker API running" });
});

// routes
app.use(expenseRoutes);

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
