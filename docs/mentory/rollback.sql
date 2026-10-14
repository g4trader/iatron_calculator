-- Restore a verified backup first if Mentory data must be preserved. Destructive only to Mentory.
BEGIN;
DROP TABLE IF EXISTS mentory_rate_buckets, mentory_audit_logs, mentory_enrollments, mentory_subscriptions, mentory_lesson_progress, mentory_materials, mentory_private_assets, mentory_lessons, mentory_modules, mentory_role_grants CASCADE;
DROP TYPE IF EXISTS "MentoryRole", "MentoryContentStatus", "MentoryAccessStatus";
COMMIT;
