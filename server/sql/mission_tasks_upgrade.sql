USE solidarity_app;

-- Add tasks inside missions so admins can assign approved volunteers to
-- specific work lanes instead of only to the mission as a whole.
CREATE TABLE mission_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mission_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    required_volunteers INT NOT NULL DEFAULT 1,
    status ENUM('todo', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'todo',
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_mission_task_mission FOREIGN KEY (mission_id)
        REFERENCES missions(id) ON DELETE CASCADE
);

ALTER TABLE task_assignments
    ADD COLUMN task_id BIGINT NULL AFTER mission_id;

ALTER TABLE task_assignments
    ADD CONSTRAINT fk_task_assignment_task FOREIGN KEY (task_id)
        REFERENCES mission_tasks(id) ON DELETE SET NULL;

CREATE INDEX idx_mission_tasks_mission ON mission_tasks(mission_id);
CREATE INDEX idx_mission_tasks_status ON mission_tasks(status);
CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
