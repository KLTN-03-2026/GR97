import express from 'express';
import { getChatMessages, sendChatMessage } from '../../controllers/chat.controller';

const router = express.Router();

// Route to get chat messages
router.get('/', getChatMessages);

// Route to send a chat message
router.post('/', sendChatMessage);

export default router;