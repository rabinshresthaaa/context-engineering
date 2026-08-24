import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { ChatView, verifyEnv } from './utils.js';
import initialMessages from './conversation.js';
import { generateText } from 'ai';

// Verify that environment variables are set
verifyEnv();
// Initialize OpenRouter client with API key
const openRouter = createOpenRouter({ apiKey: process.env.OPENROUTER_KEY });
// Get current model and convert it to AI SDK compatible model
const openRouterModel = openRouter(process.env.MODEL_ID);

// Get UI Elements
const summarizeButton = document.getElementById("summarize-button");
const messagesContainer = document.getElementById("messages-container");
const chatContainer = document.getElementById("chat-container");

// Create chat view
const chatView = new ChatView(chatContainer, messagesContainer);

// Load preloaded conversation
const messages = [...initialMessages];
let contextMessages = [...initialMessages];

function start() {
  // Display preloaded messages
  messages.forEach(message => chatView.addMessage(message));
  
  // Update initial counters
  chatView.updateCounters(messages, contextMessages);

  // Handle summarize button click
  summarizeButton.addEventListener("click", summarizeContext);
}

async function summarizeContext() {
  // Disable button while processing
  summarizeButton.disabled = true;
  chatView.addSummarizingIndicator();

  // Try it yourself:
  // 
  // Add a final message to messages that requests a summary.
  // 
  // 💡 Check the hints folder if you're stuck.
  const summaryRequestMessage = {
    role: "user",
    content: `Create a concise, well-organized summary of the entire
    conversation so far to preserve important context. Focus on extracting 
    key user information, important decisions, and technical details 
    that might be referenced later.`
  }
  messages.push(summaryRequestMessage)

  // Send an AI Model request to summarize the conversation so far
  const response = await generateText({
    model: openRouterModel,
    system: `You are an expert at summarizing conversations to preserve important context. 
    Focus on extracting key user information, important decisions, and technical details 
    that might be referenced later. Create a concise, well-organized summary.`,
    messages,
  });
  
  // Create summary message object
  const summaryMessage = { 
    role: "system", 
    content: response.text
  };

  // Replace context with summary
  contextMessages = [ summaryMessage ];

  // Update UI
  chatView.removeSummarizingIndicator();
  chatView.showSummary(summaryMessage.content);
  chatView.updateCounters(messages, contextMessages);
  summarizeButton.disabled = false;
}

start();