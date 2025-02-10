// In-memory conversation context storage
const conversationContexts = new Map();
let idCounter = 1;

/**
 * Creates a new conversation context
 * @param {string} ideaDescription - Initial user idea description
 * @returns {string} Generated conversation ID
 */
export function createConversationContext(ideaDescription) {
    const conversationId = String(idCounter++);
    const context = {
        conversationId,
        ideaDescription,
        conversationHistory: [],
        roadmap: {
            initialClarificationQuestions: null,
            marketOverview: null,
            mvpEpics: null,
            taskBreakdown: null
        }
    };
    conversationContexts.set(conversationId, context);
    return conversationId;
}

/**
 * Retrieves conversation context by ID
 * @param {string} conversationId
 * @returns {object|null} Context object or null if not found
 */
export function getConversationContext(conversationId) {
    return conversationContexts.get(conversationId) || null;
}

/**
 * Updates conversation context with partial data
 * @param {string} conversationId
 * @param {object} updates - Partial context object with updates
 * @returns {boolean} True if update succeeded
 */
export function updateConversationContext(conversationId, updates) {
    const context = conversationContexts.get(conversationId);
    if (!context) return false;

    Object.assign(context, updates);
    return true;
}

/**
 * Adds a conversation turn to the history
 * @param {string} conversationId
 * @param {object} turn - { role: 'user'|'assistant', content: string }
 * @returns {boolean} True if add succeeded
 */
export function addConversationTurn(conversationId, turn) {
    const context = conversationContexts.get(conversationId);
    if (!context) return false;

    context.conversationHistory.push({
        ...turn,
        timestamp: new Date().toISOString()
    });
    return true;
}
