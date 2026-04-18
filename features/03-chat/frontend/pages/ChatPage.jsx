import React, { useEffect, useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import { fetchChatMessages, sendMessage } from '../../lib/api';

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const loadMessages = async () => {
            const chatMessages = await fetchChatMessages();
            setMessages(chatMessages);
        };

        loadMessages();
    }, []);

    const handleSendMessage = async () => {
        if (newMessage.trim()) {
            const message = await sendMessage(newMessage);
            setMessages([...messages, message]);
            setNewMessage('');
        }
    };

    return (
        <div className="chat-page">
            <h1>Chat</h1>
            <ChatWindow messages={messages} />
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
            />
            <button onClick={handleSendMessage}>Send</button>
        </div>
    );
};

export default ChatPage;