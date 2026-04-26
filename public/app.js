// ============================================
// BroncoCompass - JavaScript Application
// Real CPP data loaded from courses/sections JSON
// ============================================

<<<<<<< Updated upstream
// ── Global State ──────────────────────────────
let ALL_SECTIONS = [];   // raw sections from sections.json
let ALL_COURSES = [];    // unique courses from courses.json
let COURSE_MAP = {};     // sectionId → section object (for schedule)
=======
const COURSE_DATA = {
  cs101: {
    code: 'CS 101',
    name: 'Intro to Computer Science',
    title: 'Introduction to Computer Science',
    professor: 'Dr. Sarah Kim',
    department: 'Computer Science Department',
    seats: '12 / 30 Available',
    credits: 3,
    rating: 4.8,
    difficulty: 'medium',
    teachingStyles: ['lectures', 'projects'],
    meetings: [
      { day: 'monday', start: 9, end: 10.25 },
      { day: 'wednesday', start: 9, end: 10.25 },
      { day: 'friday', start: 9, end: 10.25 }
    ]
  },
  math201: {
    code: 'MATH 201',
    name: 'Linear Algebra',
    title: 'Linear Algebra',
    professor: 'Prof. James Park',
    department: 'Mathematics Department',
    seats: '8 / 30 Available',
    credits: 4,
    rating: 4.5,
    difficulty: 'hard',
    teachingStyles: ['lectures'],
    meetings: [
      { day: 'tuesday', start: 10, end: 11.5 },
      { day: 'thursday', start: 10, end: 11.5 }
    ]
  },
  psych100: {
    code: 'PSYCH 100',
    name: 'Intro to Psychology',
    title: 'Introduction to Psychology',
    professor: 'Dr. Maya Lopez',
    department: 'Psychology Department',
    seats: '10 / 30 Available',
    credits: 3,
    rating: 4.9,
    difficulty: 'easy',
    teachingStyles: ['discussion', 'lectures'],
    meetings: [
      { day: 'tuesday', start: 13, end: 14.25 },
      { day: 'thursday', start: 13, end: 14.25 }
    ]
  },
  bio150: {
    code: 'BIO 150',
    name: 'Cell Biology Lab',
    title: 'Cell Biology Lab',
    professor: 'Dr. Rachel Chen',
    department: 'Biology Department',
    seats: '6 / 24 Available',
    credits: 4,
    rating: 4.6,
    difficulty: 'medium',
    teachingStyles: ['labs', 'projects'],
    meetings: [
      { day: 'monday', start: 12, end: 14 },
      { day: 'wednesday', start: 12, end: 14 }
    ]
  },
  eng202: {
    code: 'ENG 202',
    name: 'Creative Writing',
    title: 'Creative Writing Workshop',
    professor: 'Prof. Tom Bradley',
    department: 'English Department',
    seats: '9 / 25 Available',
    credits: 3,
    rating: 4.2,
    difficulty: 'medium',
    teachingStyles: ['discussion'],
    meetings: [{ day: 'thursday', start: 15, end: 16.5 }]
  },
  phys101: {
    code: 'PHYS 101',
    name: 'Physics for Engineers',
    title: 'Physics for Engineers',
    professor: 'Dr. Alex Wong',
    department: 'Physics Department',
    seats: '7 / 30 Available',
    credits: 4,
    rating: 4.3,
    difficulty: 'hard',
    teachingStyles: ['lectures', 'labs'],
    meetings: [
      { day: 'tuesday', start: 15, end: 16.5 },
      { day: 'thursday', start: 15, end: 16.5 }
    ]
  }
};
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
  enrolledSections: [],      // array of section IDs the user added
  colorAssignments: {},      // sectionId → color class
  colorIndex: 0,
  currentModalSection: null, // the section currently shown in the modal
  displayedSections: [],     // sections currently shown in the search grid (after filter/sort)
=======
  enrolledCourses: ['cs101', 'math201', 'psych100', 'bio150', 'eng202'],
  activeModalCourse: null
>>>>>>> Stashed changes
};

