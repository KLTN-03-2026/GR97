import React, { useEffect, useState } from 'react';
import { fetchChatMessages, sendMessage } from '../../lib/api';

const ChatWindow = ({ userId }) => {
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
            const message = {
                userId,
                content: newMessage,
                timestamp: new Date(),
            };
            await sendMessage(message);
            setMessages([...messages, message]);
            setNewMessage('');
        }
    };

    return (
        <div className="chat-window">
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.userId === userId ? 'sent' : 'received'}`}>
                        <span>{msg.content}</span>
                    </div>
                ))}
            </div>
            <div className="input-area">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatWindow;