const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  static async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT u.*,
              (SELECT COUNT(*) FROM campaign_organizers co WHERE co.user_id = u.id AND co.status = 'active') AS campaign_organizer_count
       FROM users u
       WHERE u.email = ?`,
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.profile_image, u.is_active, u.created_at,
              (SELECT COUNT(*) FROM campaign_organizers co WHERE co.user_id = u.id AND co.status = 'active') AS campaign_organizer_count
       FROM users u
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ name, email, password, phone, role = 'volunteer' }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, role]
    );
    return result.insertId;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAll({ role, search } = {}) {
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.profile_image, u.is_active, u.email_verified_at, u.created_at,
             (SELECT COUNT(*) FROM campaign_organizers co WHERE co.user_id = u.id AND co.status = 'active') AS campaign_organizer_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getStats() {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'organizer' THEN 1 ELSE 0 END) as organizers,
        SUM(CASE WHEN role = 'volunteer' THEN 1 ELSE 0 END) as volunteers,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users
      FROM users
    `);

    return rows[0];
  }

  static async createByAdmin({ name, email, password, phone, role }) {
    return this.create({ name, email, password, phone, role });
  }

  static async updateRole(id, role) {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return this.findById(id);
  }

  static async updateStatus(id, isActive) {
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
    return this.findById(id);
  }

  static async update(id, { name, email, phone, role, is_active }) {
    await pool.query(
      `UPDATE users
       SET name = ?, email = ?, phone = ?, role = ?, is_active = ?
       WHERE id = ?`,
      [name, email, phone || null, role, is_active, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = UserModel;
