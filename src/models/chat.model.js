
const pool = require('../config/db');

async function findExistingChat(userAId, userBId) {
    const [rows] = await pool.query(
        `SELECT c.id
         FROM chats c
         INNER JOIN chat_members cm1
            ON c.id = cm1.chat_id
         INNER JOIN chat_members cm2
            ON c.id = cm2.chat_id
         WHERE cm1.user_id = ?
           AND cm2.user_id = ?
         LIMIT 1`,
        [userAId, userBId]
    );

    return rows.length > 0 ? rows[0].id : null;
}

async function createChat(userAId, userBId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO chats () VALUES ()'
        );

        const chatId = result.insertId;

        await connection.query(
            `INSERT INTO chat_members (chat_id, user_id)
             VALUES (?, ?), (?, ?)`,
            [chatId, userAId, chatId, userBId]
        );

        await connection.commit();

        return chatId;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

async function getUserChats(userId) {
    const [rows] = await pool.query(
        `SELECT
            c.id AS chatId,
            c.created_at AS createdAt,
            cm.user_id AS userId
         FROM chats c
         INNER JOIN chat_members cm
            ON c.id = cm.chat_id
         WHERE cm.user_id = ?
         ORDER BY c.created_at DESC`,
        [userId]
    );

    return rows;
}

module.exports = {
    findExistingChat,
    createChat,
    getUserChats
};
