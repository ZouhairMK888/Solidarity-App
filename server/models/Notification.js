const { pool } = require('../config/database');

class NotificationModel {
  static async createForActiveUserIds({ title, message, type, userIds }) {
    const idList = Array.isArray(userIds)
      ? [...new Set(userIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0))]
      : [];

    if (!idList.length) {
      return 0;
    }

    const placeholders = idList.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       SELECT id, ?, ?, ?
       FROM users
       WHERE id IN (${placeholders}) AND is_active = 1`,
      [title, message, type || null, ...idList]
    );

    return result.affectedRows;
  }

  static async createForActiveUsersByRoles({ title, message, type, roles }) {
    const roleList = Array.isArray(roles)
      ? roles.filter((role) => typeof role === 'string' && role.trim())
      : [];

    if (!roleList.length) {
      return 0;
    }

    const placeholders = roleList.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       SELECT id, ?, ?, ?
       FROM users
       WHERE role IN (${placeholders}) AND is_active = 1`,
      [title, message, type || null, ...roleList]
    );

    return result.affectedRows;
  }

  static async createForActiveVolunteers({ title, message, type }) {
    return this.createForActiveUsersByRoles({
      title,
      message,
      type,
      roles: ['volunteer'],
    });
  }

  static async createForActiveAdmins({ title, message, type }) {
    return this.createForActiveUsersByRoles({
      title,
      message,
      type,
      roles: ['admin'],
    });
  }

  static async findByUserId(userId, { limit = 10 } = {}) {
    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

    const [rows] = await pool.query(
      `SELECT id, user_id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, safeLimit]
    );

    return rows;
  }

  static async countUnreadByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return rows[0]?.unread_count || 0;
  }

  static async findByIdForUser(id, userId) {
    const [rows] = await pool.query(
      `SELECT id, user_id, title, message, type, is_read, created_at
       FROM notifications
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId]
    );

    return rows[0] || null;
  }

  static async markAsRead(id, userId) {
    await pool.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    return this.findByIdForUser(id, userId);
  }

  static async markAllAsRead(userId) {
    const [result] = await pool.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return result.affectedRows;
  }
}

module.exports = NotificationModel;
