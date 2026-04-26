"""
BroncoCompass - CPP Class Schedule Scraper
==========================================
Scrapes schedule.cpp.edu and outputs two files:
  - courses.json   → all class sections (goes in BroncoCompass/public/)
  - professors.json → professor info (goes in BroncoCompass/public/)

Requirements:
  pip install playwright beautifulsoup4
  playwright install chromium

Usage:
  python scrape_cpp.py                   # scrapes current term only (fast, ~5 min)
  python scrape_cpp.py --all-terms       # scrapes all terms (slow, ~30+ min)
  python scrape_cpp.py --term "SP 2025"  # scrapes one specific term
"""

import asyncio
import json
import re
import argparse
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

# Term name → dropdown value on schedule.cpp.edu
# Add newer terms here as needed (pattern: increment by 2 for spring/fall, etc.)
TERMS = {
    "F 2022":  "2227",
    "W 2023":  "2231",
    "SP 2023": "2233",
    "SU 2023": "2235",
    "F 2023":  "2237",
    "W 2024":  "2241",
    "SP 2024": "2243",
    "SU 2024": "2245",
    "F 2024":  "2247",
    "W 2025":  "2251",
    "SP 2025": "2253",   # ← likely current term
    "SU 2025": "2255",
    "F 2025":  "2257",
}

# Course component types (dropdown values on the site)
COURSE_COMPONENTS = {
    "LEC": "Lecture",
    "LAB": "Laboratory",
    "SEM": "Seminar",
    "ACT": "Activity",
    "IND": "Independent Study",
}

# For hackathon speed: only scrape Lecture + Lab (covers 90% of what students care about)
COMPONENTS_TO_SCRAPE = ["LEC", "LAB"]

# Default: only scrape the most recent term
DEFAULT_TERM = "SP 2025"

# ─────────────────────────────────────────────
# TIME HELPERS
# ─────────────────────────────────────────────

def parse_time_to_decimal(time_str):
    """Convert '9:00 AM' → 9.0, '1:30 PM' → 13.5"""
    time_str = time_str.strip()
    try:
        # Handle format like "9:00 AM" or "1:30 PM"
        match = re.match(r'(\d+):(\d+)\s*(AM|PM)', time_str, re.IGNORECASE)
        if not match:
            return None
        hour, minute, period = int(match.group(1)), int(match.group(2)), match.group(3).upper()
        if period == 'PM' and hour != 12:
            hour += 12
        if period == 'AM' and hour == 12:
            hour = 0
        return round(hour + minute / 60, 4)
    except:
        return None

def parse_days(days_str):
    """Parse 'MWF' or 'TuTh' into a list of day names."""
    days = []
    # Order matters — check longer tokens first
    day_map = [
        ("Su", "sunday"),
        ("Tu", "tuesday"),
        ("Th", "thursday"),
        ("Sa", "saturday"),
        ("M",  "monday"),
        ("W",  "wednesday"),
        ("F",  "friday"),
    ]
    remaining = days_str.strip()
    while remaining:
        matched = False
        for token, name in day_map:
            if remaining.startswith(token):
                days.append(name)
                remaining = remaining[len(token):]
                matched = True
                break
        if not matched:
            remaining = remaining[1:]  # skip unknown character
    return days

def guess_difficulty(course_number):
    """
    Rough difficulty estimate based on course number.
    100-level = easy, 200-300 = medium, 400+ = hard
    """
    match = re.search(r'\d+', str(course_number))
    if not match:
        return "medium"
    num = int(match.group())
    if num < 200:
        return "easy"
    elif num < 400:
        return "medium"
    else:
        return "hard"

def component_to_style(component):
    """Map component type to a teaching style tag."""
    mapping = {
        "Lecture":          "lectures",
        "Laboratory":       "labs",
        "Seminar":          "discussion",
        "Activity":         "hands-on",
        "Independent Study":"projects",
    }
    return mapping.get(component, "lectures")

# ─────────────────────────────────────────────
# SCRAPER
# ─────────────────────────────────────────────

