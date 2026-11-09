# Changelog

## 2.0.0
- Consent-based visitor welcome: visitors choose to opt in, optionally give their name, and get a personal greeting.
- Visits are stored only after opt-in; IPs are stored as a coarse network plus a salted hash (set `IP_HASH_SALT`).
- New optional visitor fields: name, time zone, language, screen size. Admin visitor table shows the name.
- Visitors can withdraw consent at any time (`VisitorService.reset()`).
- Database: new nullable columns on `visitors` (ipHash, visitorName, timezone, language, screen, consent). Run a migration or a one-time `DATABASE_SYNC=true` boot.
