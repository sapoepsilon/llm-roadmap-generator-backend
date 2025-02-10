import * as dotenv from "dotenv";
import express from "express";
import cors from 'cors';
import { generateMvpRoadmap } from "./services/roadmap_service.js";
import { createConversationContext, getConversationContext } from './services/conversation_context_service.js';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set");
  process.exit(1);
}

console.log(
  "Environment variables loaded successfully. Gemini API key is present."
);

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.post("/generate-roadmap", async (req, res) => {
  const { ideaDescription } = req.body;
  const { conversationId } = createConversationContext(ideaDescription);

  if (!ideaDescription) {
    return res
      .status(400)
      .json({ error: "Missing 'ideaDescription' in request body" });
  }

  try {
    const roadmap = await generateMvpRoadmap(conversationId, ideaDescription);
    res.json({ conversationId, roadmap });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    res
      .status(500)
      .json({ error: "Failed to generate roadmap. Please check server logs." });
  }
});

app.get("/", (req, res) => {
  res.send(
    "MVP Roadmap Generator Backend is running. Send POST requests to /generate-roadmap."
  );
});

app.listen(port, () => {
  console.log(`Backend listening on port http://localhost:${port}`);
});
