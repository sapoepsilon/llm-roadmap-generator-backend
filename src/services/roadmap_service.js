// src/services/roadmap_service.js
import { chatWithHistory } from "../utils/llm_utils.js";

async function generateMvpRoadmap(conversationId, ideaDescription) {
  console.log("generateMvpRoadmap called with conversationId:", conversationId);
  console.log(
    "Starting MVP Roadmap generation with chat history for idea:",
    ideaDescription
  );

  let chatHistory = [];

  // 1. Initial Idea Understanding & Clarification
  const initialQuestionsPrompt = `You are an expert product roadmap generator. A user has provided an idea: "${ideaDescription}". Ask 2-3 concise questions to better understand their idea and its target users. Focus on clarifying the core functionality and target audience for an MVP.`;
  const initialQuestionsResult = await chatWithHistory(initialQuestionsPrompt, chatHistory);
  const initialQuestions = initialQuestionsResult.responseText;
  chatHistory.push(
    { role: "user", parts: initialQuestionsPrompt },
    { role: "model", parts: initialQuestions }
  );
  console.log("Initial Clarification Questions:\n", initialQuestions);

  // 2. Market Overview (with context from previous interaction)
  const marketOverviewPrompt = `Based on our discussion about "${ideaDescription}", provide a brief market overview including potential market size, key competitors, and current trends. Use web search to ground your response in recent information. Keep it concise for an MVP roadmap context.`;
  const marketOverviewResult = await chatWithHistory(marketOverviewPrompt, chatHistory);
  const marketOverview = marketOverviewResult.responseText;
  const marketOverviewGrounding = marketOverviewResult.groundingMetadata;
  chatHistory.push(
    { role: "user", parts: marketOverviewPrompt },
    { role: "model", parts: marketOverview }
  );
  console.log("Market Overview (with context):\n", marketOverview);
  console.log("Market Overview Grounding Metadata:\n", marketOverviewGrounding);

  // 3. Epic Generation (with accumulated context)
  const epicPrompt = `Given our previous discussion about the market and the idea "${ideaDescription}", suggest 2-3 high-level epics (major feature areas) for the MVP. Focus on core functionality that addresses the market needs we identified.`;
  const mvpEpicsResult = await chatWithHistory(epicPrompt, chatHistory);
  const mvpEpics = mvpEpicsResult.responseText;
  chatHistory.push(
    { role: "user", parts: epicPrompt },
    { role: "model", parts: mvpEpics }
  );
  console.log("Generated MVP Epics:\n", mvpEpics);

  // 4. Task Breakdown (with full context)
  const taskBreakdownPrompt = `Based on all our previous discussion about the market, idea, and epics, break down the first epic into specific, actionable tasks. Include estimated complexity (Low/Medium/High) for each task.`;
  const taskBreakdownResult = await chatWithHistory(taskBreakdownPrompt, chatHistory);
  const taskBreakdown = taskBreakdownResult.responseText;
  chatHistory.push(
    { role: "user", parts: taskBreakdownPrompt },
    { role: "model", parts: taskBreakdown }
  );
  console.log("Task Breakdown:\n", taskBreakdown);

  const roadmapOutput = {
    idea: ideaDescription,
    initialClarificationQuestions: initialQuestions,
    marketOverview: marketOverview,
    marketOverviewGroundingMetadata: marketOverviewGrounding,
    mvpEpics: mvpEpics,
    taskBreakdown: taskBreakdown,
    conversationHistory: chatHistory
  };

  console.log(
    "\nRoadmap Generation Complete (with Chat History):\n",
    roadmapOutput
  );
  return roadmapOutput;
}

export { generateMvpRoadmap };
