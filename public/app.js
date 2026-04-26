// ============================================
// BroncoCompass - JavaScript Application
// Real CPP data loaded from courses/sections JSON
// ============================================

// ── Global State ──────────────────────────────
let ALL_SECTIONS = [];   // raw sections from sections.json
let ALL_COURSES = [];    // unique courses from courses.json
let COURSE_MAP = {};     // sectionId → section object (for schedule)
let COURSE_CODE_TO_SECTIONS = {}; // normalized courseCode -> [sections]

const CALENDAR_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const CALENDAR_START_HOUR = 8;

// Color palette for calendar events (cycles through these)
const EVENT_COLORS = [
  'color-1', 'color-2', 'color-3', 'color-4',
  'color-5', 'color-6', 'color-7', 'color-8'
];

const appState = {
  currentStep: 1,
  totalSteps: 3,
  userPreferences: {
    learningStyle: null,
    difficulty: null,
    schedule: []
  },
  currentScreen: 'onboarding',
  enrolledSections: [],      // array of section IDs the user added
  colorAssignments: {},      // sectionId → color class
  colorIndex: 0,
  currentModalSection: null, // the section currently shown in the modal
  displayedSections: [],     // sections currently shown in the search grid (after filter/sort)
  completedCourseCodes: [],  // normalized course codes from transcript
  requiredCourseCodes: [],   // normalized required course codes from roadmap
};

// ── Boot ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  showLoadingState();
  await loadData();
  hideLoadingState();

  initOnboarding();
  initNavigation();
  initSearch();
  initUploads();
  initModal();
  initSchedule();
  initCompare();
});

// ── Data Loading ──────────────────────────────
async function loadData() {
  try {
    const [sectionsRes, coursesRes] = await Promise.all([
      fetch('/sections.json'),
      fetch('/courses.json'),
    ]);
    ALL_SECTIONS = await sectionsRes.json();
    ALL_COURSES  = await coursesRes.json();

    // Build a quick lookup map by section id
    ALL_SECTIONS.forEach(s => { COURSE_MAP[s.id] = s; });
    buildCourseCodeIndex();

    console.log(`✅ Loaded ${ALL_SECTIONS.length} sections, ${ALL_COURSES.length} courses`);
  } catch (err) {
    console.error('Failed to load course data:', err);
    showToast('Could not load course data. Make sure courses.json and sections.json are in /public/');
  }
}

function buildCourseCodeIndex() {
  COURSE_CODE_TO_SECTIONS = {};
  ALL_SECTIONS.forEach(section => {
    const normalized = normalizeCourseCode(section.code);
    if (!normalized) return;
    if (!COURSE_CODE_TO_SECTIONS[normalized]) {
      COURSE_CODE_TO_SECTIONS[normalized] = [];
    }
    COURSE_CODE_TO_SECTIONS[normalized].push(section);
  });
}

