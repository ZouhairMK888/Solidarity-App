const { pool } = require('../config/database');

class OrganizerApplicationModel {
  static async findById(id, connection = pool) {
    const [rows] = await connection.query(
      `SELECT oa.id, oa.campaign_id, oa.user_id, oa.motivation, oa.experience,
              oa.status, oa.reviewed_by, oa.reviewed_at, oa.created_at,
              u.name AS volunteer_name, u.email AS volunteer_email, u.phone AS volunteer_phone,
              c.title AS campaign_title, c.status AS campaign_status, c.created_by AS campaign_owner_id
       FROM organizer_applications oa
       INNER JOIN users u ON u.id = oa.user_id
       INNER JOIN campaigns c ON c.id = oa.campaign_id
       WHERE oa.id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  static async findByUserAndCampaign(userId, campaignId) {
    const [rows] = await pool.query(
      `SELECT id, campaign_id, user_id, motivation, experience, status, reviewed_by, reviewed_at, created_at
       FROM organizer_applications
       WHERE user_id = ? AND campaign_id = ?
       LIMIT 1`,
      [userId, campaignId]
    );

    return rows[0] || null;
  }

  static async create({ userId, campaignId, motivation, experience }) {
    const [result] = await pool.query(
      `INSERT INTO organizer_applications (user_id, campaign_id, motivation, experience)
       VALUES (?, ?, ?, ?)`,
      [userId, campaignId, motivation || null, experience || null]
    );

    return this.findById(result.insertId);
  }

  static async findManageable({ user, status } = {}) {
    let query = `
      SELECT oa.id, oa.campaign_id, oa.user_id, oa.motivation, oa.experience,
             oa.status, oa.reviewed_by, oa.reviewed_at, oa.created_at,
             u.name AS volunteer_name, u.email AS volunteer_email, u.phone AS volunteer_phone,
             c.title AS campaign_title, c.status AS campaign_status,
             reviewer.name AS reviewer_name
      FROM organizer_applications oa
      INNER JOIN users u ON u.id = oa.user_id
      INNER JOIN campaigns c ON c.id = oa.campaign_id
      LEFT JOIN users reviewer ON reviewer.id = oa.reviewed_by
      WHERE 1=1
    `;
    const params = [];

    if (user?.role !== 'admin') {
      query += `
        AND (
          c.created_by = ?
          OR EXISTS (
            SELECT 1 FROM campaign_organizers co
            WHERE co.campaign_id = c.id AND co.user_id = ? AND co.status = 'active'
          )
        )
      `;
      params.push(user.id, user.id);
    }

    if (status && status !== 'all') {
      query += ' AND oa.status = ?';
      params.push(status);
    }

    query += ' ORDER BY oa.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async updateStatus(id, status, reviewedBy, connection = pool) {
    await connection.query(
      `UPDATE organizer_applications
       SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, reviewedBy, id]
    );

    return this.findById(id, connection);
  }
}

module.exports = OrganizerApplicationModel;
