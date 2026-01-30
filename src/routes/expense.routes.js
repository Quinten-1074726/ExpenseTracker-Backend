import express from 'express';
import Expense from '../models/Expense.js';
import { de } from '@faker-js/faker';

function requireJsonHeader(req, res, next) {
  if (req.method === "OPTIONS") return next();  
  if (!req.accepts("application/json")) {
    return res.status(406).json({ error: "Not Acceptable. This API only serves application/json" });
  }
  next();
}

function requireJsonContentType(req, res, next) {
  if (req.method === "OPTIONS") return next();   
  if (req.method === "POST" || req.method === "PUT") {
    if (!req.is("application/json")) {
      return res.status(415).json({ error: "Content-Type must be application/json." });
    }
  }
  next();
}

const BASE_URL = process.env.BASE_URL || "http://145.24.237.232:8001";

function toExpenseResource(expense) {
  return {
    id: String(expense._id),        
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

function toExpenseListItem(expense) {
  return {
    id: String(expense._id),
    title: expense.title,
    amount: expense.amount,
    date: expense.date,
    category: expense.category,
    _links: {
      self: { href: `${BASE_URL}/expenses/${expense._id}` },
    },
  };
}

function asNonEmptyString(v) {
  if (typeof v === "number") return String(v);
  if (typeof v !== "string") return "";
  return v.trim();
}

const router = express.Router();
router.use(['/expenses', '/expenses/:id', '/seed'], requireJsonHeader, requireJsonContentType);

router.options("/expenses", (req, res) => {
  res.set("Allow", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  return res.sendStatus(204);
});

// OPTIONS detail
router.options("/expenses/:id", (req, res) => {
  res.set("Allow", "GET,PUT,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  return res.sendStatus(204);
});

router.all("/expenses", (req, res, next) => {
  if (["GET", "POST", "OPTIONS"].includes(req.method)) return next();
  res.set("Allow", "GET,POST,OPTIONS");
  return res.sendStatus(405);
});

router.all("/expenses/:id", (req, res, next) => {
  if (["GET", "PUT", "DELETE", "OPTIONS"].includes(req.method)) return next();
  res.set("Allow", "GET,PUT,DELETE,OPTIONS");
  return res.sendStatus(405);
});

router.post("/seed", async (req, res) => {
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
        {
            title: 'Grasmaaier',
            description: 'Grasmaaier ',
            amount: '100.00',
            date: '2026-01-23',
            category: 'Home',
        },

        ]);

        res.status(201).json({
        items: created.map(toExpenseResource),
        _links: {
            self: { href: `${BASE_URL}/seed` },
            collection: { href: `${BASE_URL}/expenses` },
        },
        });
    } catch (error) {
        console.error("Seed error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/expenses", async (req, res) => {
  try {
    const base = `${BASE_URL}/expenses`;

    const hasLimit = req.query.limit !== undefined;

    // parse query
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;

    let page = pageRaw ? parseInt(pageRaw, 10) : 1;
    let limit = hasLimit ? parseInt(limitRaw, 10) : null;

    if (pageRaw !== undefined && (!Number.isInteger(page) || page < 1)) {
      return res.status(400).json({ error: "page must be an integer >= 1" });
    }

    if (hasLimit && (!Number.isInteger(limit) || limit < 1)) {
      return res.status(400).json({ error: "limit must be an integer >= 1" });
    }

    const totalItems = await Expense.countDocuments();

    let items = [];
    let pageCount = 1;

    if (!hasLimit) {
      page = 1;        
      limit = null;    

      items = await Expense.find();
      pageCount = 1;
    } else {
      pageCount = totalItems === 0 ? 1 : Math.ceil(totalItems / limit);

      if (page > pageCount && totalItems > 0) {
        return res.status(404).json({ error: "Page not found" });
      }

      const skip = (page - 1) * limit;
      items = await Expense.find().skip(skip).limit(limit);
    }

    let selfHref = `${BASE_URL}${req.originalUrl}`;
    if (!hasLimit) selfHref = base;

    const response = {
      items: items.map(toExpenseListItem),
      pagination: {
        page,
        limit,
        totalItems,
        pageCount,
        currentItems: items.length,
      },
      _links: {
        self: { href: selfHref },
        collection: { href: base },
      },
    };

    if (hasLimit && pageCount > 1) {
      if (page < pageCount) {
        response._links.next = { href: `${base}?page=${page + 1}&limit=${limit}` };
      }
      if (page > 1) {
        response._links.prev = { href: `${base}?page=${page - 1}&limit=${limit}` };
      }
    }

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


router.get("/expenses/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.json(toExpenseResource(expense));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.post("/expenses", async (req, res) => {
  try {
    const title = asNonEmptyString(req.body.title);
    const description = asNonEmptyString(req.body.description);
    const amount = asNonEmptyString(req.body.amount);
    const date = asNonEmptyString(req.body.date);
    const category = asNonEmptyString(req.body.category);

    if (![title, description, amount, date, category].every(Boolean)) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const createdExpense = await Expense.create({ title, description, amount, date, category });
    return res.status(201).json(toExpenseResource(createdExpense));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});     

router.put("/expenses/:id", async (req, res) => {
  try {
    const title = asNonEmptyString(req.body.title);
    const description = asNonEmptyString(req.body.description);
    const amount = asNonEmptyString(req.body.amount);
    const date = asNonEmptyString(req.body.date);
    const category = asNonEmptyString(req.body.category);

    if (![title, description, amount, date, category].every(Boolean)) {
      return res.status(400).json({ error: "All fields are required and must be non-empty." });
    }

    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, description, amount, date, category },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(toExpenseResource(updated));
  } catch {
    return res.status(400).json({ error: "Invalid id" });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });

    return res.sendStatus(204); 
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});


export default router;