function showLoadingState() {
  const grid = document.querySelector('.course-grid');
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#6b7280;">
        <div style="font-size:32px; margin-bottom:12px;">⏳</div>
        <div style="font-size:16px; font-weight:500;">Loading CPP courses...</div>
      </div>`;
  }
}

function hideLoadingState() {
  // Will be replaced by renderCourseGrid()
}

// ── Helpers ───────────────────────────────────
function formatTime(decimalHour) {
  const hours   = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  const period  = hours >= 12 ? 'PM' : 'AM';
  const display = ((hours + 11) % 12) + 1;
  const minPart = minutes === 0 ? '00' : String(minutes).padStart(2, '0');
  return `${display}:${minPart} ${period}`;
}

function getInitials(name) {
  if (!name || name === 'Staff') return 'ST';
  return name.split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

function getMeetingString(section) {
  if (!section.meetings || section.meetings.length === 0) return 'TBA';
  const dayAbbr = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };
  const days = [...new Set(section.meetings.map(m => dayAbbr[m.day] || m.day))];
  const first = section.meetings[0];
  return `${days.join('/')} ${formatTime(first.start)}–${formatTime(first.end)}`;
}

function getDifficultyLabel(diff) {
  const map = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  return map[diff] || 'Medium';
}

function getTeachingStyleLabel(styles) {
  if (!styles || styles.length === 0) return 'Lecture';
  return styles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
}

function normalizeCourseCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') return '';
  const cleaned = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = cleaned.match(/^([A-Z]{2,5})(\d{3,4}[A-Z]?)$/);
  if (!match) return '';
  return `${match[1]} ${match[2]}`;
}

function getSectionNormalizedCode(section) {
  return normalizeCourseCode(section?.code || '');
}

function assignColor(sectionId) {
  if (!appState.colorAssignments[sectionId]) {
    appState.colorAssignments[sectionId] = EVENT_COLORS[appState.colorIndex % EVENT_COLORS.length];
    appState.colorIndex++;
  }
  return appState.colorAssignments[sectionId];
}

// ── Fit Score ─────────────────────────────────
// Weighted algorithm: style(30) + difficulty(20) + time(20) + structure(20) + quality(10)
function calcFitScore(section) {
  if (!section) return 0;
  const prefs = appState.userPreferences;
  const meetings = section.meetings || [];
  const styles = section.teachingStyles || [];

  const styleComponent = getStyleComponent(styles, prefs);
  const difficultyComponent = getDifficultyComponent(section.difficulty, prefs);
  const timeComponent = getTimeComponent(meetings, prefs);
  const structureComponent = getSectionStructureComponent(section);
  const qualityComponent = getQualityComponent(section.rating);

  const total = styleComponent + difficultyComponent + timeComponent + structureComponent + qualityComponent;
  return Math.max(0, Math.min(99, Math.round(total)));
}

function getFitBadgeClass(score) {
  if (score >= 85) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

function getStyleComponent(sectionStyles, prefs) {
  if (!prefs.learningStyle) return 21; // 70% neutral if no preference yet
  const styleMap = {
    visual: ['lectures', 'discussion'],
    'hands-on': ['labs', 'projects', 'hands-on'],
    lecture: ['lectures'],
    reading: ['discussion', 'lectures']
  };
  const preferred = styleMap[prefs.learningStyle] || [];
  if (!preferred.length) return 21;
  const overlap = sectionStyles.filter(s => preferred.includes(s)).length;
  if (overlap >= 2) return 30;
  if (overlap === 1) return 22;
  return 8;
}

function getDifficultyComponent(sectionDifficulty, prefs) {
  if (!prefs.difficulty || !sectionDifficulty) return 14; // 70% neutral
  const rank = { easy: 1, medium: 2, hard: 3 };
  const prefMap = { easy: 'easy', balanced: 'medium', challenging: 'hard' };
  const desired = prefMap[prefs.difficulty];
  const distance = Math.abs((rank[sectionDifficulty] || 2) - (rank[desired] || 2));
  if (distance === 0) return 20;
  if (distance === 1) return 12;
  return 4;
}

function getTimeComponent(meetings, prefs) {
  if (!meetings.length) return 12;
  let score = 20;
  if (prefs.schedule.includes('no-mornings')) {
    const morningCount = meetings.filter(m => m.start < 10).length;
    score -= Math.min(8, morningCount * 2);
  }
  if (prefs.schedule.includes('no-fridays')) {
    const hasFriday = meetings.some(m => m.day === 'friday');
    if (hasFriday) score -= 6;
  }
  if (prefs.schedule.includes('breaks')) {
    const hasLunchBlock = meetings.some(m => m.start < 13 && m.end > 11);
    if (hasLunchBlock) score -= 4;
  }
  return Math.max(0, score);
}

function getSectionStructureComponent(section) {
  const meetings = section.meetings || [];
  if (!meetings.length) return 12;
  let score = 20;
  const dayCount = new Set(meetings.map(m => m.day)).size;
  if (appState.userPreferences.schedule.includes('fewer-days') && dayCount > 2) {
    score -= 4;
  }
  const conflict = checkConflict(section);
  if (conflict) {
    score -= 12;
  }
  return Math.max(0, score);
}

function getQualityComponent(rating) {
  if (typeof rating !== 'number' || Number.isNaN(rating)) {
    return 6; // neutral fallback when ratings are missing
  }
  const normalized = Math.max(0, Math.min(1, (rating - 1) / 4));
  return normalized * 10;
}

function getSectionFitBreakdown(section) {
  const prefs = appState.userPreferences;
  const meetings = section.meetings || [];
  const styles = section.teachingStyles || [];

  const components = [
    {
      key: 'style',
      title: 'Learning Style',
      score: getStyleComponent(styles, prefs),
      max: 30,
      detail: prefs.learningStyle
        ? `Preference: ${prefs.learningStyle}. Course styles: ${styles.join(', ') || 'not listed'}.`
        : 'No learning style selected yet, using neutral weight.'
    },
    {
      key: 'difficulty',
      title: 'Difficulty Match',
      score: getDifficultyComponent(section.difficulty, prefs),
      max: 20,
      detail: prefs.difficulty
        ? `Preferred: ${prefs.difficulty}. Course level: ${section.difficulty || 'unknown'}.`
        : 'No difficulty preference selected yet, using neutral weight.'
    },
    {
      key: 'time',
      title: 'Time Preferences',
      score: getTimeComponent(meetings, prefs),
      max: 20,
      detail: meetings.length
        ? `Meets ${getMeetingString(section)} and checked against your schedule constraints.`
        : 'No meeting time listed, so this category is neutral.'
    },
    {
      key: 'structure',
      title: 'Schedule Structure',
      score: getSectionStructureComponent(section),
      max: 20,
      detail: checkConflict(section)
        ? 'This section overlaps with something in your current schedule.'
        : 'No overlap with your current schedule.'
    },
    {
      key: 'quality',
      title: 'Instructor/Course Quality',
      score: getQualityComponent(section.rating),
      max: 10,
      detail: typeof section.rating === 'number'
        ? `Rating data: ${section.rating.toFixed(1)} / 5.0.`
        : 'No rating data found, using neutral fallback.'
    }
  ];

  const positives = [];
  const tradeoffs = [];

  components.forEach(component => {
    const rounded = Math.round(component.score);
    const item = {
      title: `${component.title}: ${rounded}/${component.max}`,
      desc: component.detail
    };
    if (component.score >= component.max * 0.75) {
      positives.push(item);
    } else {
      tradeoffs.push(item);
    }
  });

  if (!positives.length) {
    positives.push({
      title: 'Balanced Overall Fit',
      desc: 'No single dimension dominated, but the class can still be viable depending on your priorities.'
    });
  }
  if (!tradeoffs.length) {
    tradeoffs.push({
      title: 'No Major Trade-offs',
      desc: 'This class aligns well with your current preferences across all scoring dimensions.'
    });
  }

  return { positives, tradeoffs };
}

function calculateScheduleFit(sectionIds) {
  if (!sectionIds.length) return 0;
  const sections = sectionIds.map(id => COURSE_MAP[id]).filter(Boolean);
  if (!sections.length) return 0;

  const avgSectionFit = sections.reduce((sum, section) => sum + calcFitScore(section), 0) / sections.length;
  let schedulePenalty = 0;
  const conflictCount = getScheduleConflicts().length;
  schedulePenalty += Math.min(16, conflictCount * 8);
  schedulePenalty += Math.min(8, getExcessiveGapDays(sections) * 2);

  return Math.max(0, Math.min(99, Math.round(avgSectionFit - schedulePenalty)));
}

function getScheduleConflicts() {
  const conflicts = [];
  for (let i = 0; i < appState.enrolledSections.length; i += 1) {
    const first = COURSE_MAP[appState.enrolledSections[i]];
    if (!first) continue;
    for (let j = i + 1; j < appState.enrolledSections.length; j += 1) {
      const second = COURSE_MAP[appState.enrolledSections[j]];
      if (!second) continue;
      for (const fm of (first.meetings || [])) {
        for (const sm of (second.meetings || [])) {
          if (fm.day === sm.day && fm.start < sm.end && fm.end > sm.start) {
            conflicts.push([first.code, second.code]);
          }
        }
      }
    }
  }
  return conflicts;
}

function getExcessiveGapDays(sections) {
  const byDay = new Map();
  sections.forEach(section => {
    (section.meetings || []).forEach(meeting => {
      if (!byDay.has(meeting.day)) byDay.set(meeting.day, []);
      byDay.get(meeting.day).push([meeting.start, meeting.end]);
    });
  });

  let daysWithLargeGap = 0;
  byDay.forEach(ranges => {
    ranges.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < ranges.length; i += 1) {
      const gap = ranges[i][0] - ranges[i - 1][1];
      if (gap > 2) {
        daysWithLargeGap += 1;
        break;
      }
    }
  });
  return daysWithLargeGap;
}

// ── Course Card HTML ──────────────────────────
function buildCourseCard(section) {
  const fit      = calcFitScore(section);
  const badgeCls = getFitBadgeClass(fit);
  const initials = getInitials(section.instructor);
  const meeting  = getMeetingString(section);
  const styles   = getTeachingStyleLabel(section.teachingStyles);
  const diff     = getDifficultyLabel(section.difficulty);
  const colorCls = assignColor(section.id);
  const normalizedCode = getSectionNormalizedCode(section);
  const isCompleted = appState.completedCourseCodes.includes(normalizedCode);
  const isRequired = appState.requiredCourseCodes.includes(normalizedCode);
  const isRemaining = isRequired && !isCompleted;

  return `
    <article class="course-card" data-section-id="${section.id}">
      <div class="course-card-header">
        <div class="fit-badge ${badgeCls}">
          <span class="fit-score">${fit}%</span>
          <span class="fit-label">Fit</span>
        </div>
        <button class="bookmark-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
      <div class="course-card-body">
        <span class="course-code">${section.code}</span>
        <h3 class="course-title">${section.name}</h3>
        <div class="course-professor">
          <div class="professor-avatar ${colorCls}" style="background:var(--color-${colorCls.split('-')[1]}, #6366f1); color:white; font-size:11px; display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; flex-shrink:0;">${initials}</div>
          <span>${section.instructor || 'Staff'}</span>
        </div>
        <div class="course-meta">
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>${meeting}</span>
          </div>
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>${diff}</span>
          </div>
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>${section.credits || 3} credits</span>
          </div>
        </div>
        <div class="course-status-row">
          ${isCompleted ? '<span class="status-badge completed">Completed</span>' : ''}
          ${isRequired ? '<span class="status-badge required">Required</span>' : ''}
          ${isRemaining ? '<span class="status-badge remaining">Remaining</span>' : ''}
        </div>
        <div class="course-tags">
          <span class="tag">${section.component || 'Lecture'}</span>
          <span class="tag">${styles}</span>
          ${section.location ? `<span class="tag">${section.location}</span>` : ''}
        </div>
      </div>
      <div class="course-card-footer">
        <button class="btn btn-secondary btn-sm view-details-btn">View Details</button>
        <button class="btn btn-primary btn-sm add-schedule-btn">Add to Schedule</button>
      </div>
    </article>`;
}

// ── Search & Filter ───────────────────────────
function initSearch() {
  const searchInput  = document.getElementById('searchInput');
  const filterToggle = document.getElementById('filterToggle');
  const filtersPanel = document.getElementById('filtersPanel');
  const filterChips  = document.querySelectorAll('.filter-chip');
  const sortSelect   = document.querySelector('.sort-select');

  filterToggle.addEventListener('click', () => {
    filtersPanel.classList.toggle('open');
  });

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.closest('.filter-options');
      group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderCourseGrid();
    });
  });

  searchInput.addEventListener('input', debounce(renderCourseGrid, 300));
  if (sortSelect) sortSelect.addEventListener('change', renderCourseGrid);

  renderCourseGrid();
}

function initUploads() {
  const transcriptInput = document.getElementById('transcriptUpload');
  const roadmapInput = document.getElementById('roadmapUpload');
  const requiredOnly = document.getElementById('filterRequiredOnly');
  const remainingOnly = document.getElementById('filterRemainingOnly');

  if (transcriptInput) {
    transcriptInput.addEventListener('change', async () => {
      const file = transcriptInput.files?.[0];
      if (!file) return;
      const text = await readUploadFileAsText(file);
      if (!text) {
        const statusEl = document.getElementById('transcriptStatus');
        if (statusEl) statusEl.textContent = 'Could not parse file. Try CSV/TXT or a text-based PDF.';
        return;
      }
      const { matchedCodes, unmatchedRows } = extractCourseCodesFromUpload(text);
      appState.completedCourseCodes = Array.from(new Set(matchedCodes));
      const statusEl = document.getElementById('transcriptStatus');
      if (statusEl) {
        statusEl.textContent = `Loaded ${appState.completedCourseCodes.length} completed courses` +
          (unmatchedRows.length ? ` (${unmatchedRows.length} unmatched)` : '');
      }
      updateRequirementProgressStatus();
      renderCourseGrid();
      updateAddButtonsState();
    });
  }

  if (roadmapInput) {
    roadmapInput.addEventListener('change', async () => {
      const file = roadmapInput.files?.[0];
      if (!file) return;
      const text = await readUploadFileAsText(file);
      if (!text) {
        const statusEl = document.getElementById('roadmapStatus');
        if (statusEl) statusEl.textContent = 'Could not parse file. Try CSV/TXT or a text-based PDF.';
        return;
      }
      const { matchedCodes, unmatchedRows } = extractCourseCodesFromUpload(text);
      appState.requiredCourseCodes = Array.from(new Set(matchedCodes));
      const statusEl = document.getElementById('roadmapStatus');
      if (statusEl) {
        statusEl.textContent = `Loaded ${appState.requiredCourseCodes.length} required courses` +
          (unmatchedRows.length ? ` (${unmatchedRows.length} unmatched)` : '');
      }
      updateRequirementProgressStatus();
      renderCourseGrid();
    });
  }

  if (requiredOnly) {
    requiredOnly.addEventListener('change', () => {
      if (requiredOnly.checked && remainingOnly?.checked) remainingOnly.checked = false;
      renderCourseGrid();
    });
  }

  if (remainingOnly) {
    remainingOnly.addEventListener('change', () => {
      if (remainingOnly.checked && requiredOnly?.checked) requiredOnly.checked = false;
      renderCourseGrid();
    });
  }

  updateRequirementProgressStatus();
}

function extractCourseCodesFromUpload(text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const matchedCodes = [];
  const unmatchedRows = [];
  const codeRegex = /\b([A-Za-z]{2,5})\s*[- ]?\s*(\d{3,4}[A-Za-z]?)\b/g;

  lines.forEach(line => {
    codeRegex.lastIndex = 0;
    let found = false;
    let match;
    while ((match = codeRegex.exec(line)) !== null) {
      const normalized = normalizeCourseCode(`${match[1]} ${match[2]}`);
      if (!normalized) continue;
      if (COURSE_CODE_TO_SECTIONS[normalized]) {
        matchedCodes.push(normalized);
        found = true;
      }
    }
    if (!found) unmatchedRows.push(line);
  });

  return { matchedCodes, unmatchedRows };
}

async function readUploadFileAsText(file) {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  const isPdf = name.endsWith('.pdf') || type === 'application/pdf';
  if (isPdf) {
    return extractTextFromPdf(file);
  }
  return file.text();
}

async function extractTextFromPdf(file) {
  if (!window.pdfjsLib) {
    showToast('PDF parser failed to load. Please upload CSV/TXT.');
    return '';
  }
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({
      data: buffer,
      disableWorker: true,
      useWorkerFetch: false
    }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map(item => item.str || '')
        .join(' ');
      pages.push(pageText);
    }
    return pages.join('\n');
  } catch (error) {
    console.error('Failed to parse PDF:', error);
    try {
      // Fallback for some text-based PDFs where parsing libraries fail:
      // decode bytes and recover readable strings.
      const raw = new TextDecoder('latin1').decode(await file.arrayBuffer());
      const recovered = raw.replace(/[^\x20-\x7E\n\r]/g, ' ');
      if (recovered.trim().length > 0) {
        showToast('Used fallback PDF text recovery.');
        return recovered;
      }
    } catch (fallbackError) {
      console.error('Fallback PDF recovery failed:', fallbackError);
    }
    showToast('Could not read PDF. Try export transcript to CSV as fallback.');
    return '';
  }
}

function updateRequirementProgressStatus() {
  const remaining = appState.requiredCourseCodes.filter(code => !appState.completedCourseCodes.includes(code)).length;
  const statusEl = document.getElementById('progressStatus');
  if (statusEl) {
    statusEl.textContent = `Remaining required: ${remaining}`;
  }
}

function getActiveFilter(groupLabel) {
  const groups = Array.from(document.querySelectorAll('.filter-group'));
  const group  = groups.find(g => {
    const label = g.querySelector('label');
    return label && label.textContent.trim().toLowerCase() === groupLabel;
  });
  if (!group) return null;
  const active = group.querySelector('.filter-chip.active');
  if (!active) return null;
  const value = active.textContent.trim().toLowerCase();
  return value === 'all' ? null : value;
}

function getSortMode() {
  const sel = document.querySelector('.sort-select');
  if (!sel) return 'best-fit';
  const v = sel.value.toLowerCase();
  if (v.includes('rating'))     return 'rating';
  if (v.includes('difficulty')) return 'difficulty';
  return 'best-fit';
}

function renderCourseGrid() {
  const grid       = document.querySelector('.course-grid');
  const countEl    = document.querySelector('.results-count');
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const diffFilter = getActiveFilter('difficulty');
  const styleFilter= getActiveFilter('teaching style');
  const sortMode   = getSortMode();
  const requiredOnly = document.getElementById('filterRequiredOnly')?.checked;
  const remainingOnly = document.getElementById('filterRemainingOnly')?.checked;

  if (!ALL_SECTIONS.length) return;

  // Filter
  let filtered = ALL_SECTIONS.filter(s => {
    // Search term
    if (searchTerm) {
      const haystack = [s.code, s.name, s.instructor, s.subject, ...(s.teachingStyles || [])].join(' ').toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }
    // Difficulty
    if (diffFilter && s.difficulty !== diffFilter) return false;
    // Teaching style
    if (styleFilter) {
      const map = { lectures: 'lectures', projects: 'projects', discussion: 'discussion', labs: 'labs' };
      const want = map[styleFilter];
      if (want && !(s.teachingStyles || []).includes(want)) return false;
    }
    const normalizedCode = getSectionNormalizedCode(s);
    const isRequired = appState.requiredCourseCodes.includes(normalizedCode);
    const isCompleted = appState.completedCourseCodes.includes(normalizedCode);
    if (requiredOnly && !isRequired) return false;
    if (remainingOnly && (!isRequired || isCompleted)) return false;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sortMode === 'rating') {
      const aRating = typeof a.rating === 'number' ? a.rating : -1;
      const bRating = typeof b.rating === 'number' ? b.rating : -1;
      return bRating - aRating;
    }
    if (sortMode === 'difficulty') {
      const rank = { easy: 1, medium: 2, hard: 3 };
      return (rank[a.difficulty] || 2) - (rank[b.difficulty] || 2);
    }
    // default: best fit
    return calcFitScore(b) - calcFitScore(a);
  });

  // Limit to 50 results for performance
  const shown = filtered.slice(0, 50);
  appState.displayedSections = shown;

  // Render
  grid.innerHTML = shown.length
    ? shown.map(buildCourseCard).join('')
    : `<div style="grid-column:1/-1; text-align:center; padding:60px; color:#6b7280;">
         <div style="font-size:32px;">🔍</div>
         <div>No courses found. Try a different search.</div>
       </div>`;

  countEl.textContent = `${filtered.length} sections found`;

  // Update add buttons for already-enrolled sections
  updateAddButtonsState();

  // Attach card event listeners
  grid.querySelectorAll('.course-card').forEach(card => {
    const sectionId = card.dataset.sectionId;

    card.querySelector('.view-details-btn').addEventListener('click', e => {
      e.stopPropagation();
      openCourseModal(sectionId);
    });

    card.querySelector('.add-schedule-btn').addEventListener('click', e => {
      e.stopPropagation();
      addSectionToSchedule(sectionId);
    });

    card.querySelector('.bookmark-btn').addEventListener('click', e => {
      e.stopPropagation();
      const btn = e.currentTarget;
      btn.classList.toggle('bookmarked');
      const svg = btn.querySelector('svg');
      svg.setAttribute('fill', btn.classList.contains('bookmarked') ? 'currentColor' : 'none');
      showToast(btn.classList.contains('bookmarked') ? 'Course saved!' : 'Course removed from bookmarks');
    });

    card.addEventListener('click', () => openCourseModal(sectionId));
  });
}

// ── Modal ─────────────────────────────────────
function initModal() {
  const modal    = document.getElementById('courseModal');
  const closeBtn = document.getElementById('closeModal');

  closeBtn.addEventListener('click', closeCourseModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeCourseModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeCourseModal();
  });

  modal.querySelector('.detail-actions .btn-primary').addEventListener('click', () => {
    if (appState.currentModalSection) {
      addSectionToSchedule(appState.currentModalSection.id);
    }
    closeCourseModal();
  });

  modal.querySelector('.detail-actions .btn-secondary').addEventListener('click', () => {
    showToast('Course saved to bookmarks');
  });
}

function openCourseModal(sectionId) {
  const section = COURSE_MAP[sectionId];
  if (!section) return;
  appState.currentModalSection = section;

  const fit      = calcFitScore(section);
  const meeting  = getMeetingString(section);
  const initials = getInitials(section.instructor);
  const breakdown = getSectionFitBreakdown(section);

  // Fill in modal fields
  document.querySelector('.modal .detail-info .course-code').textContent = section.code;
  document.querySelector('.modal .detail-info h2').textContent            = section.name;
  document.querySelector('.modal .professor-name').textContent            = section.instructor || 'Staff';
  document.querySelector('.modal .professor-dept').textContent            = section.subject + ' Department';
  document.querySelector('.modal .detail-professor .professor-avatar').textContent = initials;
  document.querySelector('.modal .fit-number').textContent               = fit + '%';

  // Meta cards
  const metaCards = document.querySelectorAll('.modal .meta-card');
  if (metaCards[0]) metaCards[0].querySelector('.meta-value').textContent = meeting;
  if (metaCards[1]) metaCards[1].querySelector('.meta-value').textContent = section.location || 'TBA';
  if (metaCards[2]) metaCards[2].querySelector('.meta-value').textContent = `${section.credits || 3} Credits`;
  if (metaCards[3]) metaCards[3].querySelector('.meta-value').textContent = `${section.capacity || '?'} seats`;

  // Tags
  const tagsEl = document.querySelector('.modal .detail-tags');
  if (tagsEl) {
    tagsEl.innerHTML = [
      section.component,
      getDifficultyLabel(section.difficulty),
      ...(section.teachingStyles || []).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      section.instructionMode,
    ].filter(Boolean).map(t => `<span class="tag large">${t}</span>`).join('');
  }

  const detailSections = document.querySelectorAll('.modal .detail-grid .detail-section');
  const positiveEl = detailSections[0]?.querySelector('.fit-breakdown');
  const tradeoffEl = detailSections[1]?.querySelector('.fit-breakdown');
  if (positiveEl) {
    positiveEl.innerHTML = breakdown.positives.map(item => renderBreakdownItem(item, 'match')).join('');
  }
  if (tradeoffEl) {
    tradeoffEl.innerHTML = breakdown.tradeoffs.map(item => renderBreakdownItem(item, 'tradeoff')).join('');
  }

  // Fit ring
  const ringFill = document.querySelector('.modal .fit-ring-fill');
  if (ringFill) {
    const circumference = 339.292;
    const offset = circumference - (fit / 100) * circumference;
    ringFill.setAttribute('stroke-dashoffset', offset.toString());
  }

  document.getElementById('courseModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderBreakdownItem(item, type) {
  const icon = type === 'match'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
         <polyline points="22 4 12 14.01 9 11.01"/>
       </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="10"/>
         <line x1="12" y1="8" x2="12" y2="12"/>
         <line x1="12" y1="16" x2="12.01" y2="16"/>
       </svg>`;
  return `
    <div class="fit-item ${type}">
      ${icon}
      <div class="fit-item-content">
        <span class="fit-item-title">${item.title}</span>
        <span class="fit-item-desc">${item.desc}</span>
      </div>
    </div>
  `;
}

