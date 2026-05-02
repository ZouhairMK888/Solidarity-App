const { pool } = require('../config/database');

class CampaignOrganizerModel {
  static async findByCampaignId(campaignId) {
    const [rows] = await pool.query(
      `SELECT co.id, co.campaign_id, co.user_id, co.role, co.status, co.created_at,
              u.name, u.email, u.phone
       FROM campaign_organizers co
       INNER JOIN users u ON u.id = co.user_id
       WHERE co.campaign_id = ? AND co.status = 'active'
       ORDER BY CASE co.role WHEN 'owner' THEN 0 ELSE 1 END, co.created_at ASC`,
      [campaignId]
    );

    return rows;
  }

  static async isActiveOrganizer(campaignId, userId, connection = pool) {
    if (!campaignId || !userId) return false;

    const [rows] = await connection.query(
      `SELECT id
       FROM campaign_organizers
       WHERE campaign_id = ? AND user_id = ? AND status = 'active'
       LIMIT 1`,
      [campaignId, userId]
    );

    return rows.length > 0;
  }

  static async countActiveForUser(userId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS organizer_count
       FROM campaign_organizers
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    return rows[0]?.organizer_count || 0;
  }

  static async upsert({ campaignId, userId, role = 'organizer' }, connection = pool) {
    await connection.query(
      `INSERT INTO campaign_organizers (campaign_id, user_id, role, status)
       VALUES (?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE role = VALUES(role), status = 'active'`,
      [campaignId, userId, role]
    );

    const [rows] = await connection.query(
      `SELECT co.id, co.campaign_id, co.user_id, co.role, co.status, co.created_at,
              u.name, u.email
       FROM campaign_organizers co
       INNER JOIN users u ON u.id = co.user_id
       WHERE co.campaign_id = ? AND co.user_id = ?
       LIMIT 1`,
      [campaignId, userId]
    );

    return rows[0] || null;
  }
}

module.exports = CampaignOrganizerModel;