// ── Boot ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  showLoadingState();
  await loadData();
  hideLoadingState();

  initOnboarding();
  initNavigation();
  initSearch();
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

    console.log(`✅ Loaded ${ALL_SECTIONS.length} sections, ${ALL_COURSES.length} courses`);
  } catch (err) {
    console.error('Failed to load course data:', err);
    showToast('Could not load course data. Make sure courses.json and sections.json are in /public/');
  }
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
  const days = [...new Set(section.meetings.map(m => m.day.slice(0, 3).replace('wed','Wed').replace('thu','Thu')))];
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

function assignColor(sectionId) {
  if (!appState.colorAssignments[sectionId]) {
    appState.colorAssignments[sectionId] = EVENT_COLORS[appState.colorIndex % EVENT_COLORS.length];
    appState.colorIndex++;
  }
  return appState.colorAssignments[sectionId];
}

// ── Fit Score ─────────────────────────────────
// Simple algorithm: compare user prefs against section attributes
function calcFitScore(section) {
  let score = 60; // base
  const prefs = appState.userPreferences;

  // Learning style match
  if (prefs.learningStyle) {
    const styleMap = {
      'visual':    ['lectures'],
      'hands-on':  ['labs', 'hands-on'],
      'lecture':   ['lectures'],
      'reading':   ['discussion'],
    };
    const preferred = styleMap[prefs.learningStyle] || [];
    const sectionStyles = section.teachingStyles || [];
    if (preferred.some(p => sectionStyles.includes(p))) score += 20;
  }

  // Difficulty match
  if (prefs.difficulty) {
    const diffMap = { easy: 'easy', balanced: 'medium', challenging: 'hard' };
    if (section.difficulty === diffMap[prefs.difficulty]) score += 15;
  }

  // Schedule preferences
  if (prefs.schedule.includes('no-mornings')) {
    const hasMorning = section.meetings.some(m => m.start < 10);
    if (!hasMorning) score += 5;
  }
  if (prefs.schedule.includes('no-fridays')) {
    const hasFriday = section.meetings.some(m => m.day === 'friday');
    if (!hasFriday) score += 5;
  }
  if (prefs.schedule.includes('fewer-days')) {
    const uniqueDays = new Set(section.meetings.map(m => m.day)).size;
    if (uniqueDays <= 2) score += 5;
  }

  return Math.min(score, 99);
}

function getFitBadgeClass(score) {
  if (score >= 85) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
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
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
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
}

function updateAddButtonsState() {
  document.querySelectorAll('.course-card').forEach(card => {
    const sectionId = card.dataset.sectionId;
    const addBtn    = card.querySelector('.add-schedule-btn');
    if (!addBtn) return;
    const isAdded = appState.enrolledSections.includes(sectionId);
    addBtn.textContent = isAdded ? 'Added ✓' : 'Add to Schedule';
    addBtn.disabled    = isAdded;
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
}

<<<<<<< Updated upstream
// ── Compare ───────────────────────────────────
function initCompare() {
  const applyBtn  = document.querySelector('.compare-actions .btn-primary');
  const createBtn = document.querySelector('.compare-actions .btn-secondary');
  if (applyBtn)  applyBtn.addEventListener('click', () => { showToast('Schedule applied!'); navigateTo('schedule'); });
  if (createBtn) createBtn.addEventListener('click', () => { showToast('Starting new schedule...'); navigateTo('search'); });
=======
// ============================================
// Search & Filters
// ============================================

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const filterToggle = document.getElementById('filterToggle');
  const filtersPanel = document.getElementById('filtersPanel');
  const sortSelect = document.querySelector('.sort-select');
  ensureAllChipForTeachingStyle();
  const filterChips = document.querySelectorAll('.filter-chip');
  
  // Filter toggle
  filterToggle.addEventListener('click', () => {
    filtersPanel.classList.toggle('open');
  });
  
  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.closest('.filter-options');
      const wasActive = chip.classList.contains('active');
      const chipValue = chip.textContent.trim().toLowerCase();
      const allChip = Array.from(group.querySelectorAll('.filter-chip')).find(c => c.textContent.trim().toLowerCase() === 'all');

      group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

      if (chipValue === 'all') {
        chip.classList.add('active');
      } else if (!wasActive) {
        chip.classList.add('active');
      } else if (allChip) {
        allChip.classList.add('active');
      }

      filterCourses();
    });
  });
  
  // Search input
  searchInput.addEventListener('input', debounce(() => {
    filterCourses();
  }, 300));

  if (sortSelect) {
    sortSelect.addEventListener('change', filterCourses);
  }

  filterCourses();
}

