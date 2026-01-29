import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import expenseRoutes from "./routes/expense.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

// Belangrijk: preflightContinue: true zodat cors() OPTIONS NIET afhandelt,
// maar alleen headers zet en jouw router.options() kan antwoorden.
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    preflightContinue: true,
  })
);

await connectDB(process.env.MONGO_URI);

app.get("/", (req, res) => {
  res.json({ message: "Expense Tracker API running" });
});

app.use(expenseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
