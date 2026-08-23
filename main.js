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
const personaSelector = document.getElementById("persona-selector");

// Create chat view
const chatView = new ChatView(chatContainer, messagesContainer);

// Conversation is initially empty
const messages = [];

// Create Persona object
const personas = [
  { value: 'assistant', label: 'Assistant' },
  { value: 'eli5', label: 'ELI5' },
  { value: 'coach', label: 'Coach' },
];

function start() {
  // Add options to Persona selector
  personas.forEach(persona => {
    const option = document.createElement("option");
    option.value = persona.value;
    option.textContent = persona.label;
    personaSelector.appendChild(option);
  });

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

  /** 
   * Challenge:
   * Your app should allow users to select the persona they want to chat with. 
   * This requires you to dynamically assign a system prompt.
   * 
   * 1. Create system prompts for all 3 personas in the systemPrompts object.
   * 
   * 2. Get the user's current selected persona
   * 
   * 3. Assign the selected persona's prompt as the system prompt in streamText
   * 
   * 💡 Check the hints folder if you're stuck
   * **/
  const systemPrompts = {
    assistant: `You are a helpful assistant that asks great follow up questions instead of assuming the user's full intent. Skip the introduction and get straight to the point.`,
    eli5: `You are a helpful teacher who explains concepts in a simple and short manner, as if explaining to a curious and intelligent 5 year old.`,
    coach: `You are a tough love coach that encourages people to be the best version of themselves. You give people realistic action plans and don't accept excuses.`
  };

  const selectedPersona = personaSelector.value
  const personaSystemPrompt = systemPrompts[selectedPersona]

  try {
    // Send conversation history and stream the response
    const response = await streamText({ 
      model: openRouterModel,
      system: personaSystemPrompt,
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