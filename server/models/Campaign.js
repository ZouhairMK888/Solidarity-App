const { pool } = require('../config/database');
const MissionModel = require('./Mission');

class CampaignModel {
  static async findAll({ status, search, page = 1, limit = 12 } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT c.*, u.name as organizer_name, u.email as organizer_email,
        (SELECT COUNT(*) FROM missions m WHERE m.campaign_id = c.id) as mission_count
      FROM campaigns c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.location LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);

    // Count total
    let countQuery = 'SELECT COUNT(*) as total FROM campaigns c WHERE 1=1';
    const countParams = [];
    if (status) { countQuery += ' AND c.status = ?'; countParams.push(status); }
    if (search) {
      countQuery += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.location LIKE ?)';
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    const [countResult] = await pool.query(countQuery, countParams);

    return {
      campaigns: rows,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT c.*, u.name as organizer_name, u.email as organizer_email
       FROM campaigns c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async getMissions(campaignId, userId = null) {
    return MissionModel.findByCampaignId(campaignId, userId);
  }

  static async create({ title, description, image_url, location, latitude, longitude, start_date, end_date, status, created_by }) {
    const [result] = await pool.query(
      `INSERT INTO campaigns (title, description, image_url, location, latitude, longitude, start_date, end_date, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        image_url || null,
        location,
        latitude || null,
        longitude || null,
        start_date,
        end_date,
        status || 'draft',
        created_by,
      ]
    );
    return result.insertId;
  }

  static async getStats() {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) as total_campaigns,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_campaigns,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_campaigns,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_campaigns
      FROM campaigns
    `);

    return rows[0];
  }

  static async findManageable({ user }) {
    let query = `
      SELECT c.*, u.name as organizer_name, u.email as organizer_email,
        (SELECT COUNT(*) FROM missions m WHERE m.campaign_id = c.id) as mission_count
      FROM campaigns c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE 1=1
    `;
    const params = [];

    if (user.role === 'organizer') {
      query += ' AND c.created_by = ?';
      params.push(user.id);
    }

    query += ' ORDER BY c.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE campaigns SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  static async update(id, { title, description, image_url, location, latitude, longitude, start_date, end_date, status }) {
    await pool.query(
      `UPDATE campaigns
       SET title = ?, description = ?, image_url = ?, location = ?, latitude = ?, longitude = ?, start_date = ?, end_date = ?, status = ?
       WHERE id = ?`,
      [
        title,
        description,
        image_url || null,
        location || null,
        latitude || null,
        longitude || null,
        start_date || null,
        end_date || null,
        status || 'draft',
        id,
      ]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM campaigns WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = CampaignModel;
