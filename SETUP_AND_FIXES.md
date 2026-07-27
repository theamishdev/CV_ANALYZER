# CV Analyzer — Setup Guide & What Was Fixed

Your project was already very well built out — full upload → analyze → edit → export
pipeline with a local-fallback analyzer, an Angular editable-CV UI, and Puppeteer/DOCX
export. Two things were blocking it from actually running end-to-end, both fixed below.

## What was fixed

1. **Python launcher was Windows-only.** `authController.js` called `execFile('py', ...)`
   directly, which only exists on Windows. On macOS/Linux this crashed every prediction
   call. Added `getPythonCommand()`, which auto-detects `python3` → `python` → `py` for
   the current OS and caches the result (`backend/controllers/authController.js`).
2. **A real xAI API key was committed to `backend/.env`** (and is in your git history).
   It has been removed from the working file and replaced with a placeholder, plus a new
   `backend/.env.example` template.

   ⚠️ **Rotate/revoke that key now** at console.x.ai — it was exposed in the file you
   shared and is also still present in past git commits until you scrub history
   (`git filter-repo` / BFG) or rotate the key, which is the simpler fix.
3. Added `backend/scripts/requirements.txt` (`joblib`, `scikit-learn`) since none existed.

## How the "find what needs changing" feature works

1. User pastes a target Job Description and uploads a PDF/DOCX CV.
2. Backend extracts text (`pdf-parse` / `mammoth`), runs it through the local
   `title_classifier.pkl` / `exp_classifier.pkl` models to predict role & seniority.
3. **If `XAI_API_KEY` is set**, the backend asks Grok to diff the CV against the JD and
   return a match score, matched/missing/other skills, section-by-section suggestions,
   and a structured `parsedCv` object.
4. **If no key is set (or the call fails)**, the Angular app runs a client-side
   keyword-matching fallback (`generateLocalFallbackResults` in `home.component.ts`) that
   produces the same shape of suggestions/parsedCv locally — so the app is fully
   functional with zero external API cost.
5. Suggestions are shown with an "Apply"/optimizer flow that rewrites the relevant CV
   section text, feeding into the editable CV form (`interactive-cv` component).

## Editing & default-format export

- `interactive-cv.component.ts/html` renders the parsed CV as an editable form (contact,
  summary, experience, education, projects, skills, certifications, achievements) with
  add/remove controls for every repeating section.
- "Generate PDF" posts the edited `CVData` to `POST /api/cv/generate`, which renders
  `backend/templates/resume.hbs` (a clean, single-column ATS-style default resume
  template) via Puppeteer and streams back a downloadable PDF.
- There's also a `POST /api/auth/download-docx` path that patches the *original* uploaded
  DOCX in place (preserving its exact formatting) instead of using the default template.

## Running it locally

### Prerequisites
- Node.js 18+
- Python 3.9+ (for the local ML classifier)
- MongoDB running locally (or set `MONGODB_URI` to Atlas/other)
- Chrome/Chromium available for Puppeteer (installed automatically by `npm install` in
  `backend`, unless you're on an OS/arch Puppeteer doesn't ship a binary for)

### Backend
```bash
cd backend
npm install
pip install -r scripts/requirements.txt
cp .env.example .env   # then fill in MONGODB_URI / SESSION_SECRET / XAI_API_KEY (optional)
npm run dev             # http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm start                # http://localhost:4200
```

Open `http://localhost:4200`, sign up, paste a job description, upload a CV, review the
flagged sections, apply fixes or edit the form directly, then click "Generate PDF" to
download the final resume.

### Notes
- Without `XAI_API_KEY`, analysis quality is good but keyword-based rather than
  LLM-based — this is expected, not a bug.
- Without MongoDB running, `/api/auth/*` (signup/login) will fail; the analyzer itself
  doesn't require an account beyond the auth guard on the `/home` route.
