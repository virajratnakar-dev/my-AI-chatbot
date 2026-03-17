import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "chats.json");
const USERS_FILE = path.join(__dirname, "users.json");

// 🔑 Your OpenAI API key here
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

let chatStore = {};
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    chatStore = JSON.parse(raw) || {};
  }
} catch (err) {
  console.error("Failed to load chat history store:", err);
  chatStore = {};
}

let usersStore = {};
try {
  if (fs.existsSync(USERS_FILE)) {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    usersStore = JSON.parse(raw) || {};
  }
} catch (err) {
  console.error("Failed to load users store:", err);
  usersStore = {};
}

function persistChats() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(chatStore, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save chat history:", err);
  }
}

function persistUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersStore, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save users:", err);
  }
}

function normalizeUser(username = "") {
  return username.trim().toLowerCase();
}

// Authentication endpoints
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  const normalized = normalizeUser(username);
  
  if (!normalized || !password || password.length < 3) {
    res.status(400).json({ error: "Username and password (min 3 chars) required" });
    return;
  }
  
  if (usersStore[normalized]) {
    res.status(400).json({ error: "Username already exists" });
    return;
  }
  
  try {
    const hash = await bcrypt.hash(password, 10);
    usersStore[normalized] = { passwordHash: hash };
    persistUsers();
    res.json({ success: true });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const normalized = normalizeUser(username);
  
  if (!normalized || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  
  const user = usersStore[normalized];
  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  
  try {
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to verify password" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();

    // Auto-register Google users
    if (!usersStore[email]) {
      usersStore[email] = { google: true };
      persistUsers();
    }

    res.json({ success: true, username: email });
  } catch (e) {
    console.error("Google error:", e);
    res.status(401).json({ success: false });
  }
});

app.get("/api/chats/:username", (req, res) => {
  const username = normalizeUser(req.params.username);
  if (!username) {
    res.status(400).json({ error: "Username required" });
    return;
  }
  const chats = chatStore[username] || [];
  res.json({ chats });
});

app.post("/api/chats/:username", (req, res) => {
  const username = normalizeUser(req.params.username);
  if (!username) {
    res.status(400).json({ error: "Username required" });
    return;
  }
  const { chats } = req.body || {};
  if (!Array.isArray(chats)) {
    res.status(400).json({ error: "Chats must be an array" });
    return;
  }
  chatStore[username] = chats;
  persistChats();
  res.json({ success: true });
});

app.post("/api/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ reply: "Question required" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.3-chat-latest",
        input: question
      })
    });

    const data = await response.json();

    let reply = "No reply generated.";

if (Array.isArray(data.output)) {
  for (const item of data.output) {
    if (Array.isArray(item.content)) {
      for (const block of item.content) {
        if (block.type === "output_text" && block.text) {
          reply = block.text;
          break;
        }
      }
    }
  }
}


    res.json({ reply });

  } catch (err) {
    console.error("GPT-5 error:", err);
    res.status(500).json({ reply: "OpenAI API error" });
  }
});


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