function closeCourseModal() {
  document.getElementById('courseModal').classList.remove('open');
  document.body.style.overflow = '';
  appState.currentModalSection = null;
}

// ── Schedule ──────────────────────────────────
function initSchedule() {
  document.querySelector('.enrolled-list').addEventListener('click', e => {
    const btn = e.target.closest('.remove-course');
    if (!btn) return;
    const item = btn.closest('.enrolled-item');
    if (item) removeSectionFromSchedule(item.dataset.sectionId);
  });

  document.querySelector('.calendar-body').addEventListener('click', e => {
    const event = e.target.closest('.calendar-event');
    if (event && event.dataset.sectionId) openCourseModal(event.dataset.sectionId);
  });

  renderSchedule();
}

function addSectionToSchedule(sectionId) {
  const section = COURSE_MAP[sectionId];
  if (!section) return;
  const normalizedCode = getSectionNormalizedCode(section);
  if (appState.completedCourseCodes.includes(normalizedCode)) {
    showToast(`${section.code} is already completed (from transcript).`);
    return;
  }

  if (appState.enrolledSections.includes(sectionId)) {
    showToast(`${section.code} is already in your schedule`);
    return;
  }

  // Check for time conflicts
  const conflict = checkConflict(section);
  if (conflict) {
    showToast(`⚠️ Time conflict with ${conflict.code}!`);
    return;
  }

  appState.enrolledSections.push(sectionId);
  assignColor(sectionId);
  renderSchedule();
  updateAddButtonsState();
  showToast(`${section.code} added to your schedule!`);
}

