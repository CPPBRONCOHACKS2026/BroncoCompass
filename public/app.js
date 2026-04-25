// ============================================
// Course Compass - JavaScript Application
// ============================================

const COURSE_DATA = {
  cs101: {
    code: 'CS 101',
    name: 'Intro to Computer Science',
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
    credits: 3,
    rating: 4.2,
    difficulty: 'medium',
    teachingStyles: ['discussion'],
    meetings: [{ day: 'thursday', start: 15, end: 16.5 }]
  },
  phys101: {
    code: 'PHYS 101',
    name: 'Physics for Engineers',
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

const CALENDAR_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const CALENDAR_START_HOUR = 8;

const appState = {
  currentStep: 1,
  totalSteps: 3,
  userPreferences: {
    learningStyle: null,
    difficulty: null,
    schedule: []
  },
  currentScreen: 'onboarding',
  enrolledCourses: ['cs101', 'math201', 'psych100', 'bio150', 'eng202']
};

document.addEventListener('DOMContentLoaded', () => {
  initOnboarding();
  initNavigation();
  initSearch();
  initCourseCards();
  initModal();
  initSchedule();
  initCompare();
});

// ============================================
// Onboarding
// ============================================

function initOnboarding() {
  const prevBtn = document.getElementById('prevStep');
  const nextBtn = document.getElementById('nextStep');
  const optionCards = document.querySelectorAll('.step-content[data-step="1"] .option-card, .step-content[data-step="2"] .option-card');
  
  // Handle option card selection (for steps 1 and 2)
  optionCards.forEach(card => {
    card.addEventListener('click', () => {
      const stepContent = card.closest('.step-content');
      const step = parseInt(stepContent.dataset.step);
      
      // Deselect siblings
      stepContent.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      // Store selection
      if (step === 1) {
        appState.userPreferences.learningStyle = card.dataset.value;
      } else if (step === 2) {
        appState.userPreferences.difficulty = card.dataset.value;
      }
    });
  });
  
  // Handle checkbox selections (step 3)
  const checkboxes = document.querySelectorAll('.checkbox-card input');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        appState.userPreferences.schedule.push(checkbox.value);
      } else {
        appState.userPreferences.schedule = appState.userPreferences.schedule.filter(v => v !== checkbox.value);
      }
    });
  });
  
  // Previous button
  prevBtn.addEventListener('click', () => {
    if (appState.currentStep > 1) {
      appState.currentStep--;
      updateOnboardingUI();
    }
  });
  
  // Next button
  nextBtn.addEventListener('click', () => {
    if (appState.currentStep < appState.totalSteps) {
      appState.currentStep++;
      updateOnboardingUI();
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  });
}

function updateOnboardingUI() {
  const { currentStep, totalSteps } = appState;
  const prevBtn = document.getElementById('prevStep');
  const nextBtn = document.getElementById('nextStep');
  
  // Update step indicators
  document.querySelectorAll('.step-indicator .step').forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove('active', 'completed');
    
    if (stepNum === currentStep) {
      step.classList.add('active');
    } else if (stepNum < currentStep) {
      step.classList.add('completed');
    }
  });
  
  // Update step content visibility
  document.querySelectorAll('.step-content').forEach(content => {
    const stepNum = parseInt(content.dataset.step);
    content.classList.toggle('active', stepNum === currentStep);
  });
  
  // Update buttons
  prevBtn.disabled = currentStep === 1;
  nextBtn.textContent = currentStep === totalSteps ? 'Get Started' : 'Continue';
}

function completeOnboarding() {
  // Hide onboarding
  document.getElementById('onboarding').classList.remove('active');
  
  // Show navbar and search
  document.getElementById('navbar').classList.add('visible');
  document.getElementById('search').classList.add('active');
  
  // Update nav link
  document.querySelector('.nav-link[data-screen="search"]').classList.add('active');
  
  appState.currentScreen = 'search';
  
  // Show a welcome toast (simple implementation)
  showToast('Welcome! Your personalized course recommendations are ready.');
}

// ============================================
// Navigation
// ============================================

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const screen = link.dataset.screen;
      navigateTo(screen);
    });
  });
}

function navigateTo(screenId) {
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.screen === screenId);
  });
  
  // Update screens
  document.querySelectorAll('.screen:not(.onboarding-screen)').forEach(screen => {
    screen.classList.toggle('active', screen.id === screenId);
  });
  
  appState.currentScreen = screenId;
}

// ============================================
// Search & Filters
// ============================================

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const filterToggle = document.getElementById('filterToggle');
  const filtersPanel = document.getElementById('filtersPanel');
  const filterChips = document.querySelectorAll('.filter-chip');
  const sortSelect = document.querySelector('.sort-select');
  
  // Filter toggle
  filterToggle.addEventListener('click', () => {
    filtersPanel.classList.toggle('open');
  });
  
  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.closest('.filter-options');

      group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      if (!chip.classList.contains('active') || chip.textContent.trim().toLowerCase() === 'all') {
        chip.classList.add('active');
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
      openCourseModal();
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
      openCourseModal();
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
    showToast('Course added to your schedule!');
    closeCourseModal();
  });
  
  modal.querySelector('.detail-actions .btn-secondary').addEventListener('click', () => {
    showToast('Course saved to bookmarks');
  });
}

function openCourseModal() {
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
    if (e.target.closest('.calendar-event')) {
      openCourseModal();
    }
  });

  renderSchedule();
}

function updateScheduleStats() {
  const totalCredits = appState.enrolledCourses.reduce((sum, courseId) => {
    return sum + (COURSE_DATA[courseId]?.credits || 0);
  }, 0);
  const daysOnCampus = getScheduledDays().size;
  const statCards = document.querySelectorAll('.stat-card');
  statCards[0].querySelector('.stat-value').textContent = totalCredits;
  statCards[1].querySelector('.stat-value').textContent = appState.enrolledCourses.length;
  statCards[2].querySelector('.stat-value').textContent = daysOnCampus;
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
}

function showToast(message) {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  
  // Add styles
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #1f2937;
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 2000;
    font-size: 14px;
    animation: slideUp 0.3s ease forwards;
  `;
  
  // Add animation keyframes if not exists
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideUp {
        to { transform: translateX(-50%) translateY(0); }
      }
      @keyframes slideDown {
        to { transform: translateX(-50%) translateY(100px); }
      }
      .toast-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        opacity: 0.7;
        padding: 4px;
        display: flex;
      }
      .toast-close:hover { opacity: 1; }
      .toast-close svg { width: 16px; height: 16px; }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    hideToast(toast);
  });
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    hideToast(toast);
  }, 3000);
}

function hideToast(toast) {
  toast.style.animation = 'slideDown 0.3s ease forwards';
  setTimeout(() => {
    toast.remove();
  }, 300);
}

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

function formatTime(decimalHour) {
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = ((hours + 11) % 12) + 1;
  const minutePart = minutes === 0 ? '00' : String(minutes).padStart(2, '0');
  return `${displayHour}:${minutePart} ${period}`;
}
