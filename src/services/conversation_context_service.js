import { promises as fs } from "fs";

const CONVERSATIONS_FILE = "conversations.json";
let conversationContexts = new Map();
let idCounter = 1;

async function loadConversationsFromFile() {
  try {
    const data = await fs.readFile(CONVERSATIONS_FILE, "utf8");
    const parsedData = JSON.parse(data);

    // Convert the parsed object back to a Map
    conversationContexts = new Map(
      Object.entries(parsedData).map(([id, context]) => {
        // Try to parse ideaDescription if it's a JSON string
        try {
          if (typeof context.ideaDescription === "string") {
            const parsed = JSON.parse(context.ideaDescription);
            context.ideaDescription = parsed;
          }
        } catch (error) {
          console.error("[DEBUG] Failed to parse ideaDescription:", {
            id: context.id,
            error: error.message,
            rawValue: context.ideaDescription?.slice(0, 100),
          });
          context.ideaDescription = "";
        }

        return [
          Number(id),
          {
            ...context,
            id: Number(id),
            history: Array.isArray(context.history) ? context.history : [],
          },
        ];
      })
    );
    console.log(
      `Loaded ${conversationContexts.size} conversations from ${CONVERSATIONS_FILE}`
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(
        `${CONVERSATIONS_FILE} not found, starting with empty conversations.`
      );
    } else {
      console.error("Error loading conversations:", error);
    }
    conversationContexts = new Map();
  }
}

async function saveConversationsToFile() {
  try {
    // Convert Map to a plain object for serialization
    const serializableMap = Object.fromEntries(
      Array.from(conversationContexts.entries()).map(([id, context]) => {
        console.debug("[DEBUG] Saving context:", {
          id,
          ideaDescriptionType: typeof context.ideaDescription,
          ideaDescription: context.ideaDescription?.slice(0, 100),
        });

        return [
          id,
          {
            ...context,
            ideaDescription:
              typeof context.ideaDescription === "object"
                ? JSON.stringify(context.ideaDescription)
                : String(context.ideaDescription || ""),
          },
        ];
      })
    );

    const data = JSON.stringify(serializableMap, null, 2);
    await fs.writeFile(CONVERSATIONS_FILE, data, "utf8");
    console.log(
      `Saved ${conversationContexts.size} conversations to ${CONVERSATIONS_FILE}`
    );
  } catch (error) {
    console.error("Error saving conversations:", error);
    throw error;
  }
}

async function createConversationContext(initialParams = {}) {
  const context = {
    id: idCounter++,
    createdAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    history: [],
    ideaDescription:
      typeof initialParams.ideaDescription === "object"
        ? JSON.stringify(initialParams.ideaDescription)
        : String(initialParams.ideaDescription || ""),
    ...initialParams,
  };

  console.debug("[DEBUG] Created context:", {
    id: context.id,
    ideaDescriptionType: typeof context.ideaDescription,
    ideaDescriptionFirst100: context.ideaDescription?.slice(0, 100),
  });

  conversationContexts.set(context.id, context);
  await saveConversationsToFile();
  return context;
}

function getConversationContext(id) {
  return conversationContexts.get(Number(id));
}

async function updateConversationContext(id, updates) {
  const context = getConversationContext(id);
  if (!context) return null;

  Object.assign(context, updates);
  context.lastAccessed = new Date().toISOString();
  await saveConversationsToFile();
  return context;
}

async function addConversationTurn(id, turn) {
  const context = getConversationContext(id);
  if (!context) return null;

  if (!Array.isArray(context.history)) {
    context.history = [];
  }
  context.history.push(turn);
  context.lastAccessed = new Date().toISOString();
  await saveConversationsToFile();
  return context;
}

// Initialize conversation storage on module load
loadConversationsFromFile();

export {
  createConversationContext,
  getConversationContext,
  updateConversationContext,
  addConversationTurn,
  loadConversationsFromFile,
  saveConversationsToFile,
  conversationContexts,
};
