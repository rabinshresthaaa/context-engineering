import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { ChatView, verifyEnv } from './utils.js';

// Verify that environment variables are set
verifyEnv();
// Initialize OpenRouter client with API key
const openRouter = createOpenRouter({ apiKey: process.env.OPENROUTER_KEY });
// Get current model and convert it to AI SDK compatible model
const openRouterModel = openRouter(process.env.MODEL_ID);

// Get UI Elements
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const messagesContainer = document.getElementById("messages-container");
const chatContainer = document.getElementById("chat-container");

// Create chat view
const chatView = new ChatView(chatContainer, messagesContainer);

// Conversation is initially empty
const messages = [];

function start() {
  // Handle user's message to the AI
  chatForm.addEventListener("submit", handleUserMessage);
}

async function handleUserMessage(event) {
  // Prevents default form submission
  event.preventDefault();

  // Exit if message is empty, otherwise disable input while loading
  const userInput = messageInput.value.trim();
  if (!userInput) return;
  messageInput.value = "";
  disableInputWhileLoading(true);

  // Add user message
  const userMessage = { role: "user", content: userInput };
  messages.push(userMessage);
  chatView.addMessage(userMessage);

  // Add assistant message placeholder
  const assistantMessage = { role: "assistant", content: "" };
  messages.push(assistantMessage);
  chatView.addMessage(assistantMessage);

  try {
    // Try it yourself:
    // 
    // Add a system prompt to the streamText call below.
    // 
    // The prompt should instruct the AI to ask for 
    // clarification instead of assuming what the user wants.
    const response = await streamText({
      model: openRouterModel,
      system: `No intros and conclusions. Instead of assuming, 
      ask for clarification.`,
      messages 
    });

    // Update the assistant message as chunks arrive
    for await (const textChunk of response.textStream) {
      assistantMessage.content += textChunk;
      chatView.updateLatestMessage(assistantMessage.content);
    }

  } catch (err) {
    assistantMessage.content = `**Error:** ${err.message}`;
    chatView.updateLatestMessage(assistantMessage.content);
  }
  
  disableInputWhileLoading(false);
}

function disableInputWhileLoading(shouldDisable) {
  messageInput.disabled = shouldDisable;
  sendButton.disabled = shouldDisable;
}

start();