const express = require('express');
const router = express.Router();

const {
    createOrGetChat,
    sendMessage,
    getMessages,
    markMessageRead,
    updateLastSeen,
    getUserChatsController
} = require('../controllers/chat.controller');

router.post('/create', createOrGetChat);
router.post('/:chatId/message/send', sendMessage);
router.get('/:chatId/messages',getMessages)
router.post('/:chatId/message/:messageId/read', markMessageRead);
router.post('/:chatId/lastseen', updateLastSeen);
router.get('/user/:userId/chats', getUserChatsController);
module.exports = router;