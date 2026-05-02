const { pool } = require('../config/database');

class MissionTaskModel {
  static baseSelect() {
    return `
      SELECT
        mt.*,
        (
          SELECT COUNT(*)
          FROM task_assignments ta
          WHERE ta.task_id = mt.id
            AND ta.status != 'cancelled'
        ) AS assigned_count
      FROM mission_tasks mt
    `;
  }

  static async findByMissionId(missionId, connection = pool) {
    const [rows] = await connection.query(
      `${this.baseSelect()}
       WHERE mt.mission_id = ?
       ORDER BY mt.sort_order ASC, mt.created_at ASC`,
      [missionId]
    );

    return rows;
  }

  static async findByMissionIds(missionIds, { excludeCancelled = false } = {}, connection = pool) {
    if (!Array.isArray(missionIds) || missionIds.length === 0) {
      return [];
    }

    const placeholders = missionIds.map(() => '?').join(', ');
    const params = [...missionIds];
    let query = `
      ${this.baseSelect()}
      WHERE mt.mission_id IN (${placeholders})
    `;

    if (excludeCancelled) {
      query += ` AND mt.status != 'cancelled'`;
    }

    query += ' ORDER BY mt.mission_id ASC, mt.sort_order ASC, mt.created_at ASC';

    const [rows] = await connection.query(query, params);
    return rows;
  }

  static async findById(id, connection = pool) {
    const [rows] = await connection.query(
      `${this.baseSelect()}
       WHERE mt.id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  static async getNextSortOrder(missionId, connection = pool) {
    const [rows] = await connection.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order FROM mission_tasks WHERE mission_id = ?',
      [missionId]
    );

    return rows[0]?.next_sort_order || 1;
  }

  static async create(missionId, { title, description, required_volunteers, status }, connection = pool) {
    const sortOrder = await this.getNextSortOrder(missionId, connection);
    const [result] = await connection.query(
      `INSERT INTO mission_tasks (mission_id, title, description, required_volunteers, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        missionId,
        title,
        description || null,
        required_volunteers,
        status || 'todo',
        sortOrder,
      ]
    );

    return this.findById(result.insertId, connection);
  }

  static async update(id, { title, description, required_volunteers, status }, connection = pool) {
    await connection.query(
      `UPDATE mission_tasks
       SET title = ?, description = ?, required_volunteers = ?, status = ?
       WHERE id = ?`,
      [
        title,
        description || null,
        required_volunteers,
        status || 'todo',
        id,
      ]
    );

    return this.findById(id, connection);
  }

  static async delete(id, connection = pool) {
    const [result] = await connection.query('DELETE FROM mission_tasks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = MissionTaskModel;
