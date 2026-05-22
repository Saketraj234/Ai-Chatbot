const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Helper function to create message element without appending
function createMessageElement(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageDiv.innerText = text;
    return messageDiv;
}

// Function to add a single message to the chat box
function addMessage(text, sender) {
    const messageDiv = createMessageElement(text, sender);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv;
}

// Typing animation for bot
async function typeWriter(text, element) {
    element.innerHTML = '';
    let currentText = '';
    for (let i = 0; i < text.length; i++) {
        currentText += text[i];
        element.innerText = currentText;
        chatBox.scrollTop = chatBox.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, 20)); // Faster character-by-character typing
    }
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatBox.appendChild(indicator);
    chatBox.scrollTop = chatBox.scrollHeight;
    return indicator;
}

// Function to fetch chat history
async function loadHistory() {
    const loader = document.getElementById('initial-loader');
    try {
        const response = await fetch('/api/history');
        const history = await response.json();
        
        if (loader) loader.remove(); // Remove loader after data is fetched

        if (history.length === 0) {
            addMessage("Namaste! Main aapka AI assistant hoon. Main aapki kaise madad kar sakta hoon?", 'bot');
        } else {
            // Document fragment for better performance
            const fragment = document.createDocumentFragment();
            history.forEach(chat => {
                const userMsg = createMessageElement(chat.userMessage, 'user');
                const botMsg = createMessageElement(chat.botResponse, 'bot');
                fragment.appendChild(userMsg);
                fragment.appendChild(botMsg);
            });
            chatBox.appendChild(fragment);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    } catch (error) {
        if (loader) loader.innerHTML = '<p style="color: #ef4444;">Server error. Please try again.</p>';
        console.error('Error loading history:', error);
    }
}

// Function to send message
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to UI
    addMessage(message, 'user');
    userInput.value = '';

    // Show typing indicator
    const indicator = showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        // Remove indicator
        indicator.remove();

        if (data.response) {
            const botMsgDiv = addMessage('', 'bot');
            await typeWriter(data.response, botMsgDiv);
        } else {
            addMessage('Maaf kijiye, kuch error aaya.', 'bot');
        }
    } catch (error) {
        indicator.remove();
        console.error('Error sending message:', error);
        addMessage('Error: Server connect nahi ho pa raha.', 'bot');
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Load history on page load
loadHistory();