function filterCourses() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const courseGrid = document.querySelector('.course-grid');
  const cards = Array.from(document.querySelectorAll('.course-card'));
  const activeRating = getActiveFilterValue('rating');
  const activeDifficulty = getActiveFilterValue('difficulty');
  const activeStyle = getActiveFilterValue('teaching style');
  const sortMode = getSortMode();

  const filtered = cards.filter(card => {
    const courseId = card.dataset.course;
    const courseInfo = COURSE_DATA[courseId];
    const title = card.querySelector('.course-title').textContent.toLowerCase();
    const code = card.querySelector('.course-code').textContent.toLowerCase();
    const professor = card.querySelector('.course-professor span').textContent.toLowerCase();
    const tags = Array.from(card.querySelectorAll('.tag'))
      .map(t => t.textContent.toLowerCase())
      .join(' ');

    const matchesSearch = !searchTerm ||
      title.includes(searchTerm) ||
      code.includes(searchTerm) ||
      professor.includes(searchTerm) ||
      tags.includes(searchTerm);

    const matchesRating = !activeRating || courseInfo.rating >= activeRating;
    const matchesDifficulty = !activeDifficulty || courseInfo.difficulty === activeDifficulty;
    const matchesStyle = !activeStyle || courseInfo.teachingStyles.includes(activeStyle);

    return matchesSearch && matchesRating && matchesDifficulty && matchesStyle;
  });

  filtered.sort((a, b) => {
    const aInfo = COURSE_DATA[a.dataset.course];
    const bInfo = COURSE_DATA[b.dataset.course];
    if (sortMode === 'rating') {
      return bInfo.rating - aInfo.rating;
    }
    if (sortMode === 'difficulty') {
      const rank = { easy: 1, medium: 2, hard: 3 };
      return rank[aInfo.difficulty] - rank[bInfo.difficulty];
    }
    const fitA = parseFloat(a.querySelector('.fit-score').textContent) || 0;
    const fitB = parseFloat(b.querySelector('.fit-score').textContent) || 0;
    return fitB - fitA;
  });

  cards.forEach(card => {
    card.style.display = filtered.includes(card) ? 'block' : 'none';
  });

  filtered.forEach(card => courseGrid.appendChild(card));
  document.querySelector('.results-count').textContent = `${filtered.length} courses found`;
}

// ============================================
// Course Cards
// ============================================

function initCourseCards() {
  // View details button
  document.querySelectorAll('.course-card .btn-secondary').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.course-card');
      openCourseModal(card.dataset.course);
    });
  });
  
  // Add to schedule button
  document.querySelectorAll('.course-card .btn-primary').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.course-card');
      const courseId = card.dataset.course;
      addCourseToSchedule(courseId);
    });
  });
  
  // Bookmark button
  document.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('bookmarked');
      
      // Update SVG
      const svg = btn.querySelector('svg');
      if (btn.classList.contains('bookmarked')) {
        svg.setAttribute('fill', 'currentColor');
        showToast('Course saved to bookmarks');
      } else {
        svg.setAttribute('fill', 'none');
        showToast('Course removed from bookmarks');
      }
    });
  });
  
  // Card click (open modal)
  document.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('click', () => {
      openCourseModal(card.dataset.course);
    });
  });
}

// ============================================
// Course Detail Modal
// ============================================

