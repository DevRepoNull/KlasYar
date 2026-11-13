# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Global Command Palette (`Ctrl+K`) for lightning-fast keyboard search and actions.
- Keyboard shortcuts for attendance taking (`P` for present, `A` for absent, etc.).
- Complete PWA background sync and native splash screen assets.
- Optional multi-device synchronization via self-hosted PocketBase / WebDAV.
- Full internationalization (i18n) with English and LTR support.
- Mobile native apps packaging via Capacitor (Android / iOS).

---

## [0.3.0] - 2026-11-14

### Security & Authentication
- **Local-First Admin Authentication:** Implemented zero-knowledge local admin authentication powered by Web Crypto API with **PBKDF2** (100,000 iterations) and **SHA-256** with randomized cryptographic salts.
- **Route Guards & Session Management:** Added automatic session timeout management, reactive session verification, and route protection ensuring unauthenticated access cannot reach class or student records.
- **Lock Screen:** Instant quick-lock screen modal allowing educators to lock their session during breaks without losing active state.
- **Account & Security Settings Tab:** Added administrative password change, profile management, and emergency master reset options.
- **Database Schema v2:** Safely upgraded Dexie database schema to version 2 with a dedicated `users` table while retaining 100% backward compatibility.

### Added
- **Dynamic 4-Palette Theming Engine:** Added luxury color palettes (**Emerald زمرد**, **Midnight نیمه‌شب**, **Sunset غروب**, and **Monochrome تک‌رنگ**) with instant CSS variable injection across components.
- **Aurora Background & Glow Effects:** Added organic, smooth-floating Aurora background animation and interactive button glowing halos (`.glow-effect`).
- **Direct Jalali Month & Year Navigation:** Added a quick-jump popover selector with Persian numerals for both Calendar and Reports pages.
- **Modern Interactive TimePicker:** Designed an animated time picker with slide transitions and quick presets (15, 30, and 45 minutes) for frictionless class scheduling.
- **Jalali Date Range Filtering:** Added comprehensive date range filter controls for session logs and generated reports.
- **Styled Excel Exporting:** Integrated `xlsx-js-style` to output beautifully styled Excel attendance matrices with custom column widths, headers, and colors.
- **Resilient Error Boundaries:** Added custom React error boundaries to isolate component errors and prevent application-wide white-screen crashes.
- **Expanded Test Suite:** Scaled automated unit and integration tests to **83 passing tests across 13 test suites**, covering RTL layout, authentication, pure logic calculations, report styling, and responsive UX.

### Fixed
- **Attendance Hooks Crash:** Resolved React Rules of Hooks ordering violation in `SessionAttendanceDialog` that previously caused runtime exceptions when opening attendance modals on the Sessions page (`/sessions`).
- **Route Transition Freeze:** Eliminated blank screen freeze when transitioning routes between Settings and Calendar after changing themes.
- **Modal Event Propagation & Pointer Events:** Fixed pointer-events, event bubbling, and backdrop click handling for Jalali DatePicker and TimePicker inside Radix modal dialogs.
- **Layout Clipping & Badges:** Resolved text clipping and overflow in PDF report status badges, settings navigation tabs, and search placeholders.
- **Typography Centering:** Unified brand identity and perfected flexbox cross-axis centering for login/auth titles and subtitles.
- **Modal Aesthetic:** Enhanced modal backdrops with clean, modern frosted glassmorphism without visual clutter.

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
