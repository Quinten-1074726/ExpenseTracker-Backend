import express from 'express';
import Expense from '../models/Expense.js';

const router = express.Router();

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
            title: 'Netflix Abonnement',
            description: 'Maandelijkse kosten',
            amount: '14.50',
            date: '2026-01-19',
            category: 'Entertainment',
        },
        ]);

        res.status(201).json(created);
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
