# علاء الشريف · منصة الامتحانات

A working Arabic (RTL) exam platform for the teacher **Alaa Al‑Sharif (علاء الشريف)**. It's built from the "UI mockup request form" design: public site, student app, focus-mode exams with results, and an admin panel.

It's plain HTML/CSS/JS with no build step. Open `index.html` or serve the folder, and it runs.

## What works

**Public site** (`#/`)
- Hero, grade carousel by stage (6–10, Tawjihi, BITC), live stats, the three steps, leaderboard by grade, latest lesson videos, about the teacher, FAQ, light/dark theme.

**Accounts** (`#/signin`, `#/signup`)
- Sign up in three steps: name and phone, then grade, then a 4-digit PIN.
- Sign in with phone and PIN. Five wrong tries lock sign-in for 15 minutes.
- Demo login: `0790000000`, PIN `1234`.

**Student app** (`#/app`)
- Home page: "continue where you stopped", unit progress, lessons that need work (scores ≤ 70%), daily goal ring and rank.
- Units, unit outline and lesson pages (YouTube embed when a video is set).
- My results (score chart, filter by unit), leaderboard with podium, videos.
- Account sheet: change grade, dark mode, WhatsApp opt-out, sign out.

**Exams** (`#/exam/L/<lesson>` · `#/exam/U/<unit>`)
- One question per screen, or all questions at once, with a question map.
- Flag questions for review. Shared reading passages.
- Countdown timer that warns at 2 minutes and 30 seconds and submits automatically when time runs out.
- Keyboard: `1–9` picks an answer, arrow keys move between questions.
- The exam pauses if the student leaves the window. The page carries a watermark with the student's name and phone.
- Before submitting, the student is shown any unanswered questions.

**Results** (`#/result/<id>`)
- Score ring with a band message (ادرس أكثر / تحتاج تثبيتاً / أحسنت / أبدعت).
- Review of wrong answers, or all answers, with the reason for each correct answer.
- Lessons the mistakes came from, retry, and next lesson.

**Admin** (`#/admin`, default code `0000`; change it in Settings)
- Dashboard: KPIs, students by grade, 30-day chart, top students, most-taken exams, most-missed questions.
- Question bank: filter by grade, unit or lesson. A drawer editor with a live student preview (2–10 options, correct answer, passage, reason).
- Units and lessons: add, rename and delete, attach YouTube links, mark a grade as "coming soon".
- Students: search, WhatsApp, reset PIN, delete.
- WhatsApp campaigns: pick an audience by grade, optionally only students inactive for 7 days. Write a message with `{الاسم}`. Each student gets a one-click `wa.me` link and the "sent" status is tracked.
- Settings: teacher name, texts, links, daily goal, FAQ. Export, import or reset the data as JSON.

## Data

All data lives in the browser's `localStorage`. `data.js` is the starting content: grade 11 Islamic Education units and questions from the design, plus demo students.

Use **Settings → البيانات → تصدير** to back up the data or move it to another device.

> This is a front-end-only version. Accounts and the admin code are checked in the browser, so they are not a real security boundary. Each device has its own data. To share data between all students, connect a backend (for example Supabase) in place of the `store` helpers in `app.js`.

## Run locally

```bash
cd alaaalsharif
python3 -m http.server 8000   # then open http://localhost:8000
```

## Publish on GitHub Pages

The workflow `.github/workflows/alaaalsharif-pages.yml` deploys this folder.

To turn it on, go to **Settings → Pages → Build and deployment → Source: GitHub Actions**. After the next push to `main`, the site is live at `https://adnanonisy.github.io/adnanonisy/`.
