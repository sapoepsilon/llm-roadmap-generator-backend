// src/services/roadmap_service.js
import { chatWithHistory } from "../utils/llm_utils.js";
import { supabase } from "../utils/supabase.js";

/**
 * Generates an MVP roadmap with progressive database updates
 * @param {string} userId - The authenticated user's ID
 * @param {string} ideaDescription - The initial idea description
 * @returns {Promise<Object>} The generated roadmap with its ID
 */
async function generateMvpRoadmap(userId, ideaDescription) {
  // Start a Supabase transaction
  const { data: client } = await supabase.rpc("begin_transaction");

  try {
    console.log("Starting MVP Roadmap generation for idea:", ideaDescription);

    // 1. Create initial roadmap entry
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .insert({
        user_id: userId,
        original_idea: ideaDescription,
      })
      .select("id")
      .single();

    if (roadmapError)
      throw new Error(`Failed to create roadmap: ${roadmapError.message}`);

    const roadmapId = roadmap.id;

    // Initialize conversation record
    const { error: convError } = await supabase
      .from("roadmap_conversations")
      .insert({
        roadmap_id: roadmapId,
        messages: [],
      });

    if (convError)
      throw new Error(`Failed to create conversation: ${convError.message}`);

    let chatHistory = [];

    // 2. Initial Questions Phase
    const initialQuestionsPrompt = `You are an expert product roadmap generator. A user has provided an idea: "${ideaDescription}". Ask 2-3 concise questions to better understand their idea and its target users. Focus on clarifying the core functionality and target audience for an MVP.`;
    const initialQuestionsResult = await chatWithHistory(
      initialQuestionsPrompt,
      chatHistory
    );
    const initialQuestions = initialQuestionsResult.responseText;

    // Update roadmap with questions
    const { error: questionsError } = await supabase
      .from("roadmaps")
      .update({ clarification_questions: initialQuestions })
      .eq("id", roadmapId);

    if (questionsError)
      throw new Error(`Failed to update questions: ${questionsError.message}`);

    chatHistory.push(
      { role: "user", parts: initialQuestionsPrompt },
      { role: "model", parts: initialQuestions }
    );

    // 3. Market Overview Phase
    const marketOverviewPrompt = `Based on our discussion about "${ideaDescription}", provide a brief market overview including potential market size, key competitors, and current trends. Use web search to ground your response in recent information. Keep it concise for an MVP roadmap context.`;
    const marketOverviewResult = await chatWithHistory(
      marketOverviewPrompt,
      chatHistory
    );
    const marketOverview = marketOverviewResult.responseText;
    const marketOverviewMetadata = marketOverviewResult.groundingMetadata || {};

    // Update roadmap with market overview
    const { error: marketError } = await supabase
      .from("roadmaps")
      .update({ 
        market_overview: marketOverview,
        market_overview_metadata: marketOverviewMetadata
      })
      .eq("id", roadmapId);

    if (marketError)
      throw new Error(
        `Failed to update market overview: ${marketError.message}`
      );

    chatHistory.push(
      { role: "user", parts: marketOverviewPrompt },
      { role: "model", parts: marketOverview }
    );

    // 4. Epic Generation Phase
    const epicPrompt = `Given our previous discussion about the market and the idea "${ideaDescription}", suggest 2-3 high-level epics (major feature areas) for the MVP. Focus on core functionality that addresses the market needs we identified.`;
    const mvpEpicsResult = await chatWithHistory(epicPrompt, chatHistory);
    const mvpEpics = mvpEpicsResult.responseText;

    // Update roadmap with epics
    const { error: epicsError } = await supabase
      .from("roadmaps")
      .update({ mvp_epics: mvpEpics })
      .eq("id", roadmapId);

    if (epicsError)
      throw new Error(`Failed to update epics: ${epicsError.message}`);

    chatHistory.push(
      { role: "user", parts: epicPrompt },
      { role: "model", parts: mvpEpics }
    );

    // 5. Task Breakdown Phase
    const taskBreakdownPrompt = `Based on all our previous discussion about the market, idea, and epics, break down the first epic into specific, actionable tasks. Include estimated complexity (Low/Medium/High) for each task.`;
    const taskBreakdownResult = await chatWithHistory(
      taskBreakdownPrompt,
      chatHistory
    );
    const taskBreakdown = taskBreakdownResult.responseText;

    // Update roadmap with tasks
    const { error: tasksError } = await supabase
      .from("roadmaps")
      .update({
        task_breakdown: taskBreakdown,
      })
      .eq("id", roadmapId);

    if (tasksError)
      throw new Error(`Failed to update tasks: ${tasksError.message}`);

    chatHistory.push(
      { role: "user", parts: taskBreakdownPrompt },
      { role: "model", parts: taskBreakdown }
    );

    // Update conversation history
    const { error: historyError } = await supabase
      .from("roadmap_conversations")
      .update({ messages: chatHistory })
      .eq("roadmap_id", roadmapId);

    if (historyError)
      throw new Error(
        `Failed to update conversation history: ${historyError.message}`
      );

    // Commit transaction
    await supabase.rpc("commit_transaction");

    // Return the complete roadmap data
    return {
      roadmapId,
      originalIdea: ideaDescription,
      clarificationQuestions: initialQuestions,
      marketOverview: marketOverview,
      marketOverviewMetadata: marketOverviewMetadata,
      mvpEpics: mvpEpics,
      taskBreakdown: taskBreakdown,
      conversationHistory: chatHistory,
    };
  } catch (error) {
    // Rollback transaction on any error
    await supabase.rpc("rollback_transaction");

    console.error("Error generating roadmap:", error);
    throw new Error(`Failed to generate roadmap: ${error.message}`);
  }
}

export { generateMvpRoadmap };
