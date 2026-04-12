const { pool } = require('../config/database');

class MissionModel {
  static buildSelectQuery({ userId = null, whereClause = '', params = [] } = {}) {
    const queryParams = [];
    const applicationStatusSelect = userId !== null && userId !== undefined
      ? `(SELECT va.status FROM volunteer_applications va WHERE va.mission_id = m.id AND va.user_id = ? LIMIT 1) as application_status`
      : 'NULL as application_status';

    if (userId !== null && userId !== undefined) {
      queryParams.push(userId);
    }

    queryParams.push(...params);

    return {
      query: `
      SELECT m.*,
        (SELECT COUNT(*) FROM task_assignments ta WHERE ta.mission_id = m.id AND ta.status != 'cancelled') as assigned_count,
        (SELECT COUNT(*) FROM volunteer_applications va WHERE va.mission_id = m.id AND va.status = 'pending') as pending_applications,
        ${applicationStatusSelect}
      FROM missions m
      ${whereClause}
    `,
      params: queryParams,
    };
  }

  static async findByCampaignId(campaignId, userId = null) {
    const { query, params } = this.buildSelectQuery({
      userId,
      whereClause: 'WHERE m.campaign_id = ? ORDER BY m.mission_date ASC, m.created_at ASC',
      params: [campaignId],
    });
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id, userId = null) {
    const { query, params } = this.buildSelectQuery({
      userId,
      whereClause: 'WHERE m.id = ? LIMIT 1',
      params: [id],
    });
    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  }

  static async create(campaignId, { title, description, required_volunteers, location, mission_date, status }) {
    const [result] = await pool.query(
      `INSERT INTO missions (campaign_id, title, description, required_volunteers, location, mission_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        campaignId,
        title,
        description || null,
        required_volunteers,
        location || null,
        mission_date || null,
        status || 'open',
      ]
    );

    return result.insertId;
  }

  static async update(id, { title, description, required_volunteers, location, mission_date, status }) {
    await pool.query(
      `UPDATE missions
       SET title = ?, description = ?, required_volunteers = ?, location = ?, mission_date = ?, status = ?
       WHERE id = ?`,
      [
        title,
        description || null,
        required_volunteers,
        location || null,
        mission_date || null,
        status || 'open',
        id,
      ]
    );

    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE missions SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM missions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = MissionModel;
