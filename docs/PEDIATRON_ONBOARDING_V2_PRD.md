# Pediatron Onboarding V2

Approved business baseline — 2026-11-26.

- Consultative sales exclusively via WhatsApp; no new checkout.
- One account and Minha Pediatron portal, with independent product entitlements.
- Registration: name, email, WhatsApp, password, terms acceptance and privacy acknowledgement; optional commercial consent. No CRM/CPF requirement.
- Open networking invitation immediately after registration; email verification required for new premium activation. Closed group only for active subscribers; manual membership approval/removal.
- Commercial team records negotiation/payment; administrator alone activates, renews, revokes or grants courtesy. Audit all changes. No mandatory student proof upload in new flow.
- Mentory and closed group: six months; Folha PCR: twelve months independently. Early renewal extends existing end date; expired renewal starts at reactivation. Preserve progress and open community access.
- Renewal reminders: 30, 15, 7, 1 days before expiry and at expiry; cancel/recalculate after renewal. No automatic billing.
- Preserve existing identities, credentials, licenses, enrollment dates, progress, audit and payment records; optional WhatsApp update for legacy users.
- Existing shared environment remains in use; no new environment requested. Use incremental versioned changes, additive migrations and rollback plan.

## Acceptance gates

Verify registration and email resend, immediate open invitation, authenticated portal, independent entitlements, commercial/admin authorization, activation idempotency, renewal reminders, expiry, legacy login and existing product regression. Never expose closed invite to inactive users. Track invite clicks separately from actual membership. No release claim until build and relevant tests pass.

## Implementation dependencies

Confirm actual database schema and migration history; existing legal document routes and versions; WhatsApp invitation configuration; email delivery and sender; current roles and license grant mechanisms. Do not assume direct WhatsApp membership API access.