function removeSectionFromSchedule(sectionId) {
  const idx = appState.enrolledSections.indexOf(sectionId);
  if (idx === -1) return;
  const section = COURSE_MAP[sectionId];
  appState.enrolledSections.splice(idx, 1);
  renderSchedule();
  updateAddButtonsState();
  showToast(`${section?.code || 'Course'} removed from schedule`);
}

function checkConflict(newSection) {
  for (const enrolledId of appState.enrolledSections) {
    const enrolled = COURSE_MAP[enrolledId];
    if (!enrolled) continue;
    for (const nm of newSection.meetings) {
      for (const em of enrolled.meetings) {
        if (nm.day === em.day && nm.start < em.end && nm.end > em.start) {
          return enrolled;
        }
      }
    }
  }
  return null;
}

function renderSchedule() {
  renderEnrolledList();
  renderCalendar();
  updateScheduleStats();
}

function renderEnrolledList() {
  const list = document.querySelector('.enrolled-list');
  if (!appState.enrolledSections.length) {
    list.innerHTML = `<p style="color:#9ca3af; text-align:center; padding:20px;">No courses added yet. Search and add courses!</p>`;
    return;
  }
  list.innerHTML = appState.enrolledSections.map(id => {
    const s = COURSE_MAP[id];
    if (!s) return '';
    const colorCls = appState.colorAssignments[id] || 'color-1';
    return `
      <div class="enrolled-item" data-section-id="${id}">
        <div class="enrolled-color" style="background:var(--${colorCls}-color, #6366f1);"></div>
        <div class="enrolled-info">
          <span class="enrolled-code">${s.code}</span>
          <span class="enrolled-name">${s.name}</span>
        </div>
        <span class="enrolled-credits">${s.credits || 3} cr</span>
        <button class="btn btn-icon btn-sm remove-course">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>`;
  }).join('');
}

