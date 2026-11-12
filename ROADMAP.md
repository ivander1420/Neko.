# ROADMAP - GAMEVERSE 2026

## MVP Overview

| MVP | Description | Status |
|-----|-------------|--------|
| **MVP 0** | Audit & Foundation – verify existing project, document structure, set up initial repo, README, roadmap. | **DONE** |
| **MVP 1** | Authentication & Database – real user accounts, role‑based access, PostgreSQL / Supabase backend. | NOT STARTED |
| **MVP 2** | Developer Dashboard & Team System – CRUD participants, teams, devices, announcements. | NOT STARTED |
| **MVP 3** | Motherboard Display – public screen controller with scenes. | NOT STARTED |
| **MVP 4** | Match Control & Device Connections – QR code, laptop + phone sync, timer. | NOT STARTED |
| **MVP 5** | Solo Quiz – fully functional quiz game with leaderboard. | NOT STARTED |
| **MVP 6** | Game: Data Center – Zero Hour (puzzle zones). | NOT STARTED |
| **MVP 7** | Game: Blackout Protocol (network simulation). | NOT STARTED |
| **MVP 8** | Game: The Last Suspect (investigation). | NOT STARTED |
| **MVP 9** | Full Leaderboard & Event Scoring – aggregate scores, audit logs. | NOT STARTED |
| **MVP 10** | Deployment & Android APK – Vercel, Capacitor, CI/CD. | NOT STARTED |
| **MVP 11** | Optimization & Final Testing – performance, security, backup. | NOT STARTED |

---

### Current Focus (MVP 1)
- Migrasi auth & data user dari `db.json` ke PostgreSQL/Supabase.
- Role-based access (siswa/guru/admin).
- Sinkronisasi otomatis `android-apk/` pada skrip build.

---

### MVP 0 (selesai)
- Audit, dokumentasi, dan laporan tersedia di `MVP-00-REPORT.md`.

### Arsip — Current Focus (MVP 0)
- Audit existing codebase.
- Document folder/file structure and technologies.
- Identify working components and missing dependencies.
- Produce an initial report (`MVP-00-REPORT.md`).
- Ensure the repository has a basic `README.md` and `.gitignore`.
- Prepare `docs/reports/` folder for future MVP reports.

---

### Next Steps after MVP 0
1. Finalize the audit report and publish it.
2. Define the target architecture (frontend React + Vite, backend Node/Express with Supabase, PostgreSQL).
3. Add required dependencies and scripts.
4. Begin MVP 1 implementation.

