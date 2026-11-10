# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Complete PWA background sync and keyboard navigation shortcuts.
- Optional multi-device synchronization via self-hosted PocketBase.
- Full internationalization (i18n) with English and LTR support.
- Mobile native apps packaging via Capacitor (Android / iOS).

---

## [0.1.0] - 2025-11-10

### Added
- Local-first architecture powered by IndexedDB with Dexie.js for full privacy and 100% offline functionality.
- Persian Solar Hijri (Jalali) monthly calendar view with official holidays, Fridays, and teaching hours calculation.
- Full Class Management (CRUD) including title, subject, grade, school/institution name, student capacity, and phone number.
- Student roster management with quick enrollment, profile details, and private notes.
- Smart attendance tracking with multi-state marking: Present, Absent, Tardy, and Excused with percentage statistics.
- Visual session and class color-tagging system for clear schedule identification.
- Notification and session reminder system for upcoming classes.
- Multi-format data export engine:
  - Excel spreadsheet (.xlsx) with styled attendance tables.
  - Formatted Word document (.docx).
  - Print-ready PDF report (.pdf).
  - Complete JSON database backup.
- Full database backup import and export system with conflict-safe Dexie export/import.
- Light, Dark, and System theme mode switcher without Flash of Unstyled Content (FOUC).
- Progressive Web App (PWA) manifest and service worker configuration for desktop and mobile installation.
- Automated unit and integration testing setup with Vitest and fake-indexeddb.

### Changed
- Responsive grid and touch-friendly controls across all viewport sizes (mobile, tablet, and desktop).
- Standardized UI component design system using Tailwind CSS and Radix UI primitives.
- Optimized bundle splitting and build process using Vite.

### Fixed
- Fixed Jalali leap year date calculations for end-of-year month transitions (Esfand 29/30).
- Resolved RTL layout mirroring issues in modal dialogs and dropdown menus.
- Corrected IndexedDB reactive transaction timing issues on rapid attendance toggling.
