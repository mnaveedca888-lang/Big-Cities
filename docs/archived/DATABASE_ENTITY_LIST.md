# Database Entity List (archived)

Full original content preserved below.

# Database Entity List

This file lists the primary database entities implied by the frontend.

- users
- roles
- permissions
- role_permissions
- sessions (refresh tokens)
- events
- event_tags (or tags JSONB)
- categories
- countries
- cities
- saved_events
- watchlist (or user_event_preferences)
- notifications
- activities (recentActivity)
- uploads
- analytics_events / aggregates
- audit_logs

Use UUID primary keys for distributed identity, prefer `uuid` where appropriate, and enforce created_at/updated_at timestamps on all rows.
