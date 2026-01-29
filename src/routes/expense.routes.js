import express from 'express';
import Expense from '../models/Expense.js';
import { de } from '@faker-js/faker';

function requireJsonHeader(req, res, next) {
    if (!req.accepts('application/json')) {
        return res.status(406).json({ error: 'Not Acceptable. This API only serves application/json' });
    }
    next();
}

function requireJsonContentType(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json.' });
    }
  }
  next();
}
const BASE_URL = process.env.BASE_URL || "http://145.24.237.232:8001";

function toExpenseResource(expense) {
  return {
    _id: expense._id,
    title: expense.title,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    category: expense.category,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
    _links: {
      self: { href: `${BASE_URL}/expenses/${expense._id}` },
      collection: { href: `${BASE_URL}/expenses` },
    },
  };
}

const router = express.Router();
router.use(['/expenses', '/expenses/:id', '/seed'], requireJsonHeader, requireJsonContentType);

router.post('/seed', async (req, res) => {
    try {
        await Expense.deleteMany({});
        const created = await Expense.create([
        {
            title: 'Boodschappen',
            description: 'Albert Heijn',
            amount: '45.30',
            date: '2026-01-19',
            category: 'Food',
        },
        {
            title: 'Treinkaartje',
            description: 'Retour Rotterdam',
            amount: '12.50',
            date: '2026-01-18',
            category: 'Travel',
        },
        {
            title: 'Kleding',
            description: 'Kleding H&M',
            amount: '60.00',
            date: '2026-01-20',
            category: 'Shopping',
        },
        {
            title: 'Nike Air Force',
            description: 'Nike Air Force schoenen',
            amount: '100.00',
            date: '2026-01-21',
            category: 'Shopping',
        },
        {
            title: 'Tafel',
            description: 'Tafel IKEA',
            amount: '150.00',
            date: '2026-01-22',
            category: 'Home',
        },

        ]);

        res.status(201).json(created);
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json({
      items: expenses.map(toExpenseResource),
      _links: {
        self: { href: `${BASE_URL}/expenses` },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
    
router.get("/expenses/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.json(toExpenseResource(expense));
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.post('/expenses', async (req, res) => {
    try {
        const { title, description, amount, date, category } = req.body;
        if (![title, description, amount, date, category].every(field => typeof field === 'string' && field.trim() !== '')) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const createdExpense = await Expense.create({ title, description, amount, date, category });
        res.status(201).json(toExpenseResource(createdExpense));

    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});       

router.put('/expenses/:id', async (req, res) => {
  try {
    const { title, description, amount, date, category } = req.body;

    if (![title, description, amount, date, category].every(v => typeof v === 'string' && v.trim() !== '')) {
      return res.status(400).json({ error: 'All fields are required and must be non-empty strings.' });
    }

    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, description, amount, date, category },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(toExpenseResource(updated));
  } 
catch (error) {
    res.status(400).json({ error: 'Invalid id' });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);     
    if (!deleted) return  res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Expense deleted', id: deleted._id });
  }
catch (error) {
    res.status(400).json({ error: 'Invalid id' });
    }
});

export default router;
