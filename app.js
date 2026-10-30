const STORAGE_KEY = 'taskmaster_app_state_v1';
const THEME_KEY = 'taskmaster_theme_preference';

const state = {
  tasks: [],
  filter: 'all',
  searchQuery: '',
  editingTaskId: null
};

const elements = {
  taskForm: document.getElementById('taskForm'),
  taskInput: document.getElementById('taskInput'),
  taskPriority: document.getElementById('taskPriority'),
  taskList: document.getElementById('taskList'),
  emptyState: document.getElementById('emptyState'),
  filterTabs: document.querySelectorAll('.filter-tab'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  clearCompletedBtn: document.getElementById('clearCompletedBtn'),
  themeToggle: document.getElementById('themeToggle'),

  totalTasksCount: document.getElementById('totalTasksCount'),
  activeTasksCount: document.getElementById('activeTasksCount'),
  completedTasksCount: document.getElementById('completedTasksCount'),
  badgeAll: document.getElementById('badgeAll'),
  badgeActive: document.getElementById('badgeActive'),
  badgeCompleted: document.getElementById('badgeCompleted'),
  itemsLeftSummary: document.getElementById('itemsLeftSummary'),
  progressBar: document.getElementById('progressBar'),
  progressPercent: document.getElementById('progressPercent')
};

function loadTasksFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    state.tasks = rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    state.tasks = [];
  }
}

function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

function addTask(title, priority = 'normal') {
  const trimmed = title.trim();
  if (!trimmed) return;

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: trimmed,
    completed: false,
    priority: priority,
    createdAt: Date.now()
  };

  state.tasks.unshift(newTask);
  saveTasksToStorage();
  render();
}

function toggleTaskCompletion(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveTasksToStorage();
    render();
  }
}

function updateTaskTitle(taskId, newTitle) {
  const trimmed = newTitle.trim();
  if (!trimmed) {
    deleteTask(taskId);
    return;
  }

  const task = state.tasks.find(t => t.id === taskId);
  if (task && task.title !== trimmed) {
    task.title = trimmed;
    saveTasksToStorage();
  }
  state.editingTaskId = null;
  render();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  if (state.editingTaskId === taskId) {
    state.editingTaskId = null;
  }
  saveTasksToStorage();
  render();
}

function clearCompletedTasks() {
  state.tasks = state.tasks.filter(t => !t.completed);
  saveTasksToStorage();
  render();
}

function getVisibleTasks() {
  return state.tasks.filter(task => {
    if (state.filter === 'active' && task.completed) return false;
    if (state.filter === 'completed' && !task.completed) return false;

    if (state.searchQuery) {
      return task.title.toLowerCase().includes(state.searchQuery.toLowerCase());
    }

    return true;
  });
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.dataset.id = task.id;

  const isEditing = state.editingTaskId === task.id;

  li.innerHTML = `
    <label class="custom-checkbox" title="Mark as ${task.completed ? 'active' : 'completed'}">
      <input type="checkbox" data-action="toggle" ${task.completed ? 'checked' : ''}>
      <span class="checkmark">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
    </label>

    <div class="task-content-box">
      ${isEditing ? `
        <input type="text" class="task-edit-input" data-action="edit-input" value="${escapeHtml(task.title)}" maxlength="150">
      ` : `
        <span class="task-text" data-action="start-edit" title="Double click to edit">${escapeHtml(task.title)}</span>
        <span class="task-meta">${formatTime(task.createdAt)}</span>
      `}
    </div>

    <span class="priority-pill ${task.priority}">${task.priority}</span>

    <div class="task-actions">
      ${isEditing ? `
        <button class="action-btn save-btn" data-action="save-edit" title="Save changes" aria-label="Save changes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      ` : `
        <button class="action-btn edit-btn" data-action="start-edit" title="Edit task" aria-label="Edit task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      `}
      <button class="action-btn delete-btn" data-action="delete" title="Delete task" aria-label="Delete task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  return li;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  const visibleTasks = getVisibleTasks();

  elements.taskList.innerHTML = '';
  if (visibleTasks.length === 0) {
    elements.emptyState.style.display = 'flex';
  } else {
    elements.emptyState.style.display = 'none';
    const fragment = document.createDocumentFragment();
    visibleTasks.forEach(task => {
      fragment.appendChild(createTaskElement(task));
    });
    elements.taskList.appendChild(fragment);
  }

  if (state.editingTaskId) {
    const editInput = elements.taskList.querySelector('.task-edit-input');
    if (editInput) {
      editInput.focus();
      const val = editInput.value;
      editInput.value = '';
      editInput.value = val;
    }
  }

  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const active = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  elements.totalTasksCount.textContent = total;
  elements.activeTasksCount.textContent = active;
  elements.completedTasksCount.textContent = completed;

  elements.badgeAll.textContent = total;
  elements.badgeActive.textContent = active;
  elements.badgeCompleted.textContent = completed;

  elements.itemsLeftSummary.textContent = `${active} task${active === 1 ? '' : 's'} remaining`;
  elements.progressBar.style.width = `${percentage}%`;
  elements.progressPercent.textContent = `${percentage}%`;

  elements.clearCompletedBtn.style.opacity = completed > 0 ? '1' : '0.4';
  elements.clearCompletedBtn.style.pointerEvents = completed > 0 ? 'auto' : 'none';

  elements.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
}

function setupEventListeners() {
  elements.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = elements.taskInput.value;
    const priority = elements.taskPriority.value;
    if (title.trim()) {
      addTask(title, priority);
      elements.taskInput.value = '';
      elements.taskInput.focus();
    }
  });

  elements.taskList.addEventListener('click', (e) => {
    const target = e.target;
    const taskItem = target.closest('.task-item');
    if (!taskItem) return;
    const taskId = taskItem.dataset.id;

    const actionEl = target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;

    if (action === 'toggle') {
      toggleTaskCompletion(taskId);
    } else if (action === 'delete') {
      deleteTask(taskId);
    } else if (action === 'start-edit') {
      state.editingTaskId = taskId;
      render();
    } else if (action === 'save-edit') {
      const input = taskItem.querySelector('.task-edit-input');
      if (input) {
        updateTaskTitle(taskId, input.value);
      }
    }
  });

  elements.taskList.addEventListener('dblclick', (e) => {
    const taskItem = e.target.closest('.task-item');
    if (taskItem && !taskItem.classList.contains('completed')) {
      state.editingTaskId = taskItem.dataset.id;
      render();
    }
  });

  elements.taskList.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('task-edit-input')) {
      const taskItem = e.target.closest('.task-item');
      const taskId = taskItem.dataset.id;

      if (e.key === 'Enter') {
        e.preventDefault();
        updateTaskTitle(taskId, e.target.value);
      } else if (e.key === 'Escape') {
        state.editingTaskId = null;
        render();
      }
    }
  });

  elements.taskList.addEventListener('focusout', (e) => {
    if (e.target.classList.contains('task-edit-input')) {
      const taskItem = e.target.closest('.task-item');
      if (taskItem) {
        const taskId = taskItem.dataset.id;
        setTimeout(() => {
          if (state.editingTaskId === taskId) {
            updateTaskTitle(taskId, e.target.value);
          }
        }, 150);
      }
    }
  });

  elements.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      state.filter = tab.dataset.filter;
      render();
    });
  });

  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    render();
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    render();
    elements.searchInput.focus();
  });

  elements.clearCompletedBtn.addEventListener('click', () => {
    clearCompletedTasks();
  });

  elements.themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
}

function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error(e);
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('dark');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadTasksFromStorage();
  setupEventListeners();
  render();
});
