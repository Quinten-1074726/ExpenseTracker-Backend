import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const MONGO_URI = process.env.MONGO_URI;

await mongoose.connect(MONGO_URI);
console.log('Connected to MongoDB');

app.get('/', (req, res) => {
  res.json({ message: 'Expense Tracker API running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