function initModal() {
  const modal = document.getElementById('courseModal');
  const closeBtn = document.getElementById('closeModal');
  
  // Close button
  closeBtn.addEventListener('click', () => {
    closeCourseModal();
  });
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeCourseModal();
    }
  });
  
  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeCourseModal();
    }
  });
  
  // Modal action buttons
  modal.querySelector('.detail-actions .btn-primary').addEventListener('click', () => {
    if (appState.activeModalCourse) {
      addCourseToSchedule(appState.activeModalCourse);
    }
    closeCourseModal();
  });
  
  modal.querySelector('.detail-actions .btn-secondary').addEventListener('click', () => {
    showToast('Course saved to bookmarks');
  });
}

function openCourseModal(courseId = 'cs101') {
  appState.activeModalCourse = courseId;
  populateCourseModal(courseId);
  document.getElementById('courseModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCourseModal() {
  document.getElementById('courseModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================
// Schedule
// ============================================

function initSchedule() {
  const enrolledList = document.querySelector('.enrolled-list');
  enrolledList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-course');
    if (!removeBtn) {
      return;
    }
    const item = removeBtn.closest('.enrolled-item');
    if (!item) {
      return;
    }
    removeCourseFromSchedule(item.dataset.course);
  });

  const calendarBody = document.querySelector('.calendar-body');
  calendarBody.addEventListener('click', (e) => {
    const eventEl = e.target.closest('.calendar-event');
    if (eventEl) {
      openCourseModal(eventEl.dataset.course);
    }
  });

  renderSchedule();
}

function updateScheduleStats() {
  const totalCredits = appState.enrolledCourses.reduce((sum, courseId) => {
    return sum + (COURSE_DATA[courseId]?.credits || 0);
  }, 0);
  const daysOnCampus = getScheduledDays().size;
  const conflicts = getScheduleConflicts();
  const statCards = document.querySelectorAll('.stat-card');
  statCards[0].querySelector('.stat-value').textContent = totalCredits;
  statCards[1].querySelector('.stat-value').textContent = appState.enrolledCourses.length;
  statCards[2].querySelector('.stat-value').textContent = daysOnCampus;
  statCards[3].querySelector('.stat-value').textContent = conflicts.length;
}

// ============================================
// Utility Functions
// ============================================

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
// ── Utilities ─────────────────────────────────
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
=======
// ============================================
// Compare Screen Interactions
// ============================================
function initCompare() {
  const applyBtn = document.querySelector('.compare-actions .btn-primary');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      showToast('Schedule B has been applied!');
      navigateTo('schedule');
    });
  }
  
  // Create new schedule button
  const createBtn = document.querySelector('.compare-actions .btn-secondary');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      showToast('Starting new schedule...');
      navigateTo('search');
    });
  }
}

function addCourseToSchedule(courseId) {
  const info = COURSE_DATA[courseId];
  if (!info) {
    return;
  }
  if (appState.enrolledCourses.includes(courseId)) {
    showToast(`${info.code} is already in your schedule`);
    return;
  }
  const conflicts = getConflictsForCandidate(courseId);
  if (conflicts.length > 0) {
    const conflictList = conflicts
      .map(conflict => `${info.code} conflicts with ${conflict.withCode} (${capitalizeDay(conflict.day)} ${formatTime(conflict.start)} - ${formatTime(conflict.end)})`)
      .join(' | ');
    showToast(`Cannot add course: ${conflictList}`);
    return;
  }
  appState.enrolledCourses.push(courseId);
  renderSchedule();
  showToast(`${info.code} added to your schedule!`);
}

function removeCourseFromSchedule(courseId) {
  const index = appState.enrolledCourses.indexOf(courseId);
  if (index === -1) {
    return;
  }
  const removed = COURSE_DATA[courseId];
  appState.enrolledCourses.splice(index, 1);
  renderSchedule();
  showToast(`${removed.code} removed from schedule`);
}

function renderSchedule() {
  renderEnrolledList();
  renderCalendar();
  updateScheduleStats();
  updateAddButtonsState();
}

