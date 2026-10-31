
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const requiredVars = [
  "DATABASE_URL",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "SESSION_SECRET"
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

app.set("trust proxy", 1);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const adminPasswordHash = bcrypt.hashSync(
  process.env.ADMIN_PASSWORD,
  10
);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  name: "yamral.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 2 * 60 * 60 * 1000
  }
}));

app.use(express.static(path.join(__dirname, "public")));

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Learning',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const count = await pool.query("SELECT COUNT(*) FROM projects");

  if (Number(count.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO projects (title, description, category)
      VALUES
      ('Personal Portfolio Website',
       'A bilingual personal website built to present my education and learning interests.',
       'Web Development'),
      ('Accounting Study Notes',
       'A learning goal to organize accounting lessons and practice exercises.',
       'Accounting'),
      ('Digital Skills Practice',
       'Exploring content creation, social media, and digital marketing tools.',
       'Digital Marketing')
    `);
  }
}

function requireAdmin(req, res, next) {
  if (req.session?.admin === true) return next();
  return res.status(401).json({
    error: "Please sign in as administrator."
  });
}

app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, category, created_at FROM projects ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load projects." });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    if (![name, email, message].every(
      v => typeof v === "string" && v.trim()
    )) {
      return res.status(400).json({
        error: "Please complete all fields."
      });
    }

    if (name.length > 80 || email.length > 160 || message.length > 3000) {
      return res.status(400).json({
        error: "One or more fields are too long."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        error: "Please enter a valid email address."
      });
    }

    await pool.query(
      "INSERT INTO messages (name, email, message) VALUES ($1, $2, $3)",
      [name.trim(), email.trim(), message.trim()]
    );

    res.status(201).json({
      ok: true,
      message: "Your message has been saved."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save your message." });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};

  if (
    username === process.env.ADMIN_USERNAME &&
    typeof password === "string" &&
    bcrypt.compareSync(password, adminPasswordHash)
  ) {
    req.session.admin = true;
    return res.json({ ok: true });
  }

  res.status(401).json({
    error: "Incorrect username or password."
  });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("yamral.sid");
    res.json({ ok: true });
  });
});

app.get("/api/admin/me", (req, res) => {
  res.json({
    authenticated: req.session?.admin === true
  });
});

app.get("/api/admin/messages", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load messages." });
  }
});

app.delete("/api/admin/messages/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid message ID." });
    }

    const result = await pool.query(
      "DELETE FROM messages WHERE id = $1 RETURNING id",
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not delete message." });
  }
});

app.post("/api/admin/projects", requireAdmin, async (req, res) => {
  try {
    const { title, description, category } = req.body || {};

    if (![title, description, category].every(
      v => typeof v === "string" && v.trim()
    )) {
      return res.status(400).json({
        error: "Complete all project fields."
      });
    }

    if (title.length > 100 || description.length > 1000 || category.length > 60) {
      return res.status(400).json({
        error: "Project details are too long."
      });
    }

    const result = await pool.query(
      `INSERT INTO projects (title, description, category)
       VALUES ($1, $2, $3) RETURNING id`,
      [title.trim(), description.trim(), category.trim()]
    );

    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not add project." });
  }
});

app.delete("/api/admin/projects/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid project ID." });
    }

    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING id",
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not delete project." });
  }
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`Portfolio running on port ${PORT}`);
  });
}

startServer().catch(error => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
