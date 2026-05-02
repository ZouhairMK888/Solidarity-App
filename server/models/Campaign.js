const { pool } = require('../config/database');
const MissionModel = require('./Mission');
const CampaignOrganizerModel = require('./CampaignOrganizer');

class CampaignModel {
  static buildOrganizerSelect() {
    return `
      (SELECT GROUP_CONCAT(CONCAT(u.name, ' <', u.email, '>') ORDER BY CASE co.role WHEN 'owner' THEN 0 ELSE 1 END, co.created_at ASC SEPARATOR ', ')
       FROM campaign_organizers co
       INNER JOIN users u ON u.id = co.user_id
       WHERE co.campaign_id = c.id AND co.status = 'active') as organizer_names,
      (SELECT COUNT(*)
       FROM campaign_organizers co
       WHERE co.campaign_id = c.id AND co.status = 'active') as organizer_count
    `;
  }

  static async findAll({ status, search, page = 1, limit = 12 } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT c.*, u.name as organizer_name, u.email as organizer_email,
        ${this.buildOrganizerSelect()},
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

  static async findById(id, userId = null) {
    const applicationStatusSelect = userId
      ? `(SELECT oa.status FROM organizer_applications oa WHERE oa.campaign_id = c.id AND oa.user_id = ? LIMIT 1) as organizer_application_status`
      : 'NULL as organizer_application_status';
    const isCampaignOrganizerSelect = userId
      ? `(SELECT COUNT(*) FROM campaign_organizers co WHERE co.campaign_id = c.id AND co.user_id = ? AND co.status = 'active') as is_campaign_organizer`
      : '0 as is_campaign_organizer';
    const params = userId ? [userId, userId, id] : [id];

    const [rows] = await pool.query(
      `SELECT c.*, u.name as organizer_name, u.email as organizer_email,
              ${this.buildOrganizerSelect()},
              ${applicationStatusSelect},
              ${isCampaignOrganizerSelect}
       FROM campaigns c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = ?`,
      params
    );
    const campaign = rows[0] || null;

    if (!campaign) {
      return null;
    }

    campaign.organizers = await CampaignOrganizerModel.findByCampaignId(id);
    campaign.is_campaign_organizer = Number(campaign.is_campaign_organizer || 0) > 0;
    return campaign;
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
        start_date || null,
        end_date || null,
        status || 'draft',
        created_by,
      ]
    );
    await CampaignOrganizerModel.upsert({
      campaignId: result.insertId,
      userId: created_by,
      role: 'owner',
    });
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
        ${this.buildOrganizerSelect()},
        (SELECT COUNT(*) FROM missions m WHERE m.campaign_id = c.id) as mission_count
      FROM campaigns c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE 1=1
    `;
    const params = [];

    if (user.role !== 'admin') {
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

  static async canUserManage(campaign, user) {
    if (!campaign || !user) {
      return false;
    }

    if (user.role === 'admin') {
      return true;
    }

    if (Number(campaign.created_by) === Number(user.id)) {
      return true;
    }

    return CampaignOrganizerModel.isActiveOrganizer(campaign.id, user.id);
  }
}

module.exports = CampaignModel;
