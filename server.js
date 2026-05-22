require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Groq = require('groq-sdk');
const Chat = require('./models/Chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Groq SDK Configuration
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log('MongoDB connection error:', err));

// AI Chatbot Route
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Groq AI API Call
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful AI assistant. Always respond in the same language that the user uses. If the user speaks in Hindi, respond in Hindi. If the user speaks in English, respond in English. Be concise and natural.',
                },
                {
                    role: 'user',
                    content: message,
                },
            ],
            model: 'llama-3.3-70b-versatile',
        });

        const botResponse = chatCompletion.choices[0]?.message?.content || "Maaf kijiye, main abhi response nahi de paa raha hoon.";

        // Save to MongoDB
        const newChat = new Chat({
            userMessage: message,
            botResponse: botResponse
        });
        await newChat.save();

        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error in Groq API:', error);
        res.status(500).json({ error: 'AI server se response lene mein dikkat ho rahi hai.' });
    }
});

// Get Chat History
app.get('/api/history', async (req, res) => {
    try {
        const history = await Chat.find().sort({ timestamp: 1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching history' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