function renderCalendar() {
  const dayColumns = document.querySelectorAll('.calendar-body .day-column');
  dayColumns.forEach(col => col.innerHTML = '');

  const colorStyles = [
    '#6366f1','#8b5cf6','#ec4899','#f59e0b',
    '#10b981','#3b82f6','#ef4444','#14b8a6'
  ];

  appState.enrolledSections.forEach(id => {
    const section = COURSE_MAP[id];
    if (!section || !section.meetings) return;

    const colorIdx = EVENT_COLORS.indexOf(appState.colorAssignments[id] || 'color-1');
    const bgColor  = colorStyles[colorIdx % colorStyles.length] || '#6366f1';

    section.meetings.forEach(meeting => {
      const dayIndex = CALENDAR_DAYS.indexOf(meeting.day);
      if (dayIndex === -1) return;

      const col       = dayColumns[dayIndex];
      const startOff  = meeting.start - CALENDAR_START_HOUR;
      const duration  = meeting.end - meeting.start;
      const event     = document.createElement('div');
      event.className = 'calendar-event';
      event.dataset.sectionId = id;
      event.style.setProperty('--start',    String(startOff));
      event.style.setProperty('--duration', String(duration));
      event.style.background = bgColor;
      event.innerHTML = `
        <span class="event-title">${section.code}</span>
        <span class="event-time">${formatTime(meeting.start)}–${formatTime(meeting.end)}</span>`;
      col.appendChild(event);
    });
  });
}

