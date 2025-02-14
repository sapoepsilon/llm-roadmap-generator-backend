// tests/conversation_context_service.test.js
import {
  vi,
  describe,
  test,
  expect,
  beforeAll,
  afterEach,
  beforeEach,
} from "vitest";
import {
  createConversationContext,
  loadConversationsFromFile,
  saveConversationsToFile,
  conversationContexts,
} from "../src/services/conversation_context_service.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_FILE = path.join(__dirname, "test_conversations.json");

describe("Conversation Context Service", () => {
  beforeAll(() => {
    // Use test-specific file
    process.env.CONVERSATIONS_FILE = TEST_FILE;
  });

  afterEach(async () => {
    // Cleanup test file
    try {
      await fs.unlink(TEST_FILE);
    } catch {}
    // Clear the Map
    if (
      conversationContexts &&
      typeof conversationContexts.clear === "function"
    ) {
      conversationContexts.clear();
    }
  });

  describe("ideaDescription handling", () => {
    test("should store plain string correctly", async () => {
      const context = await createConversationContext({
        ideaDescription: "simple string",
      });

      // Test in-memory
      expect(context.ideaDescription).toBe("simple string");

      // Test serialization
      await saveConversationsToFile();
      const fileContents = await fs.readFile(TEST_FILE, "utf8");
      expect(JSON.parse(fileContents)[context.id].ideaDescription).toBe(
        "simple string"
      );
    });

    test("should serialize objects to JSON string", async () => {
      const complexObject = {
        summary: "AI architecture",
        details: { model: "VLM", version: 2.1 },
      };

      const context = await createConversationContext({
        ideaDescription: complexObject,
      });

      // Test in-memory representation
      expect(typeof context.ideaDescription).toBe("string");
      expect(JSON.parse(context.ideaDescription)).toEqual(complexObject);
    });

    test("should parse stored JSON when loading", async () => {
      const originalObject = { key: "value" };
      await createConversationContext({ ideaDescription: originalObject });
      await saveConversationsToFile();

      // Reset contexts and reload
      conversationContexts.clear();
      await loadConversationsFromFile();

      const [loadedContext] = Array.from(conversationContexts.values());
      expect(loadedContext.ideaDescription).toEqual(originalObject);
    });

    test("should handle invalid JSON gracefully", async () => {
      // Create malformed JSON manually
      await fs.writeFile(
        TEST_FILE,
        JSON.stringify({
          1: {
            id: 1,
            ideaDescription: '{"invalid: json}',
          },
        })
      );

      const consoleError = vi.spyOn(console, "error").mockImplementation();
      await loadConversationsFromFile();

      const [context] = Array.from(conversationContexts.values());
      expect(context.ideaDescription).toBe("");
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("debug logging", () => {
    let consoleDebug;

    beforeEach(() => {
      consoleDebug = vi.spyOn(console, "debug").mockImplementation();
    });

    afterEach(() => {
      consoleDebug.mockRestore();
    });

    test("should log creation debug info", async () => {
      await createConversationContext({
        ideaDescription: { test: "object" },
      });

      expect(consoleDebug).toHaveBeenCalledWith(
        "[DEBUG] Created context:",
        expect.objectContaining({
          ideaDescriptionType: "string",
          ideaDescriptionFirst100: expect.stringContaining('{"test":"object"}'),
        })
      );
    });
  });
});
