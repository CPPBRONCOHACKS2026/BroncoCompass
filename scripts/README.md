# BroncoCompass — CPP Schedule Scraper

Scrapes `schedule.cpp.edu` and outputs JSON files ready to drop into your app.

## Setup (one time)

```bash
pip install playwright beautifulsoup4
playwright install chromium
```

## Run it

```bash
# Scrape current term only (SP 2025) — fastest, ~3-5 min
python scrape_cpp.py

# Scrape a specific term
python scrape_cpp.py --term "F 2024"

# Scrape ALL terms on record — slow (~30+ min)
python scrape_cpp.py --all-terms

# Scrape all component types (Lecture, Lab, Seminar, etc.)
python scrape_cpp.py --all-components
```

## Output files

| File | What it contains |
|------|-----------------|
| `courses.json` | Unique courses with their sections grouped |
| `professors.json` | All instructors found |
| `sections.json` | Every individual class section |

## What to do with the files

Copy all three into your project's `public/` folder:

```
BroncoCompass/
  public/
    courses.json      ← copy here
    professors.json   ← copy here
    sections.json     ← copy here
    index.html
    app.js
    styles.css
```

Then in `app.js`, replace the hardcoded `COURSE_DATA` block with:

```js
let COURSES = [];
let SECTIONS = [];

async function loadData() {
  const [coursesRes, sectionsRes] = await Promise.all([
    fetch('/courses.json'),
    fetch('/sections.json')
  ]);
  COURSES = await coursesRes.json();
  SECTIONS = await sectionsRes.json();
}
```

## Available terms

| Term | Code |
|------|------|
| F 2022 | 2227 |
| W 2023 | 2231 |
| SP 2023 | 2233 |
| F 2023 | 2237 |
| W 2024 | 2241 |
| SP 2024 | 2243 |
| F 2024 | 2247 |
| W 2025 | 2251 |
| SP 2025 | 2253 |
| F 2025 | 2257 |

To add a newer term, just add it to the `TERMS` dict at the top of `scrape_cpp.py`.
