import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Allow embedding in Google Sites and other trusted domains
app.use((req, res, next) => {
  // Clear any default X-Frame-Options
  res.removeHeader("X-Frame-Options");
  
  // Explicitly allow framing from Google Sites and common Google domains
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://sites.google.com https://*.google.com https://*.googleusercontent.com https://*.gstatic.com *;"
  );
  
  // Standard CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Tell browsers this is a "safe" cross-origin request
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  
  next();
});

app.use(express.json());

// Root path logger
app.get("/", (req, res, next) => {
  console.log(`[Root Access] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test route for embedding
app.get("/test-embed", (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 20px; text-align: center;">
      <h1 style="color: #4f46e5;">Architech Embed Success!</h1>
      <p>If you can see this, the connection to Google Sites is working.</p>
      <p>Time: ${new Date().toLocaleTimeString()}</p>
    </div>
  `);
});

// Lazy initialization for OpenAI (OpenRouter)
let openaiClient: OpenAI | null = null;
function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is required");
    }
    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-OpenRouter-Title": "Architech",
      },
    });
  }
  return openaiClient;
}

// Lazy initialization for Supabase
let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required");
    }
    
    try {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    } catch (error: any) {
      throw new Error(`Failed to initialize Supabase client: ${error.message}`);
    }
  }
  return supabaseClient;
}

// API Routes
app.post("/api/generate-blueprint", async (req, res) => {
  const { input } = req.body;

  if (!input) {
    return res.status(400).json({ error: "Input is required" });
  }

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "qwen/qwen-2.5-72b-instruct",
      messages: [
        {
          role: "system",
          content: `Role: You are the Architech Lead Mentor, an expert Full-Stack Software Architect and Product Manager. Your mission is to help students transition from writing basic code to building scalable, production-ready applications.

Objective: When a student provides an app idea or a Business Model Canvas, you must analyze it and produce a high-level Technical Blueprint.

Output Requirements:
Your response must be structured into the following FIVE modules:

1. Product Logic & Core Features: Break the student's idea into "Must-Have" vs. "Nice-to-Have" features. Identify the primary user flow.

2. The Tech Stack Recommendation: Suggest a modern, beginner-friendly, but scalable stack (e.g., React/Next.js, Supabase for backend, Tailwind CSS). Explain why these tools are chosen.

3. Data Architecture: Provide a simplified database schema (tables and relationships). Use Markdown tables.

4. Supabase SQL Schema: Provide the EXACT SQL code to create the tables, relationships, and basic RLS (Row Level Security) policies in Supabase. This should be ready to copy-paste into the Supabase SQL Editor.

5. The "First Brick" Code Snippet: Provide a clean, well-commented boilerplate snippet in the recommended language.

Tone & Style:
- Encouraging yet Professional.
- Architectural Focus: Explain the structure.
- Constraint-Aware: Assume limited budget.

Constraint: If a student's idea is too vague, ask two specific clarifying questions before providing the full blueprint.`
        },
        {
          role: "user",
          content: input,
        },
      ],
    });

    const blueprint = completion.choices[0].message.content;

    // Calculate cost based on prompt size (simplified)
    // Assuming $0.002 per 1k tokens for Qwen 2.5 72B (approximate)
    const promptTokens = input.length / 4; // Rough estimate
    const completionTokens = (blueprint?.length || 0) / 4;
    const estimatedCost = ((promptTokens + completionTokens) / 1000) * 0.002;

    res.json({ blueprint, estimatedCost });
  } catch (error: any) {
    console.error("OpenRouter Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/save-blueprint", async (req, res) => {
  const { title, content, estimatedCost } = req.body;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("blueprints")
      .insert([{ title, content, estimated_cost: estimatedCost }])
      .select();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Supabase Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  });
}

startServer();
