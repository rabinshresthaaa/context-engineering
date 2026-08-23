import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import initialMessages from './conversation.js'
import { calculateTokens, ChatView, verifyEnv } from './utils.js';

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
const chatContainer = document.getElementById("chat-container");
const messagesContainer = document.getElementById("messages-container");

const messages = [...initialMessages];
const chatView = new ChatView(chatContainer, messagesContainer);

// Message counters are now handled by ChatView

function start() {
  // Display initial conversation
  messages.forEach(message => {
    chatView.addMessage(message);
  });
  
  // Update initial message counter
  chatView.updateCounters(messages);

  // Handle user's message to the AI
  chatForm.addEventListener("submit", handleUserMessage);
  chatView.scrollToBottom();
}

/**
 * Challenge: Token-Based Context Management
 *
 * Keep removing the oldest messages from the conversation
 * until the total token count is under maxTokens.
 *
 * Your task:
 * 1. Use calculateTokens from utils.js to track the token count
 * 2. Keep removing oldest messages until under tokenLimit (always keep at least 1)
 * 3. Return the trimmed array
 * 
 * 💡 Check the hints folder if you're stuck
 */
function getTrimmedContext(messages, tokenLimit) {
  let tokenCount = calculateTokens(messages)
  let trimmedMessages = [ ... messages ]

  while (tokenCount > tokenLimit && trimmedMessages.length >= 1) {
    trimmedMessages.shift()
    tokenCount = calculateTokens(trimmedMessages)
  }

  return trimmedMessages
}

async function handleUserMessage(event) {
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

  // Apply token limiting before making API call
  const MAX_TOKENS = 20000;
  const contextMessages = getTrimmedContext(messages, MAX_TOKENS);
  
  // Update counter to show the difference between total and context messages
  chatView.updateCounters(messages, contextMessages);

  // Try to send user message and stream LLM response, catch any errors
  try {
    const response = await streamText({
      model: openRouterModel,
      messages: contextMessages
    });

    // Update the assistant message as text arrives and check for error events
    // Unlike textStream, fullStream includes error events
    for await (const event of response.fullStream) {
      if (event.type === 'error') {
        throw event.error;
      } else if (event.type === 'text-delta') {
        assistantMessage.content += event.text;
        chatView.updateLatestMessage(assistantMessage.content);
      }
    }

  } catch (err) {
    assistantMessage.content = `**Error:** ${err.message}`;
    chatView.updateLatestMessage(assistantMessage.content);
  }
  
  disableInputWhileLoading(false);
  chatView.updateCounters(messages, contextMessages);
}

function disableInputWhileLoading(shouldDisable) {
  messageInput.disabled = shouldDisable;
  sendButton.disabled = shouldDisable;
}

start();
