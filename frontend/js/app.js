/* ============================================================
   Student Management System — app.js
   API client, DOM management, and UI interactions.
   ============================================================ */

'use strict';

// ── Configuration ────────────────────────────────────────────────────────
// Resolves API base URL dynamically based on environment:
// 1. Checks localStorage override ('API_BASE_URL') for live testing
// 2. Uses DEV_API_URL when running locally (localhost, 127.0.0.1, file://)
// 3. Uses PROD_API_URL when deployed (e.g. Vercel)
function resolveApiBaseUrl() {
  const config = window.APP_CONFIG || {};
  const localDefault = config.DEV_API_URL || 'http://127.0.0.1:8000/api';
  const prodDefault = config.PROD_API_URL || 'http://127.0.0.1:8000/api';

  try {
    const override = window.localStorage && window.localStorage.getItem('API_BASE_URL');
    if (override) {
      return override.replace(/\/+$/, '');
    }
  } catch (e) {
    // localStorage might be unavailable in certain sandbox environments
  }

  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'
  );

  const selectedUrl = isLocal ? localDefault : prodDefault;
  let url = (selectedUrl || 'https://student-management-system-ge3z.onrender.com/api').trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
}

const API_BASE_URL = resolveApiBaseUrl();

// ── State ────────────────────────────────────────────────────────────────
let allStudents  = [];   // full list returned from API
let editingId    = null; // null = Add mode, number = Edit mode
let deletingId   = null; // ID pending confirmation

// ── DOM References ───────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const dom = {
  // Stats
  statTotal:      $('stat-total'),
  statDept:       $('stat-dept'),
  statAvg:        $('stat-avg'),

  // Toolbar
  searchInput:    $('search-input'),
  searchClear:    $('search-clear'),
  btnAdd:         $('btn-add-student'),
  btnAddFirst:    $('btn-add-first'),

  // Table
  loadingState:   $('loading-state'),
  tableWrapper:   $('table-wrapper'),
  studentsTbody:  $('students-tbody'),
  emptyState:     $('empty-state'),
  emptyTitle:     $('empty-title'),
  emptySub:       $('empty-sub'),
  recordCount:    $('record-count'),

  // Add/Edit Modal
  modalOverlay:   $('modal-overlay'),
  modalTitle:     $('modal-title'),
  modalIcon:      $('modal-icon'),
  modalClose:     $('modal-close'),
  studentForm:    $('student-form'),
  fieldName:      $('field-name'),
  fieldEmail:     $('field-email'),
  fieldAge:       $('field-age'),
  fieldDept:      $('field-dept'),
  errName:        $('err-name'),
  errEmail:       $('err-email'),
  errAge:         $('err-age'),
  errDept:        $('err-dept'),
  serverError:    $('server-error'),
  btnCancel:      $('btn-modal-cancel'),
  btnSubmit:      $('btn-submit'),
  btnSubmitText:  $('btn-submit-text'),
  btnSpinner:     $('btn-spinner'),

  // Delete Modal
  deleteOverlay:  $('delete-overlay'),
  deleteMsg:      $('delete-msg'),
  btnCancelDel:   $('btn-cancel-delete'),
  btnConfirmDel:  $('btn-confirm-delete'),
  deleteBtnText:  $('delete-btn-text'),
  deleteSpinner:  $('delete-spinner'),

  // Toasts
  toastRoot:      $('toast-root'),

  // Date
  currentDate:    $('current-date'),
};

// ── Helpers ──────────────────────────────────────────────────────────────

/** Make a fetch() call to the API with JSON support. */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    ...options,
  };
  const response = await fetch(url, config);
  // For DELETE which returns 200 with body, or 204 with no body
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    const err = new Error('API error');
    err.status = response.status;
    err.data   = data;
    throw err;
  }
  return data;
}

