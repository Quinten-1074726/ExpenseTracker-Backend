import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import expenseRoutes from './routes/expense.routes.js';

dotenv.config();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept"],
};

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    // checker wil Allow header
    res.set("Allow", "GET,POST,PUT,DELETE,OPTIONS");
  }
  next();
});

app.use(cors(corsOptions));
app.options(/.*/, (req, res) => {
  res.set("Allow", "GET,POST,PUT,DELETE,OPTIONS");
  res.sendStatus(204);
});

await connectDB(process.env.MONGO_URI);

app.get('/', (req, res) => {
  res.json({ message: 'Expense Tracker API running' });
});

// mount routes
app.use(expenseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
