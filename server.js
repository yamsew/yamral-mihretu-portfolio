require("dotenv").config();
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const db = new Database(path.join(__dirname, "data", "portfolio.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Learning',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

if (db.prepare("SELECT COUNT(*) AS n FROM projects").get().n === 0) {
  const add = db.prepare("INSERT INTO projects (title, description, category) VALUES (?, ?, ?)");
  add.run("Personal Portfolio Website", "A bilingual personal website built to present my education and learning interests.", "Web Development");
  add.run("Accounting Study Notes", "A learning goal to organize accounting lessons, examples, and practice exercises.", "Accounting");
  add.run("Digital Skills Practice", "Exploring content creation, social media, and digital marketing tools.", "Digital Marketing");
}

const username = process.env.ADMIN_USERNAME || "yamral";
const adminPassword = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";
const passwordHash = bcrypt.hashSync(adminPassword, 10);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "yamral.sid",
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 2 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, "public")));

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin === true) return next();
  return res.status(401).json({ error: "Please sign in as administrator." });
}

app.get("/api/projects", (req, res) => {
  const projects = db.prepare("SELECT id, title, description, category, created_at FROM projects ORDER BY id DESC").all();
  res.json(projects);
});

app.post("/api/messages", (req, res) => {
  const { name, email, message } = req.body || {};
  if (![name, email, message].every(v => typeof v === "string" && v.trim())) {
    return res.status(400).json({ error: "Please complete all fields." });
  }
  if (name.length > 80 || email.length > 160 || message.length > 3000) {
    return res.status(400).json({ error: "One or more fields are too long." });
  }
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  if (!validEmail) return res.status(400).json({ error: "Please enter a valid email address." });
  db.prepare("INSERT INTO messages (name, email, message) VALUES (?, ?, ?)")
    .run(name.trim(), email.trim(), message.trim());
  res.status(201).json({ ok: true, message: "Your message has been saved." });
});

app.post("/api/admin/login", (req, res) => {
  const { username: inputUser, password } = req.body || {};
  if (inputUser === username && typeof password === "string" && bcrypt.compareSync(password, passwordHash)) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Incorrect username or password." });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/me", (req, res) => res.json({ authenticated: req.session?.admin === true }));

app.get("/api/admin/messages", requireAdmin, (req, res) => {
  res.json(db.prepare("SELECT * FROM messages ORDER BY id DESC").all());
});

app.delete("/api/admin/messages/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM messages WHERE id = ?").run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: "Message not found." });
  res.json({ ok: true });
});

app.post("/api/admin/projects", requireAdmin, (req, res) => {
  const { title, description, category } = req.body || {};
  if (![title, description, category].every(v => typeof v === "string" && v.trim())) {
    return res.status(400).json({ error: "Complete all project fields." });
  }
  if (title.length > 100 || description.length > 1000 || category.length > 60) {
    return res.status(400).json({ error: "Project details are too long." });
  }
  const result = db.prepare("INSERT INTO projects (title, description, category) VALUES (?, ?, ?)")
    .run(title.trim(), description.trim(), category.trim());
  res.status(201).json({ id: result.lastInsertRowid });
});

app.delete("/api/admin/projects/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: "Project not found." });
  res.json({ ok: true });
});

app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

app.listen(PORT, () => {
  console.log(`Portfolio running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
