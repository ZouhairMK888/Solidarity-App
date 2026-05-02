const { pool } = require('../config/database');

class DonationModel {
  static async create({ donor_name, donor_email, type, amount, description, campaign_id, status = 'pending' }) {
    const [result] = await pool.query(
      `INSERT INTO donations (donor_name, donor_email, type, amount, description, campaign_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        donor_name || null,
        donor_email || null,
        type,
        amount ?? null,
        description || null,
        campaign_id,
        status,
      ]
    );

    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT d.*, c.title AS campaign_title, c.created_by AS campaign_owner_id,
              u.name AS organizer_name, u.email AS organizer_email
       FROM donations d
       INNER JOIN campaigns c ON c.id = d.campaign_id
       LEFT JOIN users u ON u.id = c.created_by
       WHERE d.id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  static async findManageable({ user, status, type, campaignId, search, limit } = {}) {
    let query = `
      SELECT d.*, c.title AS campaign_title, c.created_by AS campaign_owner_id,
             u.name AS organizer_name, u.email AS organizer_email
      FROM donations d
      INNER JOIN campaigns c ON c.id = d.campaign_id
      LEFT JOIN users u ON u.id = c.created_by
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

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND d.type = ?';
      params.push(type);
    }

    if (campaignId) {
      query += ' AND d.campaign_id = ?';
      params.push(campaignId);
    }

    if (search) {
      query += ' AND (d.donor_name LIKE ? OR d.donor_email LIKE ? OR d.description LIKE ? OR c.title LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY d.donated_at DESC';

    const parsedLimit = Number.parseInt(limit, 10);
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      query += ' LIMIT ?';
      params.push(parsedLimit);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async update(id, { donor_name, donor_email, type, amount, description, status }) {
    await pool.query(
      `UPDATE donations
       SET donor_name = ?, donor_email = ?, type = ?, amount = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        donor_name || null,
        donor_email || null,
        type,
        amount ?? null,
        description || null,
        status,
        id,
      ]
    );

    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE donations SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM donations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getStats({ user } = {}) {
    let query = `
      SELECT
        COUNT(*) AS total_donations,
        SUM(CASE WHEN d.status = 'pending' THEN 1 ELSE 0 END) AS pending_donations,
        SUM(CASE WHEN d.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_donations,
        SUM(CASE WHEN d.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_donations,
        SUM(CASE WHEN d.type = 'financial' THEN 1 ELSE 0 END) AS financial_donations,
        SUM(CASE WHEN d.type = 'material' THEN 1 ELSE 0 END) AS material_donations,
        COALESCE(SUM(CASE WHEN d.type = 'financial' AND d.status IN ('pending', 'confirmed') THEN d.amount ELSE 0 END), 0) AS tracked_financial_amount,
        COALESCE(SUM(CASE WHEN d.type = 'financial' AND d.status = 'confirmed' THEN d.amount ELSE 0 END), 0) AS confirmed_financial_amount
      FROM donations d
      INNER JOIN campaigns c ON c.id = d.campaign_id
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

    const [rows] = await pool.query(query, params);
    return rows[0];
  }
}

module.exports = DonationModel;