/** Set the current date in the navbar. */
function setCurrentDate() {
  const now = new Date();
  dom.currentDate.textContent = now.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

/** Update the three stat cards based on the full student list. */
function updateStats(students) {
  dom.statTotal.textContent = students.length;

  const depts = new Set(students.map(s => s.department.trim().toLowerCase()));
  dom.statDept.textContent = depts.size;

  if (students.length === 0) {
    dom.statAvg.textContent = '—';
  } else {
    const avg = students.reduce((sum, s) => sum + s.age, 0) / students.length;
    dom.statAvg.textContent = avg.toFixed(1);
  }
}

// ── API Operations ───────────────────────────────────────────────────────

/** Fetch all students from the API and re-render the table. */
async function loadStudents() {
  showLoading(true);
  try {
    const data = await apiFetch('/students/');
    allStudents = data.students || [];
    updateStats(allStudents);
    renderTable(allStudents);
  } catch (err) {
    console.error('Failed to load students from:', API_BASE_URL, err);
    showLoading(false);
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hintMsg = isLocal
      ? 'Make sure the local Django server is running (python manage.py runserver).'
      : `Cannot reach API at ${API_BASE_URL}. Ensure your Render service is deployed and active.`;
    showEmptyState('Could not connect to server', hintMsg);
    showToast('error', 'Connection Error', 'Could not load students. Is the API backend reachable?');
  }
}

/** Create a new student record. */
async function createStudent(payload) {
  return await apiFetch('/students/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Update an existing student record (PATCH for partial update). */
async function updateStudent(id, payload) {
  return await apiFetch(`/students/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** Delete a student record by ID. */
async function deleteStudent(id) {
  return await apiFetch(`/students/${id}/`, { method: 'DELETE' });
}

// ── Rendering ────────────────────────────────────────────────────────────

/** Show or hide the loading spinner. */
function showLoading(show) {
  dom.loadingState.style.display  = show ? 'flex' : 'none';
  dom.tableWrapper.style.display  = show ? 'none' : '';
  dom.emptyState.style.display    = 'none';
}

/** Render the empty state with a custom message. */
function showEmptyState(title, sub) {
  dom.tableWrapper.style.display = 'none';
  dom.loadingState.style.display = 'none';
  dom.emptyState.style.display   = 'flex';
  dom.emptyTitle.textContent     = title || 'No students found';
  dom.emptySub.textContent       = sub   || 'Add your first student to get started.';
}

/** Render the students array into the table. */
function renderTable(students) {
  showLoading(false);

  if (students.length === 0) {
    const isFiltered = dom.searchInput.value.trim().length > 0;
    if (isFiltered) {
      showEmptyState('No results found', `No students match "${dom.searchInput.value.trim()}".`);
    } else {
      showEmptyState('No students yet', 'Add your first student to get started.');
    }
    dom.recordCount.textContent = '0 records';
    return;
  }

  dom.tableWrapper.style.display = '';
  dom.emptyState.style.display   = 'none';

  const count = students.length;
  dom.recordCount.textContent = `${count} record${count !== 1 ? 's' : ''}`;

  dom.studentsTbody.innerHTML = students.map((s, i) => `
    <tr data-id="${s.id}">
      <td><span class="id-badge">${i + 1}</span></td>
      <td><span class="cell-name">${escHtml(s.name)}</span></td>
      <td><span class="cell-email">${escHtml(s.email)}</span></td>
      <td><span class="age-chip">${s.age}</span></td>
      <td><span class="dept-tag" title="${escHtml(s.department)}">${escHtml(s.department)}</span></td>
      <td>
        <div class="actions">
          <button
            class="btn-action btn-action--edit"
            data-id="${s.id}"
            aria-label="Edit ${escHtml(s.name)}"
            title="Edit student"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            class="btn-action btn-action--delete"
            data-id="${s.id}"
            data-name="${escHtml(s.name)}"
            aria-label="Delete ${escHtml(s.name)}"
            title="Delete student"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/** HTML-escape a string to prevent XSS. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Search ───────────────────────────────────────────────────────────────

function handleSearch() {
  const q = dom.searchInput.value.trim().toLowerCase();
  dom.searchClear.style.display = q ? 'flex' : 'none';

  if (!q) {
    renderTable(allStudents);
    return;
  }

  const filtered = allStudents.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.department.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q)
  );
  renderTable(filtered);
}

// ── Modal: Add / Edit ────────────────────────────────────────────────────

function openModal(student = null) {
  editingId = student ? student.id : null;
  clearForm();

  if (student) {
    // Edit mode
    dom.modalTitle.textContent     = 'Edit Student';
    dom.btnSubmitText.textContent  = 'Save Changes';
    dom.modalIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>`;
    dom.fieldName.value  = student.name;
    dom.fieldEmail.value = student.email;
    dom.fieldAge.value   = student.age;
    dom.fieldDept.value  = student.department;
  } else {
    // Add mode
    dom.modalTitle.textContent    = 'Add Student';
    dom.btnSubmitText.textContent = 'Add Student';
    dom.modalIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>`;
  }

  dom.modalOverlay.style.display = 'flex';
  dom.fieldName.focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  dom.modalOverlay.style.display = 'none';
  document.body.style.overflow = '';
  clearForm();
  editingId = null;
}

function clearForm() {
  dom.studentForm.reset();
  clearFieldErrors();
  dom.serverError.style.display = 'none';
  dom.serverError.textContent = '';
  setSubmitLoading(false);
}

function clearFieldErrors() {
  [dom.fieldName, dom.fieldEmail, dom.fieldAge, dom.fieldDept].forEach(f => {
    f.classList.remove('is-invalid');
  });
  [dom.errName, dom.errEmail, dom.errAge, dom.errDept].forEach(e => {
    e.textContent = '';
  });
}

// ── Client-side Form Validation ──────────────────────────────────────────

function validateForm() {
  clearFieldErrors();
  let valid = true;

  const name  = dom.fieldName.value.trim();
  const email = dom.fieldEmail.value.trim();
  const age   = parseInt(dom.fieldAge.value, 10);
  const dept  = dom.fieldDept.value.trim();

  if (!name) {
    setFieldError(dom.fieldName, dom.errName, 'Name is required.');
    valid = false;
  } else if (name.length < 2) {
    setFieldError(dom.fieldName, dom.errName, 'Name must be at least 2 characters.');
    valid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setFieldError(dom.fieldEmail, dom.errEmail, 'Email is required.');
    valid = false;
  } else if (!emailRegex.test(email)) {
    setFieldError(dom.fieldEmail, dom.errEmail, 'Enter a valid email address.');
    valid = false;
  }

  if (!dom.fieldAge.value) {
    setFieldError(dom.fieldAge, dom.errAge, 'Age is required.');
    valid = false;
  } else if (isNaN(age) || age < 1 || age > 99) {
    setFieldError(dom.fieldAge, dom.errAge, 'Age must be between 1 and 99.');
    valid = false;
  }

  if (!dept) {
    setFieldError(dom.fieldDept, dom.errDept, 'Department is required.');
    valid = false;
  } else if (dept.length < 2) {
    setFieldError(dom.fieldDept, dom.errDept, 'Department must be at least 2 characters.');
    valid = false;
  }

  return valid;
}

function setFieldError(input, errorEl, message) {
  input.classList.add('is-invalid');
  errorEl.textContent = message;
}

/** Map server validation errors from DRF back to the correct fields. */
function applyServerErrors(errors) {
  const fieldMap = {
    name:       { input: dom.fieldName,  error: dom.errName },
    email:      { input: dom.fieldEmail, error: dom.errEmail },
    age:        { input: dom.fieldAge,   error: dom.errAge },
    department: { input: dom.fieldDept,  error: dom.errDept },
  };

  let hasFieldError = false;
  for (const [field, refs] of Object.entries(fieldMap)) {
    if (errors[field]) {
      setFieldError(refs.input, refs.error, errors[field][0] || errors[field]);
      hasFieldError = true;
    }
  }

  // Non-field errors → banner
  if (!hasFieldError || errors.non_field_errors || errors.detail) {
    const msg = errors.non_field_errors?.[0] || errors.detail || 'Validation failed. Please check your inputs.';
    dom.serverError.textContent  = msg;
    dom.serverError.style.display = 'block';
  }
}

function setSubmitLoading(loading) {
  dom.btnSubmit.disabled         = loading;
  dom.btnSpinner.style.display   = loading ? 'inline-block' : 'none';
  dom.btnSubmitText.style.opacity = loading ? 0.6 : 1;
}

// ── Form Submit Handler ──────────────────────────────────────────────────

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    name:       dom.fieldName.value.trim(),
    email:      dom.fieldEmail.value.trim().toLowerCase(),
    age:        parseInt(dom.fieldAge.value, 10),
    department: dom.fieldDept.value.trim(),
  };

  setSubmitLoading(true);

  try {
    if (editingId) {
      // ── Update ─────────────────────────────────────────────────────────
      const res = await updateStudent(editingId, payload);
      // Update the record in allStudents locally
      const idx = allStudents.findIndex(s => s.id === editingId);
      if (idx !== -1) allStudents[idx] = res.student;
      updateStats(allStudents);
      renderTable(applyCurrentSearch());
      closeModal();
      showToast('success', 'Student Updated', `${res.student.name}'s record has been updated.`);
    } else {
      // ── Create ─────────────────────────────────────────────────────────
      const res = await createStudent(payload);
      allStudents.unshift(res.student);
      updateStats(allStudents);
      renderTable(applyCurrentSearch());
      closeModal();
      showToast('success', 'Student Added', `${res.student.name} has been added successfully.`);
    }
  } catch (err) {
    setSubmitLoading(false);
    if (err.data?.errors) {
      applyServerErrors(err.data.errors);
    } else if (err.data) {
      applyServerErrors(err.data);
    } else {
      dom.serverError.textContent   = 'Network error. Please check your connection.';
      dom.serverError.style.display = 'block';
    }
  }
}

/** Return the filtered subset based on current search input. */
function applyCurrentSearch() {
  const q = dom.searchInput.value.trim().toLowerCase();
  if (!q) return allStudents;
  return allStudents.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.department.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q)
  );
}

// ── Delete Confirmation ──────────────────────────────────────────────────

function openDeleteConfirm(id, name) {
  deletingId = id;
  dom.deleteMsg.textContent    = `You are about to permanently delete "${name}". This action cannot be undone.`;
  dom.deleteOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  dom.btnConfirmDel.focus();
}

function closeDeleteConfirm() {
  dom.deleteOverlay.style.display = 'none';
  document.body.style.overflow = '';
  deletingId = null;
  setDeleteLoading(false);
}

function setDeleteLoading(loading) {
  dom.btnConfirmDel.disabled       = loading;
  dom.deleteSpinner.style.display  = loading ? 'inline-block' : 'none';
  dom.deleteBtnText.style.opacity  = loading ? 0.6 : 1;
}

async function handleConfirmDelete() {
  if (!deletingId) return;
  setDeleteLoading(true);

  const student = allStudents.find(s => s.id === deletingId);
  const name    = student ? student.name : 'Student';

  try {
    await deleteStudent(deletingId);
    allStudents = allStudents.filter(s => s.id !== deletingId);
    updateStats(allStudents);
    renderTable(applyCurrentSearch());
    closeDeleteConfirm();
    showToast('success', 'Student Deleted', `${name}'s record has been removed.`);
  } catch (err) {
    setDeleteLoading(false);
    closeDeleteConfirm();
    showToast('error', 'Delete Failed', 'Could not delete student. Please try again.');
  }
}

// ── Table Click Delegation ───────────────────────────────────────────────

function handleTableClick(e) {
  // Edit button
  const editBtn = e.target.closest('.btn-action--edit');
  if (editBtn) {
    const id = parseInt(editBtn.dataset.id, 10);
    const student = allStudents.find(s => s.id === id);
    if (student) openModal(student);
    return;
  }

  // Delete button
  const deleteBtn = e.target.closest('.btn-action--delete');
  if (deleteBtn) {
    const id   = parseInt(deleteBtn.dataset.id, 10);
    const name = deleteBtn.dataset.name;
    openDeleteConfirm(id, name);
    return;
  }
}

// ── Toast Notifications ──────────────────────────────────────────────────

const ICONS = {
  success: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  info:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

function showToast(type, title, message) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${ICONS[type] || ICONS.info}</div>
    <div class="toast-body">
      <div class="toast-title">${escHtml(title)}</div>
      <div class="toast-msg">${escHtml(message)}</div>
    </div>
    <button class="toast-dismiss" aria-label="Dismiss notification">&times;</button>
    <div class="toast-progress"></div>
  `;

  toast.querySelector('.toast-dismiss').addEventListener('click', () => dismissToast(toast));
  dom.toastRoot.appendChild(toast);

  // Auto-dismiss after 4 s
  const timer = setTimeout(() => dismissToast(toast), 4000);
  toast._timer = timer;
}

function dismissToast(toast) {
  clearTimeout(toast._timer);
  toast.style.animation = 'toast-out 300ms var(--ease) forwards';
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

// ── Keyboard Shortcuts ───────────────────────────────────────────────────

function handleKeydown(e) {
  // Escape closes any open modal
  if (e.key === 'Escape') {
    if (dom.modalOverlay.style.display !== 'none')  closeModal();
    if (dom.deleteOverlay.style.display !== 'none') closeDeleteConfirm();
  }
}

// ── Event Listeners ──────────────────────────────────────────────────────

function bindEvents() {
  // Toolbar
  dom.btnAdd.addEventListener('click',      () => openModal());
  dom.btnAddFirst?.addEventListener('click', () => openModal());
  dom.searchInput.addEventListener('input',  handleSearch);
  dom.searchClear.addEventListener('click',  () => {
    dom.searchInput.value = '';
    dom.searchClear.style.display = 'none';
    renderTable(allStudents);
    dom.searchInput.focus();
  });

  // Table (event delegation)
  dom.studentsTbody.addEventListener('click', handleTableClick);

  // Add/Edit Modal
  dom.studentForm.addEventListener('submit', handleFormSubmit);
  dom.modalClose.addEventListener('click',   closeModal);
  dom.btnCancel.addEventListener('click',    closeModal);
  dom.modalOverlay.addEventListener('click', e => {
    if (e.target === dom.modalOverlay) closeModal();
  });

  // Delete Modal
  dom.btnConfirmDel.addEventListener('click',  handleConfirmDelete);
  dom.btnCancelDel.addEventListener('click',   closeDeleteConfirm);
  dom.deleteOverlay.addEventListener('click',  e => {
    if (e.target === dom.deleteOverlay) closeDeleteConfirm();
  });

  // Global keyboard
  document.addEventListener('keydown', handleKeydown);
}

// ── Initialise ───────────────────────────────────────────────────────────

function init() {
  setCurrentDate();
  bindEvents();
  loadStudents();
}

document.addEventListener('DOMContentLoaded', init);