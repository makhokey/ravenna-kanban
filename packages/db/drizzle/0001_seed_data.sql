-- Seed data for development
-- Board
INSERT INTO boards (id, name, created_at, updated_at) VALUES
  ('board-1', 'Project Alpha', 1706745600, 1706745600);

-- Columns
INSERT INTO columns (id, name, position, board_id, created_at, updated_at) VALUES
  ('col-backlog', 'Backlog', 0, 'board-1', 1706745600, 1706745600),
  ('col-todo', 'To Do', 1, 'board-1', 1706745600, 1706745600),
  ('col-progress', 'In Progress', 2, 'board-1', 1706745600, 1706745600),
  ('col-review', 'Review', 3, 'board-1', 1706745600, 1706745600),
  ('col-done', 'Done', 4, 'board-1', 1706745600, 1706745600);

-- Cards in Backlog (using fractional indices: a0, a1, a2)
INSERT INTO cards (id, title, description, position, priority, tags, column_id, created_at, updated_at) VALUES
  ('card-1', 'Research competitor features', 'Analyze top 5 competitors and document their key features', 'a0', 'low', '["research","planning"]', 'col-backlog', 1706745600, 1706745600),
  ('card-2', 'Design system documentation', 'Create comprehensive docs for the design system components', 'a1', 'medium', '["docs","design"]', 'col-backlog', 1706745600, 1706745600),
  ('card-3', 'Performance audit', 'Run Lighthouse and identify performance bottlenecks', 'a2', 'low', '["performance"]', 'col-backlog', 1706745600, 1706745600);

-- Cards in To Do
INSERT INTO cards (id, title, description, position, priority, tags, column_id, created_at, updated_at) VALUES
  ('card-4', 'Implement user authentication', 'Add login/signup flow with OAuth support', 'a0', 'high', '["feature","auth"]', 'col-todo', 1706745600, 1706745600),
  ('card-5', 'Add dark mode toggle', 'Implement theme switching with system preference detection', 'a1', 'medium', '["feature","ui"]', 'col-todo', 1706745600, 1706745600),
  ('card-6', 'Write unit tests for API', 'Cover all endpoints with proper test cases', 'a2', 'high', '["testing"]', 'col-todo', 1706745600, 1706745600);

-- Cards in In Progress
INSERT INTO cards (id, title, description, position, priority, tags, column_id, created_at, updated_at) VALUES
  ('card-7', 'Build dashboard layout', 'Create responsive dashboard with sidebar navigation', 'a0', 'high', '["feature","ui"]', 'col-progress', 1706745600, 1706745600),
  ('card-8', 'Integrate payment gateway', 'Set up Stripe for subscription billing', 'a1', 'high', '["feature","payments"]', 'col-progress', 1706745600, 1706745600);

-- Cards in Review
INSERT INTO cards (id, title, description, position, priority, tags, column_id, created_at, updated_at) VALUES
  ('card-9', 'API rate limiting', 'Implement rate limiting middleware to prevent abuse', 'a0', 'medium', '["security","api"]', 'col-review', 1706745600, 1706745600),
  ('card-10', 'Mobile responsive fixes', 'Fix layout issues on smaller screens', 'a1', 'medium', '["bug","ui"]', 'col-review', 1706745600, 1706745600);

-- Cards in Done
INSERT INTO cards (id, title, description, position, priority, tags, column_id, created_at, updated_at) VALUES
  ('card-11', 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment', 'a0', 'high', '["devops"]', 'col-done', 1706745600, 1706745600),
  ('card-12', 'Database schema design', 'Design and implement initial database schema', 'a1', 'high', '["database","planning"]', 'col-done', 1706745600, 1706745600),
  ('card-13', 'Project scaffolding', 'Initialize monorepo with Turborepo and configure workspaces', 'a2', 'medium', '["setup"]', 'col-done', 1706745600, 1706745600);
