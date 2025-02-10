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

export { generateText };
