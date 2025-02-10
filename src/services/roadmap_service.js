// src/services/roadmap_service.js
import { generateText } from "../utils/llm_utils.js";

async function generateMvpRoadmap(conversationId, ideaDescription) {
  console.log("generateMvpRoadmap called with conversationId:", conversationId);
  console.log(
    "Starting MVP Roadmap generation (with Gemini Grounding) for idea:",
    ideaDescription
  );

  // 1. Initial Idea Understanding & Clarification (using LLM - unchanged)
  const initialQuestionsPrompt = `You are an expert product roadmap generator. A user has provided an idea: "${ideaDescription}".  Ask 2-3 concise questions to better understand their idea and its target users. Focus on clarifying the core functionality and target audience for an MVP.`;
  const initialQuestionsResult = await generateText(initialQuestionsPrompt); // Get result object
  const initialQuestions = initialQuestionsResult.responseText;
  console.log("Initial Clarification Questions from LLM:\n", initialQuestions);

  // 2.  Simplified Market Overview (using Gemini Grounding -  Simplified for MVP)
  const marketOverviewPrompt = `Provide a brief market overview for the idea: "${ideaDescription}", including potential market size, key competitors, and current trends. Use web search to ground your response in recent information. Keep it concise for an MVP roadmap context.`;
  const marketOverviewResult = await generateText(marketOverviewPrompt); // Get result object
  const marketOverview = marketOverviewResult.responseText;
  const marketOverviewGrounding = marketOverviewResult.groundingMetadata; // Get grounding metadata
  console.log(
    "Market Overview from Gemini (with Grounding):\n",
    marketOverview
  );
  console.log("Market Overview Grounding Metadata:\n", marketOverviewGrounding); // Log metadata for inspection

  // 3. Epic Generation (using LLM - very basic for MVP - unchanged)
  const epicPrompt = `Based on the idea: "${ideaDescription}", and considering a simplified MVP approach, suggest 2-3 high-level epics (major feature areas) for the MVP. Keep epics concise and focused on core functionality.`;
  const mvpEpicsResult = await generateText(epicPrompt); // Get result object
  const mvpEpics = mvpEpicsResult.responseText;
  console.log("Generated MVP Epics from LLM:\n", mvpEpics);

  // 4. Task Breakdown (very basic - just a placeholder for MVP - unchanged)
  const taskBreakdownPlaceholder =
    "Task breakdown will be implemented in the next iteration. For now, focus on Epics.";
  console.log("\nTask Breakdown:\n", taskBreakdownPlaceholder);

  const roadmapOutput = {
    idea: ideaDescription,
    initialClarificationQuestions: initialQuestions,
    marketOverview: marketOverview, // Use the grounded market overview text
    marketOverviewGroundingMetadata: marketOverviewGrounding, // Include grounding metadata
    mvpEpics: mvpEpics,
    taskBreakdown: taskBreakdownPlaceholder,
  };

  console.log(
    "\nRoadmap Generation Complete (MVP - Basic Output with Gemini Grounding):\n",
    roadmapOutput
  );
  return roadmapOutput;
}

export { generateMvpRoadmap };