function updateScheduleStats() {
  const totalCredits = appState.enrolledSections.reduce((sum, id) => {
    return sum + (COURSE_MAP[id]?.credits || 0);
  }, 0);

  const daySet = new Set();
  appState.enrolledSections.forEach(id => {
    (COURSE_MAP[id]?.meetings || []).forEach(m => daySet.add(m.day));
  });

  const statCards = document.querySelectorAll('.stat-card');
  if (statCards[0]) statCards[0].querySelector('.stat-value').textContent = totalCredits;
  if (statCards[1]) statCards[1].querySelector('.stat-value').textContent = appState.enrolledSections.length;
  if (statCards[2]) statCards[2].querySelector('.stat-value').textContent = daySet.size;
  if (statCards[3]) statCards[3].querySelector('.stat-value').textContent = getScheduleConflicts().length;

  const scheduleFit = calculateScheduleFit(appState.enrolledSections);
  const fitNumEl = document.querySelector('.schedule-fit .fit-number');
  const fitTagEl = document.querySelector('.schedule-fit-tag');
  const fitRingEl = document.querySelector('.schedule-fit .fit-ring-fill');

  if (fitNumEl) fitNumEl.textContent = `${scheduleFit}%`;
  if (fitTagEl) {
    fitTagEl.classList.remove('balanced', 'light', 'intense');
    if (scheduleFit >= 85) {
      fitTagEl.classList.add('balanced');
      fitTagEl.textContent = 'Strong Fit';
    } else if (scheduleFit >= 70) {
      fitTagEl.classList.add('light');
      fitTagEl.textContent = 'Good Fit';
    } else {
      fitTagEl.classList.add('intense');
      fitTagEl.textContent = 'Needs Tuning';
    }
  }
  if (fitRingEl) {
    const circumference = 226.195;
    const offset = circumference - (scheduleFit / 100) * circumference;
    fitRingEl.setAttribute('stroke-dashoffset', offset.toString());
  }
}

