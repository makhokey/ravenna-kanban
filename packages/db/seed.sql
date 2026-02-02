-- Seed data for development

-- Sequence for card IDs (start at 14 since we have 13 cards)
INSERT INTO sequences (name, next_id) VALUES ('card', 14);

-- Board
INSERT INTO boards (id, name, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Project Alpha', 1706745600, 1706745600);

-- Columns
INSERT INTO columns (id, name, position, board_id, created_at, updated_at) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Backlog', 0, '11111111-1111-1111-1111-111111111111', 1706745600, 1706745600),
  ('22222222-2222-2222-2222-222222222202', 'To Do', 1, '11111111-1111-1111-1111-111111111111', 1706745600, 1706745600),
  ('22222222-2222-2222-2222-222222222203', 'In Progress', 2, '11111111-1111-1111-1111-111111111111', 1706745600, 1706745600),
  ('22222222-2222-2222-2222-222222222204', 'Review', 3, '11111111-1111-1111-1111-111111111111', 1706745600, 1706745600),
  ('22222222-2222-2222-2222-222222222205', 'Done', 4, '11111111-1111-1111-1111-111111111111', 1706745600, 1706745600);

-- Cards in Backlog (using fractional indices: a0, a1, a2)
INSERT INTO cards (id, display_id, title, description, position, priority, status, tags, column_id, created_at, updated_at) VALUES
  ('33333333-3333-3333-3333-333333333301', 'RAV-1', 'Research competitor features', 'Analyze top 5 competitors and document their key features', 'a0', 'low', 'backlog', '["research","planning"]', '22222222-2222-2222-2222-222222222201', 1706745600, 1706745600),
  ('33333333-3333-3333-3333-333333333302', 'RAV-2', 'Design system documentation', 'Create comprehensive docs for the design system components', 'a1', 'medium', 'backlog', '["docs","design"]', '22222222-2222-2222-2222-222222222201', 1706745600, 1706745600),
  ('33333333-3333-3333-3333-333333333303', 'RAV-3', 'Performance audit', 'Run Lighthouse and identify performance bottlenecks', 'a2', 'low', 'backlog', '["performance"]', '22222222-2222-2222-2222-222222222201', 1706745600, 1706745600);

-- Cards in To Do
INSERT INTO cards (id, display_id, title, description, position, priority, status, tags, column_id, created_at, updated_at) VALUES
  ('33333333-3333-3333-3333-333333333304', 'RAV-4', 'Implement user authentication', 'Add login/signup flow with OAuth support', 'a0', 'high', 'todo', '["feature","auth"]', '22222222-2222-2222-2222-222222222202', 1706745600, 1706745600),
  ('33333333-3333-3333-3333-333333333305', 'RAV-5', 'Add dark mode toggle', 'Implement theme switching with system preference detection', 'a1', 'medium', 'todo', '["feature","ui"]', '22222222-2222-2222-2222-222222222202', 1706745600, 1706745600),
  ('33333333-3333-3333-3333-333333333306', 'RAV-6', 'Write unit tests for API', 'Cover all endpoints with proper test cases', 'a2', 'high', 'todo', '["testing"]', '22222222-2222-2222-2222-222222222202', 1706745600, 1706745600);

-- Cards in In Progress
INSERT INTO cards (id, display_id, title, description, position, priority, status, tags, column_id, created_at, updated_at) VALUES
  ('33333333-3333-3333-3333-333333333307', 'RAV-7', 'Build dashboard layout', 'Create responsive dashboard with sidebar navigation', 'a0', 'high', 'in_progress', '["feature","ui"]', '22222222-2222-2222-2222-222222222203', 1706745600, 1706745600),
  ('33333333-3333-3333-3333-333333333308', 'RAV-8', 'Integrate payment gateway', 'Set up Stripe for subscription billing', 'a1', 'high', 'in_progress', '["feature","payments"]', '22222222-2222-2222-2222-222222222203', 1706745600, 1706745600);

-- Cards in Review
INSERT INTO cards (id, display_id, title, description, position, priority, status, tags, column_id, created_at, updated_at) VALUES
  ('33333333-3333-3333-3333-333333333309', 'RAV-9', 'API rate limiting', 'Implement rate limiting middleware to prevent abuse', 'a0', 'medium', 'review', '["security","api"]', '22222222-2222-2222-2222-222222222204', 1706745600, 1706745600),
  ('33333333-3333-3333-3333-333333333310', 'RAV-10', 'Mobile responsive fixes', 'Fix layout issues on smaller screens', 'a1', 'medium', 'review', '["bug","ui"]', '22222222-2222-2222-2222-222222222204', 1706745600, 1706745600);

-- Cards in Done
INSERT INTO cards (id, display_id, title, description, position, priority, status, tags, column_id, created_at, updated_at) VALUES
  ('33333333-3333-3333-3333-333333333311', 'RAV-11', 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment', 'a0', 'high', 'done', '["devops"]', '22222222-2222-2222-2222-222222222205', 1706745600, 1706745600),
  ('33333333-3333-3333-3333-333333333312', 'RAV-12', 'Database schema design', 'Design and implement initial database schema', 'a1', 'high', 'done', '["database","planning"]', '22222222-2222-2222-2222-222222222205', 1706745600, 1706745600),
  ('33333333-3333-3333-3333-333333333313', 'RAV-13', 'Project scaffolding', 'Initialize monorepo with Turborepo and configure workspaces', 'a2', 'medium', 'done', '["setup"]', '22222222-2222-2222-2222-222222222205', 1706745600, 1706745600);
