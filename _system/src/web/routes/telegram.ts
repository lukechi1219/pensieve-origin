import express from 'express';
import { TelegramService } from '../../core/services/TelegramService';

const router = express.Router();

router.get('/unread', async (req, res) => {
  try {
    const unreadMessages = await TelegramService.getUnreadMessages();
    res.json(unreadMessages);
  } catch (error) {
    console.error('Error fetching unread Telegram messages:', error);
    res.status(500).json({ error: 'Failed to fetch unread Telegram messages' });
  }
});

export default router;