async def scrape_term(page, term_name, term_value, components):
    """Scrape all sections for a single term, returns list of section dicts."""
    all_sections = []

    for component_key in components:
        component_label = COURSE_COMPONENTS[component_key]
        print(f"  📋 Scraping {term_name} — {component_label}...")

        try:
            # Select the term from the dropdown
            await page.select_option(
                "select#ctl00_ContentPlaceHolder1_TermDDL",
                value=term_value
            )

            # Select the course component
            await page.select_option(
                "select#ctl00_ContentPlaceHolder1_CourseComponentDDL",
                value=component_key
            )

            # Click Search and wait for page to reload
            async with page.expect_navigation(timeout=120_000, wait_until="load"):
                await page.click("#ctl00_ContentPlaceHolder1_SearchButton")

            # Get the rendered HTML and parse it
            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")

            sections = parse_sections(soup, term_name, component_label)
            all_sections.extend(sections)
            print(f"     ✅ Found {len(sections)} sections")

        except Exception as e:
            print(f"     ❌ Failed {term_name} {component_label}: {e}")
            # Navigate back to the main page and continue
            try:
                await page.goto("https://schedule.cpp.edu/", timeout=60_000)
            except:
                pass

    return all_sections


def parse_sections(soup, term_name, component_label):
    """Parse all class sections from the BeautifulSoup page."""
    sections = []

    class_list = soup.select("#class_list > ol > li")
    if not class_list:
        return sections

    for item in class_list:
        try:
            section = parse_single_section(item, term_name, component_label)
            if section:
                sections.append(section)
        except Exception as e:
            # Don't crash the whole scrape for one bad section
            pass

    return sections


def parse_single_section(item, term_name, component_label):
    """Parse a single <li> section element into a dict."""

    # ── Course code (e.g. "CS 3560") ──
    title_el = item.select_one(".ClassTitle")
    if not title_el:
        return None
    course_title_text = title_el.get_text(strip=True)
    parts = course_title_text.split()
    if len(parts) < 2:
        return None
    subject = parts[0]
    course_number = parts[1]
    course_code = f"{subject} {course_number}"

    # ── Section number ──
    full_text = item.get_text()
    section_match = re.search(r'Section\s+(\d+)', full_text)
    section_number = section_match.group(1) if section_match else "01"

    # ── Class number (unique ID on the schedule) ──
    class_num_el = item.select_one("[id$='TableCell13']")
    class_number = int(class_num_el.get_text(strip=True)) if class_num_el else 0

    # ── Class capacity ──
    cap_el = item.select_one("[id$='TableCell14']")
    capacity = int(cap_el.get_text(strip=True)) if cap_el else 0

    # ── Course title ──
    title_cell = item.select_one("[id$='TableCell8']")
    course_name = title_cell.get_text(strip=True) if title_cell else course_code

    # ── Units ──
    units_el = item.select_one("[id$='TableCell9']")
    units_text = units_el.get_text(strip=True) if units_el else "3"
    try:
        units = float(eval(units_text))  # handles "3" or "1+3" expressions
    except:
        units = 3.0

    # ── Time and days ──
    time_el = item.select_one("[id$='TableCell1']")
    time_text = time_el.get_text(strip=True) if time_el else ""

    start_decimal = None
    end_decimal = None
    day_names = []

    if time_text and "No time" not in time_text and time_text != "TBA":
        # Format: "9:00 AM – 9:50 AM   MWF"  (em dash or regular dash)
        # Split on large whitespace to get time part vs days part
        time_parts = re.split(r'\s{2,}', time_text)
        if len(time_parts) >= 2:
            time_range = time_parts[0]
            days_str = time_parts[1]
            day_names = parse_days(days_str)

            # Parse time range (split on em-dash or regular dash with spaces)
            range_parts = re.split(r'\s*[–\-]\s*', time_range)
            if len(range_parts) == 2:
                start_decimal = parse_time_to_decimal(range_parts[0])
                end_decimal = parse_time_to_decimal(range_parts[1])

    meetings = []
    if start_decimal is not None and end_decimal is not None:
        for day in day_names:
            meetings.append({
                "day": day,
                "start": start_decimal,
                "end": end_decimal
            })

    # ── Location ──
    loc_el = item.select_one("[id$='TableCell2']")
    location = loc_el.get_text(strip=True) if loc_el else ""

    # ── Instructor ──
    instructor_el = item.select_one("[id$='TableCell4']")
    instructor_raw = instructor_el.get_text(strip=True) if instructor_el else "Staff"
    # Names come as "Last, First" — clean up
    instructor_raw = instructor_raw.split("\n")[0].strip()
    if "," in instructor_raw:
        last, first = instructor_raw.split(",", 1)
        instructor_name = f"{first.strip()} {last.strip()}"
    else:
        instructor_name = instructor_raw if instructor_raw else "Staff"

    # ── Instruction mode ──
    mode_el = item.select_one("[id$='TableCell10']")
    mode_text = mode_el.get_text(strip=True) if mode_el else ""
    instruction_mode = mode_text.split(",")[-1].strip() if "," in mode_text else mode_text

    # ── Build the section dict ──
    # Generate a stable ID from the class number
    section_id = f"{subject.lower()}{course_number}_{section_number}_{term_name.replace(' ', '')}".lower()

    return {
        "id": section_id,
        "classNumber": class_number,
        "code": course_code,
        "name": course_name,
        "subject": subject,
        "courseNumber": course_number,
        "section": section_number,
        "term": term_name,
        "component": component_label,
        "credits": int(units),
        "capacity": capacity,
        "instructor": instructor_name,
        "location": location,
        "instructionMode": instruction_mode,
        "meetings": meetings,
        # Derived fields the app uses
        "difficulty": guess_difficulty(course_number),
        "teachingStyles": [component_to_style(component_label)],
        # Placeholder — will be filled in by RMP scraper if you add it
        "rating": None,
    }


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

