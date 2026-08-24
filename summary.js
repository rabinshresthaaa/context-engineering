import { getTotalTokenCount, getMessageTokenCount } from "./utils.js";
import { generateText } from 'ai';

/**
 * Context Summarization Challenge
 * 
 * Your task is to implement the two functions splitForSummary
 * and generateSummary below.
 * 
 * Available utilities:
 * - getTotalTokenCount(messages) -> total token count for a messages array
 * - getMessageTokenCount(message) -> token count for a single message
 *
 * 💡 Check the hints folder if you're stuck.
 */

/**
 * Challenge 1: Implement splitForSummary
 * 
 * This function's goal is to split the `messages` array into two parts:
 * 
 * - messagesToSummarize: older messages that need to be summarized
 * - remainingMessages: recent messages to keep as-is
 * 
 * You need to find the "split point" (an index) where the number of
 * tokens in remainingMessages is within the tokenTarget.
 */
export function splitForSummary(messages, tokenTarget) {
  // Your implementation here
  const totalTokens = getTotalTokenCount(messages);
  if (totalTokens <= tokenTarget) {
    return {
      messagesToSummarize: [],
      remainingMessages: messages
    };
  }
  
  let splitIndex = messages.length;
  let remainingTokens = totalTokens;

  for (let i = messages.length - 1; i >= 0; i--) {
    const messageTokens = getMessageTokenCount(messages[i]);
    if (remainingTokens - messageTokens <= tokenTarget) {
      remainingTokens -= messageTokens;
      splitIndex = i;
      break;
    }
    remainingTokens -= messageTokens;
  }
  
  return {
    messagesToSummarize: messages.slice(0, splitIndex),
    remainingMessages: messages.slice(splitIndex)
  };
}

/**
 * Challenge 2: Implement generateSummary
 * 
 * This function takes an array of messages and uses the AI model
 * to create a condensed summary.
 * 
 * Remember, you must add a new message to the array to explicitly
 * ask the AI to create a summary.
 * 
 * Return a final message object containing the summary.
 */
export async function generateSummary(messages, model) {
  // Your implementation here

  const summaryPrompt = `You are an expert at summarizing conversations to preserve important context. Focus on extracting key user information, important decisions, and technical details that might be referenced later. Create a concise, well-organized summary.`;

  const summaryMessage = [ ...messages ]
  
  summaryMessage.push({
    role: "user",
    content: summaryPrompt
  });

  const response = await generateText({
    model: model,
    messages: summaryMessage,
  });

  const summaryContent = response.text;

  return { 
    role: "system", 
    content: `${summaryContent}` 
  };
}