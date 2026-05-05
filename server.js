require("dotenv").config();

const http = require("http");

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const PORTFOLIO_FILE = path.join(DATA_DIR, "portfolio.json");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_BODY_SIZE = 10 * 1024 * 1024;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "blaq_admin_studio";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Blaq2026!Vault#Studio";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") !== "false";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const QUOTE_TO_EMAIL = process.env.QUOTE_TO_EMAIL || "talk2blaqgraphicslivee@gmail.com";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";
const sessions = new Map();

const defaultPortfolio = [
  {
    id: "default-logo-1",
    title: "Signature Logo Direction",
    category: "logos",
    description: "A premium identity concept designed to feel bold, polished, and memorable.",
    image: "/assets/blaqgraphics-logo.jpeg"
  },
  {
    id: "default-graphics-1",
    title: "Social Promo Flyer",
    category: "graphics",
    description: "High-energy flyer layout style for events, offers, launches, and promotions.",
    image: createPlaceholderImage("Motion Flyer", "Graphics")
  },
  {
    id: "default-web-1",
    title: "Business Website Concept",
    category: "web",
    description: "A clean digital presentation for brands that want to feel established online.",
    image: createPlaceholderImage("Website Build", "Digital")
  },
  {
    id: "default-logo-2",
    title: "Luxury Brand Mark",
    category: "logos",
    description: "Identity work for businesses that need a richer, more premium first impression.",
    image: createPlaceholderImage("Logo Suite", "Branding")
  },
  {
    id: "default-graphics-2",
    title: "Print Banner Direction",
    category: "graphics",
    description: "Outdoor-ready banners and event materials with strong visual hierarchy.",
    image: createPlaceholderImage("Banner Design", "Print")
  },
  {
    id: "default-web-2",
    title: "Mobile App Preview",
    category: "web",
    description: "App interface presentation designed for bookings, product browsing, or customer flow.",
    image: createPlaceholderImage("Mobile App", "Experience")
  }
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);
    cleanupSessions();

    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
      return;
    }

    if (pathname === "/admin" || pathname === "/admin/") {
      const session = getSession(req);
      const filePath = session ? path.join(ROOT, "admin", "panel.html") : path.join(ROOT, "admin", "index.html");
      await serveFile(res, filePath, { cache: false });
      return;
    }

    if (pathname === "/admin/panel.html") {
      if (!getSession(req)) {
        redirect(res, "/admin/");
        return;
      }
      await serveFile(res, path.join(ROOT, "admin", "panel.html"), { cache: false });
      return;
    }

    if (pathname === "/admin/index.html") {
      await serveFile(res, path.join(ROOT, "admin", "index.html"), { cache: false });
      return;
    }

    if (pathname === "/healthz") {
      sendJson(res, 200, { ok: true, status: "healthy" });
      return;
    }

    if (pathname === "/") {
      await serveFile(res, path.join(ROOT, "index.html"));
      return;
    }

    const safePath = path.normalize(path.join(ROOT, pathname));
    if (!safePath.startsWith(ROOT)) {
      sendJson(res, 403, { error: "Forbidden" });
      return;
    }

    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      await serveFile(res, safePath, { cache: !pathname.startsWith("/admin/") });
      return;
    }

    sendText(res, 404, "Not found");
  } catch (error) {
    sendJson(res, 500, { error: "Server error", detail: error.message });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const publicUrl = PUBLIC_BASE_URL || `http://localhost:${PORT}`;
  console.log(`Blaqgraphics server running on ${publicUrl}`);
});