async def main(terms_to_scrape, components_to_scrape):
    all_sections = []

    async with async_playwright() as p:
        print("🚀 Launching browser...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("🌐 Navigating to schedule.cpp.edu...")
        await page.goto("https://schedule.cpp.edu/", timeout=60_000, wait_until="load")

        for term_name, term_value in terms_to_scrape.items():
            print(f"\n📅 Term: {term_name}")
            sections = await scrape_term(page, term_name, term_value, components_to_scrape)
            all_sections.extend(sections)
            print(f"   Total sections for {term_name}: {len(sections)}")

        await browser.close()

    # ── Build courses.json ──
    # Group sections by course code to get unique courses
    courses_by_code = {}
    for s in all_sections:
        code = s["code"]
        if code not in courses_by_code:
            courses_by_code[code] = {
                "code": code,
                "name": s["name"],
                "subject": s["subject"],
                "courseNumber": s["courseNumber"],
                "difficulty": s["difficulty"],
                "teachingStyles": set(s["teachingStyles"]),
                "sections": []
            }
        courses_by_code[code]["teachingStyles"].update(s["teachingStyles"])
        courses_by_code[code]["sections"].append(s)

    # Convert sets to lists for JSON serialization
    for course in courses_by_code.values():
        course["teachingStyles"] = list(course["teachingStyles"])

    # ── Build professors.json ──
    professors_by_name = {}
    for s in all_sections:
        name = s["instructor"]
        if name and name != "Staff" and name not in professors_by_name:
            professors_by_name[name] = {
                "name": name,
                "courses": set(),
                "rating": None,  # fill in from RMP if desired
            }
        if name in professors_by_name:
            professors_by_name[name]["courses"].add(s["code"])

    for prof in professors_by_name.values():
        prof["courses"] = list(prof["courses"])

    # ── Write output files ──
    courses_list = list(courses_by_code.values())
    professors_list = list(professors_by_name.values())
    sections_list = all_sections

    with open("courses.json", "w") as f:
        json.dump(courses_list, f, indent=2)
    print(f"\n✅ courses.json written — {len(courses_list)} unique courses")

    with open("professors.json", "w") as f:
        json.dump(professors_list, f, indent=2)
    print(f"✅ professors.json written — {len(professors_list)} professors")

    with open("sections.json", "w") as f:
        json.dump(sections_list, f, indent=2)
    print(f"✅ sections.json written — {len(sections_list)} total sections")

    print("\n📁 Copy courses.json, professors.json, and sections.json into your BroncoCompass/public/ folder.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape CPP class schedule")
    parser.add_argument(
        "--all-terms",
        action="store_true",
        help="Scrape all terms (slow). Default: current term only."
    )
    parser.add_argument(
        "--term",
        type=str,
        default=None,
        help=f'Scrape a specific term, e.g. --term "SP 2025"'
    )
    parser.add_argument(
        "--all-components",
        action="store_true",
        help="Scrape all component types. Default: Lecture + Lab only."
    )
    args = parser.parse_args()

    # Decide which terms to scrape
    if args.all_terms:
        terms_to_scrape = TERMS
    elif args.term:
        if args.term not in TERMS:
            print(f"❌ Unknown term '{args.term}'. Available: {list(TERMS.keys())}")
            exit(1)
        terms_to_scrape = {args.term: TERMS[args.term]}
    else:
        terms_to_scrape = {DEFAULT_TERM: TERMS[DEFAULT_TERM]}

    # Decide which components to scrape
    if args.all_components:
        components = list(COURSE_COMPONENTS.keys())
    else:
        components = COMPONENTS_TO_SCRAPE

    print(f"🎯 Scraping terms: {list(terms_to_scrape.keys())}")
    print(f"🎯 Components: {[COURSE_COMPONENTS[c] for c in components]}")
    print()

    asyncio.run(main(terms_to_scrape, components))
