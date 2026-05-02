const { pool } = require('../config/database');

class TaskAssignmentModel {
  static baseSelect() {
    return `
      SELECT
        ta.id,
        ta.user_id,
        ta.mission_id,
        ta.task_id,
        ta.assigned_by,
        ta.role_in_task,
        ta.status,
        ta.assigned_at,
        ta.updated_at,
        ta.completed_at,
        u.name AS volunteer_name,
        u.email AS volunteer_email,
        u.phone AS volunteer_phone,
        mt.title AS task_title
      FROM task_assignments ta
      INNER JOIN users u ON u.id = ta.user_id
      LEFT JOIN mission_tasks mt ON mt.id = ta.task_id
    `;
  }

  static async findById(id, connection = pool) {
    const [rows] = await connection.query(
      `${this.baseSelect()}
       WHERE ta.id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  static async findByUserAndMission(userId, missionId, connection = pool) {
    const [rows] = await connection.query(
      `${this.baseSelect()}
       WHERE ta.user_id = ? AND ta.mission_id = ?
       LIMIT 1`,
      [userId, missionId]
    );

    return rows[0] || null;
  }

  static async findByMissionId(missionId, connection = pool) {
    const [rows] = await connection.query(
      `${this.baseSelect()}
       WHERE ta.mission_id = ?
       ORDER BY ta.assigned_at ASC, volunteer_name ASC`,
      [missionId]
    );

    return rows;
  }

  static async create({ userId, missionId, taskId = null, assignedBy, roleInTask = null, status = 'assigned' }, connection = pool) {
    const [result] = await connection.query(
      `INSERT INTO task_assignments (user_id, mission_id, task_id, assigned_by, role_in_task, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, missionId, taskId, assignedBy || null, roleInTask, status]
    );

    return this.findById(result.insertId, connection);
  }

  static async updatePlacement(id, { taskId = null, assignedBy = null, roleInTask = null }, connection = pool) {
    await connection.query(
      `UPDATE task_assignments
       SET task_id = ?, assigned_by = ?, role_in_task = ?
       WHERE id = ?`,
      [taskId, assignedBy, roleInTask, id]
    );

    return this.findById(id, connection);
  }
}

module.exports = TaskAssignmentModel;
