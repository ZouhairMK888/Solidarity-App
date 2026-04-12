const { pool } = require('../config/database');

class TaskAssignmentModel {
  static async findByUserAndMission(userId, missionId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, user_id, mission_id, assigned_by, role_in_task, status, assigned_at, updated_at, completed_at
       FROM task_assignments
       WHERE user_id = ? AND mission_id = ?
       LIMIT 1`,
      [userId, missionId]
    );

    return rows[0] || null;
  }

  static async create({ userId, missionId, assignedBy, roleInTask = null, status = 'assigned' }, connection = pool) {
    const [result] = await connection.query(
      `INSERT INTO task_assignments (user_id, mission_id, assigned_by, role_in_task, status)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, missionId, assignedBy || null, roleInTask, status]
    );

    const [rows] = await connection.query(
      `SELECT id, user_id, mission_id, assigned_by, role_in_task, status, assigned_at, updated_at, completed_at
       FROM task_assignments
       WHERE id = ?`,
      [result.insertId]
    );

    return rows[0] || null;
  }
}

module.exports = TaskAssignmentModel;
