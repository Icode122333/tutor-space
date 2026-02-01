-- Update courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS mode text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration text;

-- Update exhibition_projects table
ALTER TABLE exhibition_projects ADD COLUMN IF NOT EXISTS problem_definition text;
ALTER TABLE exhibition_projects ADD COLUMN IF NOT EXISTS data_evidence text;
ALTER TABLE exhibition_projects ADD COLUMN IF NOT EXISTS tools_methods text;
ALTER TABLE exhibition_projects ADD COLUMN IF NOT EXISTS analysis text;
ALTER TABLE exhibition_projects ADD COLUMN IF NOT EXISTS recommendations text;

-- Create policy to allow public read access if not exists (usually already exists for landing page content)
-- Just ensuring we don't break anything. These tables are currently public read based on Index.tsx usage.
