import express from 'express';
import Expense from '../models/Expense.js';
import jwt from "jsonwebtoken";

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

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const DEMO_USER = "admin";
const DEMO_PASS = "admin";

function unauthorized(res, message = "Unauthorized") {
  res.set("WWW-Authenticate", 'Basic realm="login"');
  return res.status(401).json({ error: message });
}

function unauthorizedBearer(res, message = "Unauthorized") {
  res.set("WWW-Authenticate", 'Bearer realm="secure"');
  return res.status(401).json({ error: message });
}

function parseBasicAuth(authHeader) {
  const [type, value] = (authHeader || "").split(" ");
  if (type !== "Basic" || !value) return null;

  const decoded = Buffer.from(value, "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  if (idx < 0) return null;

  return {
    username: decoded.slice(0, idx),
    password: decoded.slice(idx + 1),
  };
}

function requireJwt(req, res, next) {
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");

  if (type !== "Bearer" || !token) {
    return unauthorizedBearer(res, "Missing Bearer token");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return unauthorizedBearer(res, "Invalid or expired token");
  }
}

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


//ROUTES
const router = express.Router();
router.use(['/expenses', '/expenses/:id', '/seed', '/login', '/secure'], requireJsonHeader, requireJsonContentType);

router.post("/login", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return unauthorized(res, "Missing Authorization header");

  const creds = parseBasicAuth(auth);
  if (!creds) return unauthorized(res, "Invalid Basic auth");

  const ok = creds.username === DEMO_USER && creds.password === DEMO_PASS;
  if (!ok) return unauthorized(res, "Invalid username or password");

  const token = jwt.sign(
    { sub: creds.username }, 
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600,
  });
});

router.get("/secure", requireJwt, (req, res) => {
  res.json({
    message: "You have access",
    user: req.user?.sub ?? null,
    _links: {
      self: { href: `${BASE_URL}/secure` },
    },
  });
});

router.options("/expenses", (req, res) => {
  res.set("Allow", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
  return res.sendStatus(204);
});

// OPTIONS detail
router.options("/expenses/:id", (req, res) => {
  res.set("Allow", "GET,PUT,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
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

    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;

    const hasLimit = limitRaw !== undefined && limitRaw !== null && limitRaw !== "";

    const currentPage = pageRaw ? parseInt(pageRaw, 10) : 1;
    if (!Number.isInteger(currentPage) || currentPage < 1) {
      return res.status(400).json({ error: "page must be an integer >= 1" });
    }

    let limit = null;
    if (hasLimit) {
      limit = parseInt(limitRaw, 10);
      if (!Number.isInteger(limit) || limit < 1) {
        return res.status(400).json({ error: "limit must be an integer >= 1" });
      }
    }

    const totalItems = await Expense.countDocuments();

    let items = [];
    let totalPages = 1;

    if (!hasLimit) {
      if (currentPage !== 1) {
        return res.status(404).json({ error: "Page not found" });
      }
      items = await Expense.find();
      totalPages = 1;
    } else {
      totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / limit);

      if (currentPage > totalPages && totalItems > 0) {
        return res.status(404).json({ error: "Page not found" });
      }

      const skip = (currentPage - 1) * limit;
      items = await Expense.find().skip(skip).limit(limit);
    }

    const selfHref = hasLimit
      ? `${base}?page=${currentPage}&limit=${limit}`
      : base;

    const paginationLinks = {};

    if (hasLimit) {
      paginationLinks.first = { page: 1, href: `${base}?page=1&limit=${limit}` };
      paginationLinks.last = { page: totalPages, href: `${base}?page=${totalPages}&limit=${limit}` };

      paginationLinks.previous =
        currentPage > 1
          ? { page: currentPage - 1, href: `${base}?page=${currentPage - 1}&limit=${limit}` }
          : null;

      paginationLinks.next =
        currentPage < totalPages
          ? { page: currentPage + 1, href: `${base}?page=${currentPage + 1}&limit=${limit}` }
          : null;
    } else {
      paginationLinks.first = { page: 1, href: base };
      paginationLinks.last = { page: 1, href: base };
      paginationLinks.previous = null;
      paginationLinks.next = null;
    }

    return res.json({
      items: items.map(toExpenseListItem),
      _links: {
        self: { href: selfHref },
        collection: { href: base },
      },
      pagination: {
        currentPage,
        currentItems: items.length,
        totalPages,
        totalItems,
        ...(hasLimit ? { limit } : {}),
        _links: paginationLinks,
      },
    });
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