function updateAddButtonsState() {
  document.querySelectorAll('.course-card').forEach(card => {
    const sectionId = card.dataset.sectionId;
    const addBtn    = card.querySelector('.add-schedule-btn');
    if (!addBtn) return;
    const isAdded = appState.enrolledSections.includes(sectionId);
    const section = COURSE_MAP[sectionId];
    const isCompleted = appState.completedCourseCodes.includes(getSectionNormalizedCode(section));
    if (isCompleted) {
      addBtn.textContent = 'Completed';
      addBtn.disabled = true;
      return;
    }
    addBtn.textContent = isAdded ? 'Added ✓' : 'Add to Schedule';
    addBtn.disabled = isAdded;
  });
}

// ── Onboarding ────────────────────────────────
function initOnboarding() {
  const prevBtn    = document.getElementById('prevStep');
  const nextBtn    = document.getElementById('nextStep');
  const optionCards= document.querySelectorAll('.step-content[data-step="1"] .option-card, .step-content[data-step="2"] .option-card');

  optionCards.forEach(card => {
    card.addEventListener('click', () => {
      const stepContent = card.closest('.step-content');
      const step        = parseInt(stepContent.dataset.step);
      stepContent.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      if (step === 1) appState.userPreferences.learningStyle = card.dataset.value;
      if (step === 2) appState.userPreferences.difficulty    = card.dataset.value;
    });
  });

  document.querySelectorAll('.checkbox-card input').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        appState.userPreferences.schedule.push(cb.value);
      } else {
        appState.userPreferences.schedule = appState.userPreferences.schedule.filter(v => v !== cb.value);
      }
    });
  });

  prevBtn.addEventListener('click', () => {
    if (appState.currentStep > 1) { appState.currentStep--; updateOnboardingUI(); }
  });

  nextBtn.addEventListener('click', () => {
    if (appState.currentStep < appState.totalSteps) {
      appState.currentStep++;
      updateOnboardingUI();
    } else {
      completeOnboarding();
    }
  });
}

