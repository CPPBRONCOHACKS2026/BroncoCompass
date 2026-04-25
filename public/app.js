// ============================================
// Course Compass - JavaScript Application
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the application
  initOnboarding();
  initNavigation();
  initSearch();
  initCourseCards();
  initModal();
  initSchedule();
});

// ============================================
// State Management
// ============================================

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
  
  // Filter toggle
  filterToggle.addEventListener('click', () => {
    filtersPanel.classList.toggle('open');
  });
  
  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.closest('.filter-options');
      
      // If this is not the "All" option in rating/difficulty, allow multi-select
      // For simplicity, we'll use single select
      group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      // Trigger search/filter
      filterCourses();
    });
  });
  
  // Search input
  searchInput.addEventListener('input', debounce(() => {
    filterCourses();
  }, 300));
}

function filterCourses() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const courseCards = document.querySelectorAll('.course-card');
  
  courseCards.forEach(card => {
    const title = card.querySelector('.course-title').textContent.toLowerCase();
    const code = card.querySelector('.course-code').textContent.toLowerCase();
    const professor = card.querySelector('.course-professor span').textContent.toLowerCase();
    const tags = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent.toLowerCase()).join(' ');
    
    const matchesSearch = !searchTerm || 
      title.includes(searchTerm) || 
      code.includes(searchTerm) || 
      professor.includes(searchTerm) ||
      tags.includes(searchTerm);
    
    card.style.display = matchesSearch ? 'block' : 'none';
  });
  
  // Update results count
  const visibleCards = document.querySelectorAll('.course-card[style="display: block"], .course-card:not([style])').length;
  document.querySelector('.results-count').textContent = `${visibleCards} courses found`;
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
      const courseCode = card.querySelector('.course-code').textContent;
      showToast(`${courseCode} added to your schedule!`);
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
  // Remove course buttons
  document.querySelectorAll('.remove-course').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.enrolled-item');
      const code = item.querySelector('.enrolled-code').textContent;
      
      // Animate removal
      item.style.opacity = '0';
      item.style.transform = 'translateX(-10px)';
      
      setTimeout(() => {
        item.remove();
        updateScheduleStats();
        showToast(`${code} removed from schedule`);
      }, 200);
    });
  });
  
  // Calendar event clicks
  document.querySelectorAll('.calendar-event').forEach(event => {
    event.addEventListener('click', () => {
      openCourseModal();
    });
  });
}

function updateScheduleStats() {
  const enrolledItems = document.querySelectorAll('.enrolled-item');
  let totalCredits = 0;
  
  enrolledItems.forEach(item => {
    const creditsText = item.querySelector('.enrolled-credits').textContent;
    const credits = parseInt(creditsText);
    totalCredits += credits;
  });
  
  // Update stats display
  const statCards = document.querySelectorAll('.stat-card');
  statCards[0].querySelector('.stat-value').textContent = totalCredits;
  statCards[1].querySelector('.stat-value').textContent = enrolledItems.length;
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

document.addEventListener('DOMContentLoaded', () => {
  // Apply schedule button
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
});