function renderEnrolledList() {
  const list = document.querySelector('.enrolled-list');
  const html = appState.enrolledCourses.map(courseId => {
    const course = COURSE_DATA[courseId];
    return `
      <div class="enrolled-item" data-course="${courseId}">
        <div class="enrolled-color ${courseId}"></div>
        <div class="enrolled-info">
          <span class="enrolled-code">${course.code}</span>
          <span class="enrolled-name">${course.name}</span>
        </div>
        <span class="enrolled-credits">${course.credits} cr</span>
        <button class="btn btn-icon btn-sm remove-course">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
  list.innerHTML = html;
}

function renderCalendar() {
  const dayColumns = document.querySelectorAll('.calendar-body .day-column');
  dayColumns.forEach(column => {
    column.innerHTML = '';
  });

  appState.enrolledCourses.forEach(courseId => {
    const course = COURSE_DATA[courseId];
    if (!course) {
      return;
    }
    course.meetings.forEach(meeting => {
      const dayIndex = CALENDAR_DAYS.indexOf(meeting.day);
      if (dayIndex === -1) {
        return;
      }
      const column = dayColumns[dayIndex];
      const startOffset = meeting.start - CALENDAR_START_HOUR;
      const duration = meeting.end - meeting.start;
      const event = document.createElement('div');
      event.className = `calendar-event ${courseId}`;
      event.dataset.course = courseId;
      event.style.setProperty('--start', String(startOffset));
      event.style.setProperty('--duration', String(duration));
      event.innerHTML = `
        <span class="event-title">${course.code}</span>
        <span class="event-time">${formatTime(meeting.start)} - ${formatTime(meeting.end)}</span>
      `;
      column.appendChild(event);
    });
  });
}

function getScheduledDays() {
  const daySet = new Set();
  appState.enrolledCourses.forEach(courseId => {
    const course = COURSE_DATA[courseId];
    if (!course) {
      return;
    }
    course.meetings.forEach(meeting => daySet.add(meeting.day));
  });
  return daySet;
}

function updateAddButtonsState() {
  document.querySelectorAll('.course-card').forEach(card => {
    const courseId = card.dataset.course;
    const addBtn = card.querySelector('.btn-primary');
    if (!addBtn) {
      return;
    }
    const isAdded = appState.enrolledCourses.includes(courseId);
    addBtn.textContent = isAdded ? 'Added' : 'Add to Schedule';
    addBtn.disabled = isAdded;
  });
}

function getActiveFilterValue(groupLabel) {
  const groups = Array.from(document.querySelectorAll('.filter-group'));
  const group = groups.find(g => {
    const label = g.querySelector('label');
    return label && label.textContent.trim().toLowerCase() === groupLabel;
  });
  if (!group) {
    return null;
  }
  const active = group.querySelector('.filter-chip.active');
  if (!active) {
    return null;
  }
  const value = active.textContent.trim().toLowerCase();
  if (value === 'all') {
    return null;
  }
  if (groupLabel === 'rating') {
    return value.startsWith('4') ? 4 : 3;
  }
  if (groupLabel === 'difficulty') {
    return value;
  }
  if (groupLabel === 'teaching style') {
    if (value.includes('lecture')) return 'lectures';
    if (value.includes('project')) return 'projects';
    if (value.includes('discussion')) return 'discussion';
    if (value.includes('lab')) return 'labs';
  }
  return null;
}

function getSortMode() {
  const sortSelect = document.querySelector('.sort-select');
  if (!sortSelect) {
    return 'best-fit';
  }
  const value = sortSelect.value.toLowerCase();
  if (value.includes('rating')) {
    return 'rating';
  }
  if (value.includes('difficulty')) {
    return 'difficulty';
  }
  return 'best-fit';
}

function ensureAllChipForTeachingStyle() {
  const groups = Array.from(document.querySelectorAll('.filter-group'));
  const styleGroup = groups.find(g => {
    const label = g.querySelector('label');
    return label && label.textContent.trim().toLowerCase() === 'teaching style';
  });
  if (!styleGroup) {
    return;
  }
  const options = styleGroup.querySelector('.filter-options');
  const hasAll = Array.from(options.querySelectorAll('.filter-chip')).some(chip => chip.textContent.trim().toLowerCase() === 'all');
  if (hasAll) {
    return;
  }
  const allChip = document.createElement('button');
  allChip.className = 'filter-chip active';
  allChip.textContent = 'All';
  options.prepend(allChip);
}

function populateCourseModal(courseId) {
  const course = COURSE_DATA[courseId];
  if (!course) {
    return;
  }
  const modal = document.getElementById('courseModal');
  modal.querySelector('.detail-info .course-code').textContent = course.code;
  modal.querySelector('.detail-info h2').textContent = course.title || course.name;
  modal.querySelector('.professor-name').textContent = course.professor || 'TBD';
  modal.querySelector('.professor-dept').textContent = course.department || 'Department';
  modal.querySelector('.detail-meta .meta-card:nth-child(1) .meta-value').textContent = formatMeetingSummary(course.meetings);
  modal.querySelector('.detail-meta .meta-card:nth-child(3) .meta-value').textContent = `${course.credits} Credits`;
  modal.querySelector('.detail-meta .meta-card:nth-child(4) .meta-value').textContent = course.seats || 'TBD';
  modal.querySelector('.detail-actions .btn-primary').disabled = appState.enrolledCourses.includes(courseId);
}

function getConflictsForCandidate(courseId) {
  const candidate = COURSE_DATA[courseId];
  if (!candidate) {
    return [];
  }
  const conflicts = [];
  appState.enrolledCourses.forEach(existingId => {
    const existing = COURSE_DATA[existingId];
    if (!existing) {
      return;
    }
    candidate.meetings.forEach(candidateMeeting => {
      existing.meetings.forEach(existingMeeting => {
        if (candidateMeeting.day !== existingMeeting.day) {
          return;
        }
        const overlapStart = Math.max(candidateMeeting.start, existingMeeting.start);
        const overlapEnd = Math.min(candidateMeeting.end, existingMeeting.end);
        if (overlapStart < overlapEnd) {
          conflicts.push({
            withId: existingId,
            withCode: existing.code,
            day: candidateMeeting.day,
            start: overlapStart,
            end: overlapEnd
          });
        }
      });
    });
  });
  return conflicts;
}

function getScheduleConflicts() {
  const conflicts = [];
  for (let i = 0; i < appState.enrolledCourses.length; i += 1) {
    const firstId = appState.enrolledCourses[i];
    const firstCourse = COURSE_DATA[firstId];
    if (!firstCourse) {
      continue;
    }
    for (let j = i + 1; j < appState.enrolledCourses.length; j += 1) {
      const secondId = appState.enrolledCourses[j];
      const secondCourse = COURSE_DATA[secondId];
      if (!secondCourse) {
        continue;
      }
      firstCourse.meetings.forEach(firstMeeting => {
        secondCourse.meetings.forEach(secondMeeting => {
          if (firstMeeting.day !== secondMeeting.day) {
            return;
          }
          const overlapStart = Math.max(firstMeeting.start, secondMeeting.start);
          const overlapEnd = Math.min(firstMeeting.end, secondMeeting.end);
          if (overlapStart < overlapEnd) {
            conflicts.push({
              firstCode: firstCourse.code,
              secondCode: secondCourse.code,
              day: firstMeeting.day,
              start: overlapStart,
              end: overlapEnd
            });
          }
        });
      });
    }
  }
  return conflicts;
}

function formatMeetingSummary(meetings) {
  if (!meetings || meetings.length === 0) {
    return 'TBD';
  }
  const uniqueDays = [...new Set(meetings.map(m => m.day))];
  const dayMap = {
    monday: 'M',
    tuesday: 'T',
    wednesday: 'W',
    thursday: 'Th',
    friday: 'F'
  };
  const dayLabel = uniqueDays.map(day => dayMap[day] || day).join('');
  const firstMeeting = meetings[0];
  return `${dayLabel} ${formatTime(firstMeeting.start)} - ${formatTime(firstMeeting.end)}`;
}

function capitalizeDay(day) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatTime(decimalHour) {
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = ((hours + 11) % 12) + 1;
  const minutePart = minutes === 0 ? '00' : String(minutes).padStart(2, '0');
  return `${displayHour}:${minutePart} ${period}`;
>>>>>>> Stashed changes
}