async function handleApi(req, res, pathname) {
  if (pathname === "/api/session" && req.method === "GET") {
    sendJson(res, 200, { authenticated: Boolean(getSession(req)) });
    return;
  }

  if (pathname === "/api/login" && req.method === "POST") {
    const body = await readJsonBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      sendJson(res, 401, { error: "Invalid credentials" });
      return;
    }

    const sessionId = crypto.randomBytes(24).toString("hex");
    sessions.set(sessionId, Date.now() + SESSION_TTL_MS);
    res.setHeader("Set-Cookie", createSessionCookie(sessionId));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/logout" && req.method === "POST") {
    const sessionId = getSessionId(req);
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.setHeader("Set-Cookie", "blaqgraphics_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/portfolio" && req.method === "GET") {
    const portfolio = await readPortfolio();
    sendJson(res, 200, portfolio);
    return;
  }

  if (pathname === "/api/quote" && req.method === "POST") {
    const body = await readJsonBody(req);
    const quote = {
      id: `quote-${Date.now()}`,
      createdAt: new Date().toISOString(),
      name: String(body.name || "").trim(),
      email: String(body.email || "").trim(),
      service: String(body.service || "").trim(),
      followUpPreference: String(body.followUpPreference || "").trim(),
      details: String(body.details || "").trim()
    };

    if (!quote.name || !quote.email || !quote.service || !quote.details) {
      sendJson(res, 400, { error: "Invalid quote request" });
      return;
    }

    const quotes = await readQuotes();
    quotes.unshift(quote);
    await writeQuotes(quotes);
    sendQuoteEmail(quote).then(() => {
      console.log(`Quote email sent for ${quote.id}`);
    }).catch((error) => {
      console.error(`Quote email failed for ${quote.id}: ${error.message}`);
    });
    sendJson(res, 201, { ok: true, message: "Quote request received" });
    return;
  }

  if (!getSession(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  if (pathname === "/api/portfolio" && req.method === "POST") {
    const body = await readJsonBody(req);
    const item = {
      id: `custom-${Date.now()}`,
      title: String(body.title || "").trim(),
      category: String(body.category || "").trim(),
      description: String(body.description || "").trim(),
      image: String(body.image || "")
    };

    if (!item.title || !item.description || !item.image || !["logos", "graphics", "web"].includes(item.category)) {
      sendJson(res, 400, { error: "Invalid portfolio item" });
      return;
    }

    const portfolio = await readPortfolio();
    portfolio.unshift(item);
    await writePortfolio(portfolio);
    sendJson(res, 201, item);
    return;
  }

  if (pathname === "/api/portfolio/reset" && req.method === "POST") {
    await writePortfolio(defaultPortfolio);
    sendJson(res, 200, defaultPortfolio);
    return;
  }

  if (pathname.startsWith("/api/portfolio/") && req.method === "DELETE") {
    const id = pathname.split("/").pop();
    const portfolio = await readPortfolio();
    const filtered = portfolio.filter((item) => item.id !== id);
    await writePortfolio(filtered);
    sendJson(res, 200, filtered);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

async function serveFile(res, filePath, options = {}) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || "application/octet-stream";
  const buffer = await fsp.readFile(filePath);
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": options.cache === false ? "no-store" : "public, max-age=300"
  });
  res.end(buffer);
}

async function readPortfolio() {
  await ensurePortfolioFile();
  const raw = await fsp.readFile(PORTFOLIO_FILE, "utf8");
  return JSON.parse(raw);
}

async function writePortfolio(items) {
  await fsp.writeFile(PORTFOLIO_FILE, JSON.stringify(items, null, 2));
}

async function ensurePortfolioFile() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    await fsp.access(PORTFOLIO_FILE);
  } catch {
    await writePortfolio(defaultPortfolio);
  }
}

async function readQuotes() {
  await ensureQuotesFile();
  const raw = await fsp.readFile(QUOTES_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeQuotes(items) {
  await fsp.writeFile(QUOTES_FILE, JSON.stringify(items, null, 2));
}

async function ensureQuotesFile() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    await fsp.access(QUOTES_FILE);
  } catch {
    await writeQuotes([]);
  }
}

async function sendQuoteEmail(quote) {
  if (!SMTP_USER || !SMTP_PASS) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  const lines = [
    "New Blaqgraphics quote request",
    "",
    `Name: ${quote.name}`,
    `Email: ${quote.email}`,
    `Service: ${quote.service}`,
    `Follow-up Preference: ${quote.followUpPreference}`,
    `Submitted: ${quote.createdAt}`,
    "",
    "Project Details:",
    quote.details
  ];

  await transporter.sendMail({
    from: `"Blaqgraphics Website" <${SMTP_USER}>`,
    to: QUOTE_TO_EMAIL,
    replyTo: quote.email,
    subject: `Blaqgraphics Quote Request - ${quote.service}`,
    text: lines.join("\n")
  });
}



function getSession(req) {
  const sessionId = getSessionId(req);
  if (!sessionId) {
    return null;
  }

  const expiresAt = sessions.get(sessionId);
  if (!expiresAt || expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return { id: sessionId, expiresAt };
}

function getSessionId(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies.blaqgraphics_session || null;
}

function parseCookies(header) {
  return header.split(";").reduce((acc, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

function createSessionCookie(sessionId) {
  return `blaqgraphics_session=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [sessionId, expiresAt] of sessions.entries()) {
    if (expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) {
      throw new Error("Request body too large");
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function createPlaceholderImage(title, label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#050505" />
          <stop offset="55%" stop-color="#1a1a1a" />
          <stop offset="100%" stop-color="#8c6114" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" />
      <circle cx="980" cy="160" r="170" fill="rgba(255,255,255,0.08)" />
      <circle cx="200" cy="760" r="240" fill="rgba(216,157,44,0.18)" />
      <rect x="74" y="72" width="1052" height="756" rx="38" fill="none" stroke="rgba(255,255,255,0.14)" />
      <text x="100" y="190" fill="#f0c972" font-size="42" font-family="Arial, sans-serif" letter-spacing="8">${label}</text>
      <text x="100" y="420" fill="#f7f4ef" font-size="92" font-weight="700" font-family="Arial, sans-serif">${title}</text>
      <text x="100" y="500" fill="#d9d9df" font-size="32" font-family="Arial, sans-serif">Blaqgraphics portfolio preview</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}















