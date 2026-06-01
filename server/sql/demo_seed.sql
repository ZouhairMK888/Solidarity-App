USE solidarity_app;

-- Demo data for presentation recording.
-- Login password for every demo account below: Password123!

SET @demo_password = '$2a$12$nGGPEM0XmcgtI.jAxYcr..Otcfl/RT1B0ADIugYxPeoWYziHk2rS6';

INSERT INTO users (name, email, password, phone, role, is_active)
VALUES
  ('Admin Demo', 'admin.demo@solidarity.test', @demo_password, '+212600000001', 'admin', 1),
  ('Salma Organizer', 'organizer.demo@solidarity.test', @demo_password, '+212600000002', 'organizer', 1),
  ('Youssef Volunteer', 'volunteer.demo@solidarity.test', @demo_password, '+212600000003', 'volunteer', 1),
  ('Nora Volunteer', 'nora.demo@solidarity.test', @demo_password, '+212600000004', 'volunteer', 1),
  ('Karim Donor', 'karim.donor@solidarity.test', @demo_password, '+212600000005', 'volunteer', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  phone = VALUES(phone),
  role = VALUES(role),
  is_active = VALUES(is_active);

SELECT id INTO @admin_id FROM users WHERE email = 'admin.demo@solidarity.test' LIMIT 1;
SELECT id INTO @organizer_id FROM users WHERE email = 'organizer.demo@solidarity.test' LIMIT 1;
SELECT id INTO @volunteer_id FROM users WHERE email = 'volunteer.demo@solidarity.test' LIMIT 1;
SELECT id INTO @nora_id FROM users WHERE email = 'nora.demo@solidarity.test' LIMIT 1;
SELECT id INTO @karim_id FROM users WHERE email = 'karim.donor@solidarity.test' LIMIT 1;

INSERT INTO campaigns
  (title, description, image_url, location, latitude, longitude, start_date, end_date, status, created_by)
VALUES
  (
    'Winter Warmth Drive',
    'Collect blankets, warm clothes, and food baskets for families affected by cold weather in mountain villages.',
    '/uploads/campaigns/1779700559446-winter.png',
    'Atlas Mountains, Morocco',
    31.6295,
    -7.9811,
    '2026-06-05',
    '2026-06-20',
    'active',
    @organizer_id
  )
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @winter_campaign_id = LAST_INSERT_ID();

INSERT INTO campaigns
  (title, description, image_url, location, latitude, longitude, start_date, end_date, status, created_by)
VALUES
  (
    'School Supplies For All',
    'Prepare school kits with notebooks, backpacks, and basic learning materials for children before the new school year.',
    '/uploads/campaigns/1775950832194-slide-donnation-min.jpg',
    'Casablanca, Morocco',
    33.5731,
    -7.5898,
    '2026-08-15',
    '2026-09-10',
    'active',
    @organizer_id
  )
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @school_campaign_id = LAST_INSERT_ID();

INSERT INTO campaigns
  (title, description, image_url, location, latitude, longitude, start_date, end_date, status, created_by)
VALUES
  (
    'Community Food Basket',
    'Support low-income families with weekly baskets containing flour, oil, rice, vegetables, and hygiene products.',
    '/uploads/campaigns/1776025788554-images.jpg',
    'Rabat, Morocco',
    34.0209,
    -6.8416,
    '2026-05-28',
    '2026-06-30',
    'draft',
    @organizer_id
  )
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @food_campaign_id = LAST_INSERT_ID();

INSERT INTO campaign_organizers (campaign_id, user_id, role, status)
VALUES
  (@winter_campaign_id, @organizer_id, 'owner', 'active'),
  (@school_campaign_id, @organizer_id, 'owner', 'active'),
  (@food_campaign_id, @organizer_id, 'owner', 'active')
ON DUPLICATE KEY UPDATE role = VALUES(role), status = VALUES(status);

INSERT INTO missions (campaign_id, title, description, required_volunteers, location, mission_date, status)
VALUES
  (@winter_campaign_id, 'Collect warm clothes', 'Receive, sort, and label donated coats, sweaters, and blankets.', 8, 'Solidarity Center, Marrakech', '2026-06-06 10:00:00', 'open');
SET @mission_collect_id = LAST_INSERT_ID();

INSERT INTO missions (campaign_id, title, description, required_volunteers, location, mission_date, status)
VALUES
  (@winter_campaign_id, 'Deliver winter kits', 'Load donation packages and deliver them to registered families.', 6, 'Atlas Mountains, Morocco', '2026-06-12 08:30:00', 'open');
SET @mission_deliver_id = LAST_INSERT_ID();

INSERT INTO missions (campaign_id, title, description, required_volunteers, location, mission_date, status)
VALUES
  (@school_campaign_id, 'Prepare school kits', 'Assemble backpacks with notebooks, pens, rulers, and educational flyers.', 10, 'Casablanca Youth Center', '2026-08-20 09:00:00', 'open');
SET @mission_school_id = LAST_INSERT_ID();

INSERT INTO missions (campaign_id, title, description, required_volunteers, location, mission_date, status)
VALUES
  (@food_campaign_id, 'Register beneficiary families', 'Call families, verify needs, and prepare the first distribution list.', 4, 'Rabat Community Office', '2026-06-02 14:00:00', 'closed');
SET @mission_food_id = LAST_INSERT_ID();

INSERT INTO mission_tasks (mission_id, title, description, required_volunteers, status, sort_order)
VALUES
  (@mission_collect_id, 'Reception desk', 'Welcome donors and record the received items.', 2, 'in_progress', 1),
  (@mission_collect_id, 'Sorting station', 'Separate clothes by size and condition.', 3, 'todo', 2),
  (@mission_collect_id, 'Packaging', 'Pack kits and mark each package by family size.', 3, 'todo', 3),
  (@mission_deliver_id, 'Route planning', 'Prepare delivery routes and contact family representatives.', 2, 'todo', 1),
  (@mission_deliver_id, 'Field delivery', 'Deliver kits and collect confirmation notes.', 4, 'todo', 2),
  (@mission_school_id, 'Backpack assembly', 'Prepare complete school kits.', 6, 'todo', 1),
  (@mission_school_id, 'Quality check', 'Check each backpack before distribution.', 4, 'todo', 2);

SELECT id INTO @task_reception_id FROM mission_tasks WHERE mission_id = @mission_collect_id AND title = 'Reception desk' ORDER BY id DESC LIMIT 1;
SELECT id INTO @task_sorting_id FROM mission_tasks WHERE mission_id = @mission_collect_id AND title = 'Sorting station' ORDER BY id DESC LIMIT 1;
SELECT id INTO @task_route_id FROM mission_tasks WHERE mission_id = @mission_deliver_id AND title = 'Route planning' ORDER BY id DESC LIMIT 1;

INSERT INTO volunteer_applications (user_id, mission_id, status, motivation)
VALUES
  (@volunteer_id, @mission_collect_id, 'accepted', 'I can help with reception and organizing donation items.'),
  (@nora_id, @mission_collect_id, 'pending', 'I want to help families stay warm this winter.'),
  (@karim_id, @mission_deliver_id, 'accepted', 'I have a car and can help with delivery.'),
  (@volunteer_id, @mission_school_id, 'pending', 'I enjoy working on educational support activities.')
ON DUPLICATE KEY UPDATE status = VALUES(status), motivation = VALUES(motivation);

INSERT INTO task_assignments (user_id, mission_id, task_id, assigned_by, role_in_task, status)
VALUES
  (@volunteer_id, @mission_collect_id, @task_reception_id, @organizer_id, 'Reception lead', 'assigned'),
  (@karim_id, @mission_deliver_id, @task_route_id, @organizer_id, 'Driver coordinator', 'assigned')
ON DUPLICATE KEY UPDATE
  task_id = VALUES(task_id),
  assigned_by = VALUES(assigned_by),
  role_in_task = VALUES(role_in_task),
  status = VALUES(status);

INSERT INTO organizer_applications (user_id, campaign_id, motivation, experience, status, reviewed_by, reviewed_at)
VALUES
  (@nora_id, @winter_campaign_id, 'I want to coordinate volunteers for field work.', 'Two years in local association activities.', 'pending', NULL, NULL),
  (@volunteer_id, @school_campaign_id, 'I can help manage school kit preparation.', 'Organized university club events.', 'accepted', @admin_id, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  motivation = VALUES(motivation),
  experience = VALUES(experience),
  status = VALUES(status),
  reviewed_by = VALUES(reviewed_by),
  reviewed_at = VALUES(reviewed_at);

INSERT INTO donations (donor_name, donor_email, type, amount, description, campaign_id, status)
VALUES
  ('Karim Benali', 'karim.benali@example.com', 'financial', 1500.00, 'Contribution for blankets and transport fuel.', @winter_campaign_id, 'confirmed'),
  ('Atlas Textile Shop', 'contact@atlastextile.example', 'material', NULL, '30 blankets and 20 warm jackets.', @winter_campaign_id, 'confirmed'),
  ('Anonymous Donor', NULL, 'financial', 500.00, 'Small support for school supplies.', @school_campaign_id, 'pending'),
  ('Book Corner', 'hello@bookcorner.example', 'material', NULL, '120 notebooks and 80 pens.', @school_campaign_id, 'confirmed'),
  ('Local Market Group', 'market@example.com', 'material', NULL, 'Rice, flour, oil, and hygiene products.', @food_campaign_id, 'pending');

INSERT INTO notifications (user_id, title, message, type, is_read)
VALUES
  (@volunteer_id, 'Application accepted', 'You have been accepted for Collect warm clothes.', 'application', 0),
  (@nora_id, 'Organizer request pending', 'Your organizer request for Winter Warmth Drive is waiting for review.', 'organizer_application', 0),
  (@organizer_id, 'New donation received', 'Atlas Textile Shop added a material donation to Winter Warmth Drive.', 'donation', 0),
  (@admin_id, 'Demo data ready', 'The presentation dataset has campaigns, missions, tasks, donations, and applications.', 'system', 0);
