// DOM elements
const submitButton = document.getElementById('submit');
const inputElement = document.querySelector('.input-container input');
const outputElement = document.getElementById('output');
const newChatButton = document.querySelector('.side-bar button');
const historyElement = document.querySelector('.history');

// Store chat history
let chatHistory = [];
let currentChat = [];
let currentChatIndex = -1;

// Google AI Studio API Configuration
// IMPORTANT: Replace with your actual API key
const AI_API_KEY = "api-key-here"; 
const AI_API_URL = "url";

// Function to get AI response from Google AI Studio API
async function getAIResponse(userMessage) {
  try {
    // Convert chat history to Google AI Studio format
    const messages = currentChat.map(msg => {
      return {
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      };
    });
    
    // Add the latest user message if not already in history
    if (!messages.some(msg => msg.role === "user" && msg.parts[0].text === userMessage)) {
      messages.push({
        role: "user",
        parts: [{ text: userMessage }]
      });
    }

    // Make API request
    const response = await fetch(`${AI_API_URL}?key=${AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error.message || response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error calling the Google AI Studio API:", error);
    return "Sorry, I couldn't process your request. Please try again later.";
  }
}

// Function to add message to chat
function addMessage(message, isUser = false) {
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.classList.add(isUser ? 'user-message' : 'ai-message');
  
  // Style based on who sent it
  messageElement.style.textAlign = isUser ? 'right' : 'left';
  messageElement.style.margin = '10px 0';
  messageElement.style.padding = '10px';
  messageElement.style.borderRadius = '10px';
  messageElement.style.maxWidth = '80%';
  messageElement.style.alignSelf = isUser ? 'flex-end' : 'flex-start';
  messageElement.style.backgroundColor = isUser ? '#19c37d' : '#444654';
  
  // Add content
  messageElement.innerText = message;
  
  // Style the output container if it's the first message
  if (outputElement.children.length === 0) {
    outputElement.style.display = 'flex';
    outputElement.style.flexDirection = 'column';
  }
  
  // Add to UI
  outputElement.appendChild(messageElement);
  
  // Save to current chat history
  currentChat.push({
    role: isUser ? 'user' : 'assistant',
    content: message
  });
  
  // Scroll to bottom
  outputElement.scrollTop = outputElement.scrollHeight;
}

// Function to handle sending a message
async function handleSubmit() {
  const userInput = inputElement.value.trim();
  
  if (userInput) {
    // Add user message
    addMessage(userInput, true);
    
    // Clear input
    inputElement.value = '';
    
    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');
    loadingElement.innerText = "Thinking...";
    loadingElement.style.color = "#8e8ea0";
    loadingElement.style.padding = "10px";
    loadingElement.style.fontStyle = "italic";
    outputElement.appendChild(loadingElement);
    
    // Get AI response from API
    try {
      const aiResponse = await getAIResponse(userInput);
      
      // Remove loading indicator
      outputElement.removeChild(loadingElement);
      
      // Add AI message
      addMessage(aiResponse, false);
      
      // If this was an existing chat, update it
      if (currentChatIndex >= 0) {
        chatHistory[currentChatIndex].messages = [...currentChat];
        saveChatsToLocalStorage();
      }
    } catch (error) {
      // Remove loading indicator
      outputElement.removeChild(loadingElement);
      
      // Show error
      const errorElement = document.createElement('div');
      errorElement.classList.add('error');
      errorElement.innerText = "Sorry, something went wrong. Please try again.";
      errorElement.style.color = "#ff4a4a";
      errorElement.style.padding = "10px";
      outputElement.appendChild(errorElement);
      
      console.error("Error:", error);
    }
  }
}

// Function to start a new chat
function startNewChat() {
  // Save current chat if it has content
  if (currentChat.length > 0 && currentChatIndex === -1) {
    const chatTitle = currentChat[0].content.substring(0, 20) + '...';
    chatHistory.push({
      title: chatTitle,
      messages: [...currentChat]
    });
    
    // Add to history sidebar
    addChatToHistory(chatTitle, chatHistory.length - 1);
    saveChatsToLocalStorage();
  }
  
  // Reset current chat index
  currentChatIndex = -1;
  
  // Clear current chat
  currentChat = [];
  outputElement.innerHTML = '';
  
  // Reset greeting
  outputElement.innerHTML = '<div class="greeting">How can I help you today?</div>';
}

// Function to add chat to history sidebar
function addChatToHistory(title, index) {
  const historyItem = document.createElement('div');
  historyItem.classList.add('history-item');
  historyItem.dataset.index = index;
  
  // Create container for title and delete button
  const itemContainer = document.createElement('div');
  itemContainer.style.display = 'flex';
  itemContainer.style.justifyContent = 'space-between';
  itemContainer.style.alignItems = 'center';
  itemContainer.style.width = '100%';
  
  // Add title text
  const titleSpan = document.createElement('span');
  titleSpan.innerText = title;
  titleSpan.style.overflow = 'hidden';
  titleSpan.style.textOverflow = 'ellipsis';
  titleSpan.style.whiteSpace = 'nowrap';
  titleSpan.style.flexGrow = '1';
  
  // Add delete button
  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = '&times;'; // × symbol
  deleteButton.style.background = 'transparent';
  deleteButton.style.border = 'none';
  deleteButton.style.color = '#999';
  deleteButton.style.fontSize = '16px';
  deleteButton.style.cursor = 'pointer';
  deleteButton.style.padding = '0 5px';
  deleteButton.style.marginLeft = '5px';
  deleteButton.style.display = 'none'; // Hidden by default
  deleteButton.title = 'Delete chat';
  
  // Add hover effects
  deleteButton.addEventListener('mouseover', () => {
    deleteButton.style.color = '#ff4a4a';
  });
  
  deleteButton.addEventListener('mouseout', () => {
    deleteButton.style.color = '#999';
  });
  
  // Add click handler for delete
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent triggering the chat load
    deleteChat(index);
  });
  
  // Append elements
  itemContainer.appendChild(titleSpan);
  itemContainer.appendChild(deleteButton);
  historyItem.appendChild(itemContainer);
  
  // Style the history item
  historyItem.style.padding = '10px';
  historyItem.style.margin = '5px 0';
  historyItem.style.borderRadius = '5px';
  historyItem.style.cursor = 'pointer';
  
  // Show delete button on hover
  historyItem.addEventListener('mouseover', () => {
    historyItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    deleteButton.style.display = 'block';
  });
  
  historyItem.addEventListener('mouseout', () => {
    historyItem.style.backgroundColor = 'transparent';
    deleteButton.style.display = 'none';
  });
  
  // Load chat on click
  historyItem.addEventListener('click', () => {
    loadChat(index);
  });
  
  historyElement.appendChild(historyItem);
}

// Function to delete a chat
function deleteChat(index) {
  // Remove chat from history array
  chatHistory.splice(index, 1);
  
  // If we're currently viewing the deleted chat, start a new one
  if (currentChatIndex === index) {
    startNewChat();
  } else if (currentChatIndex > index) {
    // Adjust current chat index if needed
    currentChatIndex--;
  }
  
  // Update localStorage
  saveChatsToLocalStorage();
  
  // Refresh the history sidebar
  refreshHistorySidebar();
}

// Function to refresh the history sidebar
function refreshHistorySidebar() {
  // Clear existing history
  historyElement.innerHTML = '';
  
  // Re-add all chats
  chatHistory.forEach((chat, index) => {
    addChatToHistory(chat.title, index);
  });
}

// Function to load a chat from history
function loadChat(index) {
  const chat = chatHistory[index];
  currentChat = [...chat.messages];
  currentChatIndex = index;
  
  // Clear and repopulate the output
  outputElement.innerHTML = '';
  
  chat.messages.forEach(message => {
    addMessage(message.content, message.role === 'user');
  });
}

// Function to save chats to local storage
function saveChatsToLocalStorage() {
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  localStorage.setItem('currentChat', JSON.stringify(currentChat));
  localStorage.setItem('currentChatIndex', currentChatIndex.toString());
}

// Function to load chats from local storage
function loadChatsFromLocalStorage() {
  const savedHistory = localStorage.getItem('chatHistory');
  const savedCurrentChat = localStorage.getItem('currentChat');
  const savedCurrentChatIndex = localStorage.getItem('currentChatIndex');
  
  if (savedHistory) {
    chatHistory = JSON.parse(savedHistory);
    
    // Add chats to history sidebar
    chatHistory.forEach((chat, index) => {
      addChatToHistory(chat.title, index);
    });
  }
  
  if (savedCurrentChat) {
    currentChat = JSON.parse(savedCurrentChat);
  }
  
  if (savedCurrentChatIndex) {
    currentChatIndex = parseInt(savedCurrentChatIndex, 10);
  }
  
  // Display current chat
  if (currentChat.length > 0) {
    outputElement.innerHTML = '';
    currentChat.forEach(message => {
      addMessage(message.content, message.role === 'user');
    });
  }
}

// Event listeners
submitButton.addEventListener('click', handleSubmit);

inputElement.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSubmit();
  }
});

newChatButton.addEventListener('click', startNewChat);

// Save chats when page is unloaded
window.addEventListener('beforeunload', saveChatsToLocalStorage);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Try to load saved chats
  loadChatsFromLocalStorage();
  
  // If no chats were loaded, show greeting
  if (outputElement.children.length === 0) {
    outputElement.innerHTML = '<div class="greeting" style="text-align: center; margin-top: 40px; color: #ececf1;">How can I help you today?</div>';
  }
});