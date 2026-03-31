# Prawn Container Inventory System

A full-stack web application for uploading, cleaning, validating, and summarizing Excel-based prawn container inventory files.

Built for a commercial fishing operation that was managing container inventory manually through Excel files with inconsistent formatting, duplicate entries, and no validation. This system automates the entire cleaning and validation pipeline and outputs a standardized, re-importable file in seconds.

**Live app:** https://inventory-web-app-pi.vercel.app

---

## What it does

- Accepts `.xlsx` / `.xls` inventory files via drag-and-drop upload
- Cleans raw data automatically:
  - Converts quantities to numbers, sets blanks to 0
  - Trims whitespace, uppercases Type and Code fields
  - Removes blank, NaN, and duplicate header rows
- Validates container codes against expected `[TYPE]-[SIZE]` pattern (e.g. `TS-32`, `CS-24`)
- Detects and flags duplicate entries
- Configurable column mapping — works with any Excel column naming convention
- Outputs a processed `.xlsx` file with 4 sheets:
  - **Summary** — aggregated by Type, Size, Code with totals
  - **Cleaned Data** — full sanitized dataset
  - **Reimport Ready** — 4-column export formatted for re-import
  - **Validation Errors** — rows with code mismatches (if any)

---

## Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** FastAPI (Python)
- **File processing:** openpyxl / pandas
- **Hosting:** Vercel (frontend), backend API

---

## Screenshots

*[Add a screenshot of the upload interface here]*
*[Add a screenshot of the processed output stats here]*

---

## Running locally

**Frontend**
```bash
git clone https://github.com/jrocvideos/inventory-web-app
cd inventory-web-app
npm install
npm run dev
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Background

Container codes at this operation followed a `TYPE-SIZE` pattern (e.g. `TS-32` for a tote-style container at size 32). Inventory files came in from multiple sources with inconsistent formatting — mixed case, extra spaces, wrong separators, missing codes. Every file required manual cleanup before it could be used for reporting.

This system processes a raw upload and returns a clean, validated, ready-to-use file in under 10 seconds.

---

## Author

Built by J Y — self-taught full-stack developer  
GitHub: https://github.com/jrocvideos  
Live projects: https://getpricedropalerts.com
