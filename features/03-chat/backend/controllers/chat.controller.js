import ChatMessage from '../models/ChatMessage.js';

export const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content } = req.body;
        const newMessage = new ChatMessage({ senderId, receiverId, content });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await ChatMessage.find({ chatId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error });
    }
};