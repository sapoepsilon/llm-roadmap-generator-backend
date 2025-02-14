# Chat Endpoint Documentation

## Overview
The `/chat` endpoint provides a conversational interface with the Gemini AI model, maintaining conversation history for contextual responses.

## Endpoint Details
- **URL**: `/chat`
- **Method**: `POST`
- **Content-Type**: `application/json`

## Request Body

```json
{
  "message": string,    // Required: The user's message
  "sessionId": string   // Optional: Unique identifier for the chat session
}
```

### Parameters
- `message` (required)
  - Type: string
  - Description: The message to send to the AI model
  - Example: "What is a learning roadmap?"

- `sessionId` (optional)
  - Type: string
  - Description: Unique identifier for maintaining conversation history
  - If not provided, the session will be treated as a new conversation
  - Example: "user123"

## Response Format

```json
{
  "response": string,           // The AI model's response text
  "groundingMetadata": object,  // Additional context metadata (if available)
  "sessionId": string          // The session ID used for the conversation
}
```

### Response Fields
- `response`: The text response from the AI model
- `groundingMetadata`: Additional context information (may be null)
- `sessionId`: The session identifier used for this conversation

## Special Features

### Roadmap Generation
The chat endpoint now supports automatic roadmap generation when triggered with specific phrases:
- "generate roadmap"
- "create roadmap"
- "build roadmap"

When these phrases are detected, the message is processed as a roadmap generation request.

#### Roadmap Request Example
```javascript
fetch('/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "generate roadmap for a social media app focused on sharing recipes",
    sessionId: "user123"  // Optional
  })
})
```

#### Roadmap Response Format
When the request is identified as a roadmap request, the response will have a different structure:

```json
{
  "response": {
    "idea": string,
    "initialClarificationQuestions": string,
    "marketOverview": string,
    "marketOverviewGroundingMetadata": object,
    "mvpEpics": string,
    "taskBreakdown": string,
    "conversationHistory": array
  },
  "type": "roadmap",
  "sessionId": string
}
```

For regular chat messages, the response will include a "type": "chat" field to distinguish it from roadmap responses.

## Error Responses

### 400 Bad Request
```json
{
  "error": "Message is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Example Usage

### Starting a New Conversation
```javascript
fetch('/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "What is a learning roadmap?"
  })
})
```

### Continuing a Conversation
```javascript
fetch('/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Can you make it more detailed?",
    sessionId: "previous_session_id"  // Use the sessionId from the previous response
  })
})
```

## Notes
- The conversation history is maintained server-side using the sessionId
- Each message in the conversation contributes to the context for future responses
- The model is configured with specific generation parameters for optimal responses
- Current implementation uses in-memory storage for session history (not persistent across server restarts)
