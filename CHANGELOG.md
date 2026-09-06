# Changelog

All notable changes to GeminiBot are documented here.

## [Deprecated] - 2026-09-06

### Deprecated

- GeminiBot is retained as a historical reference. Telegram and the Gemini CLI are both retired at Greyforge Labs, so no further releases, dependency updates, or security fixes are planned.

## [0.1.0] - 2026-05-02

### Added

- Telegram-to-`gemini-cli` bridge with authorized-user gating.
- Sequential queue for session safety.
- Bounded document and photo uploads into the configured workspace.
- Configurable approval mode, upload limit, and bridge log path.
- OpenForge release scaffolding and syntax verification.

### Fixed

- Rejected partial numeric `AUTHORIZED_USER_ID` values.
- Guarded child-process finalization so queue state cannot advance twice.
- Bounded streaming edit messages to Telegram's message-size limits.
- Added collision-resistant upload filenames when an upload target already exists.
