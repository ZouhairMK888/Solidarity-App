const { pool } = require('../config/database');

class VolunteerApplicationModel {
  static async findById(id, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, user_id, mission_id, status, motivation, applied_at
       FROM volunteer_applications
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  static async findByUserAndMission(userId, missionId) {
    const [rows] = await pool.query(
      `SELECT id, user_id, mission_id, status, motivation, applied_at
       FROM volunteer_applications
       WHERE user_id = ? AND mission_id = ?
       LIMIT 1`,
      [userId, missionId]
    );

    return rows[0] || null;
  }

  static async create({ userId, missionId, motivation }) {
    const [result] = await pool.query(
      `INSERT INTO volunteer_applications (user_id, mission_id, motivation)
       VALUES (?, ?, ?)`,
      [userId, missionId, motivation || null]
    );

    const [rows] = await pool.query(
      `SELECT id, user_id, mission_id, status, motivation, applied_at
       FROM volunteer_applications
       WHERE id = ?`,
      [result.insertId]
    );

    return rows[0] || null;
  }

  static async findAllForAdmin({ status } = {}) {
    let query = `
      SELECT
        va.id,
        va.user_id,
        va.mission_id,
        va.status,
        va.motivation,
        va.applied_at,
        u.name as volunteer_name,
        u.email as volunteer_email,
        u.phone as volunteer_phone,
        m.title as mission_title,
        m.status as mission_status,
        m.required_volunteers,
        c.id as campaign_id,
        c.title as campaign_title,
        c.status as campaign_status
      FROM volunteer_applications va
      INNER JOIN users u ON u.id = va.user_id
      INNER JOIN missions m ON m.id = va.mission_id
      INNER JOIN campaigns c ON c.id = m.campaign_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND va.status = ?';
      params.push(status);
    }

    query += ' ORDER BY va.applied_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getStats() {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_applications,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_applications,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_applications,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_applications
      FROM volunteer_applications
    `);

    return rows[0];
  }

  static async updateStatus(id, status, connection = pool) {
    await connection.query(
      'UPDATE volunteer_applications SET status = ? WHERE id = ?',
      [status, id]
    );

    return this.findById(id, connection);
  }
}

module.exports = VolunteerApplicationModel;
