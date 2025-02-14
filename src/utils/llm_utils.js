// src/utils/llm_utils.js
import {
  GoogleGenerativeAI,
  DynamicRetrievalMode,
} from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("llm_utils.js: GEMINI_API_KEY environment variable is not set");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel(
  {
    model: "models/gemini-1.5-pro-002",
    tools: [
      {
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.7,
          },
        },
      },
    ],
  },
  { apiVersion: "v1beta" }
);

async function generateText(promptText) {
  try {
    const result = await model.generateContent(promptText);
    const responseText = result.response.text();
    const groundingMetadata = result.response.candidates[0]?.groundingMetadata;
    return { responseText, groundingMetadata };
  } catch (error) {
    console.error("Error generating text with Gemini (with Grounding):", error);
    return {
      responseText: "Error generating text. Please check the logs.",
      groundingMetadata: null,
    };
  }
}

async function chatWithHistory(promptText, history = []) {
  try {
    // Convert history items to the correct format if they aren't already
    const formattedHistory = history.map(item => ({
      role: item.role,
      parts: [{ text: item.parts }]
    }));

    const chat = await model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(promptText);
    const responseText = result.response.text();
    const groundingMetadata = result.response.candidates[0]?.groundingMetadata;

    return { responseText, groundingMetadata };
  } catch (error) {
    console.error("Error in chat with history:", error);
    return {
      responseText: "Error in chat. Please check the logs.",
      groundingMetadata: null,
    };
  }
}

export { generateText, chatWithHistory };
