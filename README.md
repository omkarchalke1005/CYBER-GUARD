# CyberGuard

CyberGuard is a demo cyber security frontend + backend scanner.

This repository contains a static frontend and a small Node.js backend API used to perform safe, non-destructive checks (HTTP(S) fetching and header inspection) and generate a security report.

IMPORTANT: Only scan websites you are authorized to test.

## Quick start (development)

1. Install Node.js (v16+ recommended).

2. Backend: install dependencies and start the API server

```powershell
cd BACKEND
npm install
node server.js
```

The backend serves the frontend and the scanner API on port `3000` by default.

3. Open the app in your browser

- Frontend (served by the backend): http://localhost:3000/scanner.html
- Report page: http://localhost:3000/report.html

4. Use the Scanner

- Enter a valid URL (e.g. `https://example.com`) and click **Scan Now**.
- The frontend will start a backend scan job and display real-time progress.
- When complete the Security Report will be shown and saved to `localStorage` for viewing on the Report page.

## Project layout

- `FRONTEND/` — Static HTML, CSS and client-side JavaScript for the UI.
- `BACKEND/` — Node.js Express server that performs safe HTTP checks and returns structured scan results.

## Notes

- This scanner performs only non-destructive checks (header inspection, TLS presence, response status, cookie flags, redirect behavior, basic fingerprinting).
- For production use: secure the backend, add rate limiting and authentication, and only run scans on authorized targets.

If you want, I can add a `README` at the repository root (one level up) or create a `CONTRIBUTING.md` and `.github` workflows next.