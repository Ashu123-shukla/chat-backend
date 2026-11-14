const {
    findExistingChat,
    createChat,
    getUserChats
} = require('../models/chat.model');


const db = require('../config/firebase');
const pool = require('../config/db');
const { FieldValue } = require('firebase-admin/firestore');

async function sendMessage(req, res) {
    try {
        const { chatId } = req.params;
        const { senderId, text } = req.body;

        if (!senderId || !text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Sender ID and message text are required'
            });
        }

const [members] = await pool.query(
            `SELECT user_id
             FROM chat_members
             WHERE chat_id = ? AND user_id = ?`,
            [chatId, senderId]
        );

    if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Chat not found or sender is not a member'
            });
        }

        const messageRef = await db
            .collection('chats')
            .doc(String(chatId))
            .collection('messages')
            .add({
                senderId: Number(senderId),
                text: text.trim(),
                timestamp: FieldValue.serverTimestamp()
            });

        const savedMessage = await messageRef.get();
        const messageData = savedMessage.data();

        return res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: {
                messageId: messageRef.id,
                chatId: Number(chatId),
                senderId: messageData.senderId,
                text: messageData.text,
                timestamp: messageData.timestamp.toDate().toISOString()
            }
        });

    } catch (error) {
        console.error('Send message error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
}


async function getMessages(req, res) {
    try {
        const { chatId } = req.params;

        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 50, 1),
            100
        );

        // Check whether chat exists in MySQL
        const [chats] = await pool.query(
            'SELECT id FROM chats WHERE id = ?',
            [chatId]
        );

        if (chats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Fetch messages from Firestore
        const snapshot = await db
            .collection('chats')
            .doc(String(chatId))
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const messages = snapshot.docs.map(doc => ({
            messageId: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp
                ? doc.data().timestamp.toDate().toISOString()
                : null
        }));

        // Return messages in chronological order
        messages.reverse();

        return res.status(200).json({
            success: true,
            chatId: Number(chatId),
            count: messages.length,
            messages
        });

    } catch (error) {
        console.error('Get messages error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve messages'
        });
    }
}


async function createOrGetChat(req, res) {
    try {
        const { userAId, userBId } = req.body;

        if (!userAId || !userBId || userAId === userBId) {
            return res.status(400).json({
                success: false,
                message: 'Valid two different user IDs are required'
            });
        }

        const existingChatId = await findExistingChat(
            userAId,
            userBId
        );

        if (existingChatId) {
            return res.status(200).json({
                success: true,
                message: 'Existing chat found',
                chatId: existingChatId
            });
        }

        const chatId = await createChat(userAId, userBId);

        return res.status(201).json({
            success: true,
            message: 'Chat created successfully',
            chatId
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Failed to create chat'
        });
    }
}
async function markMessageRead(req, res) {
    try {
        const { chatId, messageId } = req.params;
        const { userId } = req.body;

        // 1. Validate userId
        if (!userId || isNaN(Number(userId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid userId is required'
            });
        }

        // 2. Check whether the user belongs to this chat
        const [members] = await pool.query(
            `SELECT user_id
             FROM chat_members
             WHERE chat_id = ? AND user_id = ?`,
            [chatId, userId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'User is not a member of this chat'
            });
        }

        // 3. Check whether the message exists in Firestore
        const messageRef = db
            .collection('chats')
            .doc(String(chatId))
            .collection('messages')
            .doc(messageId);

        const messageSnapshot = await messageRef.get();

        if (!messageSnapshot.exists) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // 4. Create a read receipt if one doesn't already exist
        const receiptRef = messageRef
            .collection('readReceipts')
            .doc(String(userId));

        const receiptSnapshot = await receiptRef.get();

        if (!receiptSnapshot.exists) {
            await receiptRef.set({
                userId: Number(userId),
                readAt: FieldValue.serverTimestamp()
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Message marked as read',
            data: {
                chatId: Number(chatId),
                messageId,
                userId: Number(userId)
            }
        });

    } catch (error) {
        console.error('Mark message read error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to mark message as read'
        });
    }
}
async function updateLastSeen(req, res) {
    try {
        const { chatId } = req.params;
        const { userId } = req.body;

        // Validate userId
        if (!userId || isNaN(Number(userId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid userId is required'
            });
        }

        // Check chat membership
        const [members] = await pool.query(
            `SELECT user_id
             FROM chat_members
             WHERE chat_id = ? AND user_id = ?`,
            [chatId, userId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'User is not a member of this chat'
            });
        }

        // Update last seen in Firestore
        const lastSeenRef = db
            .collection('chats')
            .doc(String(chatId))
            .collection('lastSeen')
            .doc(String(userId));

        await lastSeenRef.set({
            userId: Number(userId),
            lastSeenAt: FieldValue.serverTimestamp()
        });

        return res.status(200).json({
            success: true,
            message: 'Last seen updated successfully',
            data: {
                chatId: Number(chatId),
                userId: Number(userId)
            }
        });

    } catch (error) {
        console.error('Update last seen error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update last seen'
        });
    }
}
async function getUserChatsController(req, res) {
    try {
        const { userId } = req.params;

        if (!userId || isNaN(Number(userId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid userId is required'
            });
        }

        const chats = await getUserChats(Number(userId));

        return res.status(200).json({
            success: true,
            count: chats.length,
            chats
        });

    } catch (error) {
        console.error('Get user chats error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user chats'
        });
    }
}
module.exports = { createOrGetChat,sendMessage, getMessages, markMessageRead, updateLastSeen, getUserChatsController};