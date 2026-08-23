import { marked } from "marked";
import DOMPurify from "dompurify";

export function verifyEnv() {
  if (!process.env.OPENROUTER_KEY) {
    console.error('❌ OPENROUTER_KEY env variable is not set');
  } 
  if (!process.env.MODEL_ID) {
    console.error('❌ MODEL_ID env variable is not set');
  }
  if (process.env.OPENROUTER_KEY && process.env.MODEL_ID) {
    console.log('✅ OPENROUTER_KEY and MODEL_ID env variables are set');
  }
}


export class ChatView {
  constructor(chatContainer, messagesContainer) {
    this.chatContainer = chatContainer;
    this.messagesContainer = messagesContainer;
    this.messageCount = 0;
    this.maxMessages = 20;
  }

  addMessage(message) {
    const messageElement = this.createMessageElement(message);
    this.messagesContainer.appendChild(messageElement);
    this.messageCount++;
    
    this.trimOldMessages();
        this.scrollToBottom();
    
    return messageElement;
  }

  updateLatestMessage(content) {
    const lastMessage = this.messagesContainer.lastElementChild;
    if (lastMessage) {
      const contentDiv = lastMessage.querySelector('.message-content');
      if (contentDiv) {
        contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(content));
      } else {
        // Fallback if no content div exists
        lastMessage.innerHTML = DOMPurify.sanitize(marked.parse(content));
      }
    }
  }

  createMessageElement(message) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${message.role}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    if (message.role === "assistant" && !message.content) {
      // Loading state
      contentDiv.innerHTML = `
        <div class="loading-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      `;
    } else {
      contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(message.content || ''));
    }

    messageElement.appendChild(contentDiv);
    return messageElement;
  }

  trimOldMessages() {
    while (this.messagesContainer.children.length > this.maxMessages) {
      this.messagesContainer.removeChild(this.messagesContainer.firstChild);
      this.messageCount--;
    }
  }

  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }
}