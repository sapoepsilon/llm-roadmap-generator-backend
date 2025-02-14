import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { generateMvpRoadmap } from "./services/roadmap_service.js";
import {
  createConversationContext,
  getConversationContext,
} from "./services/conversation_context_service.js";
import { generateText, chatWithHistory } from "./utils/llm_utils.js";

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

// Configure CORS middleware
const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options("*", cors(corsOptions));

// Store chat histories in memory (in a production environment, use a proper database)
const chatSessions = new Map();

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

app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create chat history for this session
    let history = chatSessions.get(sessionId) || [];

    // Check if this is a roadmap generation request
    const isRoadmapRequest =
      message.toLowerCase().includes("generate roadmap") ||
      message.toLowerCase().includes("create roadmap") ||
      message.toLowerCase().includes("build roadmap");

    if (isRoadmapRequest) {
      // Extract the idea description from the message
      const ideaDescription = message
        .replace(/generate|create|build|roadmap/gi, "")
        .trim();

      // Generate roadmap using the roadmap service
      const roadmapResult = await generateMvpRoadmap(
        sessionId,
        ideaDescription
      );

      // Add the roadmap request and response to chat history
      history.push(
        { role: "user", parts: message },
        {
          role: "model",
          parts:
            `Here's your roadmap:\n\n` +
            `Initial Questions:\n${roadmapResult.initialClarificationQuestions}\n\n` +
            `Market Overview:\n${roadmapResult.marketOverview}\n\n` +
            `MVP Epics:\n${roadmapResult.mvpEpics}\n\n` +
            `Task Breakdown:\n${roadmapResult.taskBreakdown}`,
        }
      );

      // Update session history
      chatSessions.set(sessionId, history);
      console.log(JSON.stringify(history, null, 2));
      return res.json({
        response: roadmapResult,
        type: "roadmap",
        sessionId,
      });
    }

    // Regular chat flow
    // Add user message to history
    history.push({ role: "user", parts: message });

    // Get AI response
    const response = await chatWithHistory(message, history);

    // Add AI response to history
    history.push({ role: "model", parts: response.responseText });

    // Update session history
    chatSessions.set(sessionId, history);

    res.json({
      response: response.responseText,
      type: "chat",
      groundingMetadata: response.groundingMetadata,
      sessionId,
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
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