function updateOnboardingUI() {
  const { currentStep, totalSteps } = appState;
  const prevBtn = document.getElementById('prevStep');
  const nextBtn = document.getElementById('nextStep');

  document.querySelectorAll('.step-indicator .step').forEach((step, i) => {
    const n = i + 1;
    step.classList.remove('active', 'completed');
    if (n === currentStep) step.classList.add('active');
    else if (n < currentStep) step.classList.add('completed');
  });

  document.querySelectorAll('.step-content').forEach(content => {
    content.classList.toggle('active', parseInt(content.dataset.step) === currentStep);
  });

  prevBtn.disabled    = currentStep === 1;
  nextBtn.textContent = currentStep === totalSteps ? 'Get Started' : 'Continue';
}

function completeOnboarding() {
  document.getElementById('onboarding').classList.remove('active');
  document.getElementById('navbar').classList.add('visible');
  document.getElementById('search').classList.add('active');
  document.querySelector('.nav-link[data-screen="search"]').classList.add('active');
  appState.currentScreen = 'search';
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  // Re-render with preferences now set
  renderCourseGrid();
  showToast('Welcome! Your personalized CPP course recommendations are ready.');
}

// ── Navigation ────────────────────────────────
function initNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navigateTo(link.dataset.screen));
  });
}

function navigateTo(screenId) {
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.screen === screenId);
  });
  document.querySelectorAll('.screen:not(.onboarding-screen)').forEach(s => {
    s.classList.toggle('active', s.id === screenId);
  });
  appState.currentScreen = screenId;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

// ── Compare ───────────────────────────────────
function initCompare() {
  const applyBtn  = document.querySelector('.compare-actions .btn-primary');
  const createBtn = document.querySelector('.compare-actions .btn-secondary');
  if (applyBtn)  applyBtn.addEventListener('click', () => { showToast('Schedule applied!'); navigateTo('schedule'); });
  if (createBtn) createBtn.addEventListener('click', () => { showToast('Starting new schedule...'); navigateTo('search'); });
}

// ── Toast ─────────────────────────────────────
function showToast(message) {
  document.querySelector('.toast')?.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>`;

  toast.style.cssText = `
    position:fixed; bottom:24px; left:50%;
    transform:translateX(-50%) translateY(100px);
    background:#1f2937; color:white; padding:12px 20px;
    border-radius:12px; display:flex; align-items:center; gap:12px;
    box-shadow:0 10px 25px rgba(0,0,0,.2); z-index:2000; font-size:14px;
    animation:slideUp .3s ease forwards;`;

  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideUp { to { transform:translateX(-50%) translateY(0); } }
      @keyframes slideDown { to { transform:translateX(-50%) translateY(100px); } }
      .toast-close { background:none; border:none; color:white; cursor:pointer; opacity:.7; padding:4px; display:flex; }
      .toast-close:hover { opacity:1; }
      .toast-close svg { width:16px; height:16px; }`;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  toast.querySelector('.toast-close').addEventListener('click', () => hideToast(toast));
  setTimeout(() => hideToast(toast), 3000);
}

function hideToast(toast) {
  toast.style.animation = 'slideDown .3s ease forwards';
  setTimeout(() => toast.remove(), 300);
}

// ── Utilities ─────────────────────────────────
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
