const defaultProjects = [
  {
    id: 1,
    nombre: "Landing para Nuevo Producto",
    responsable: "Ana",
    estado: "proceso", // pendiente | proceso | terminado
    etiqueta: "Marketing",
    fechaInicio: "2026-02-01",
    fechaFin: "2026-02-20",
    imagen: "https://images.pexels.com/photos/6476589/pexels-photo-6476589.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tareas: [
      { id: 1, nombre: "Definir mensaje clave", estado: "terminado" },
      { id: 2, nombre: "DiseÃ±ar wireframes", estado: "proceso" },
      { id: 3, nombre: "Escribir copy para secciones", estado: "pendiente" }
    ],
    subtareas: [
      { id: 1, nombre: "Redactar titular principal", estado: "terminado" },
      { id: 2, nombre: "Crear texto para llamada a la acciÃ³n", estado: "pendiente" }
    ]
  },
  {
    id: 2,
    nombre: "App interna de Inventarios",
    responsable: "Carlos",
    estado: "pendiente",
    etiqueta: "Backend",
    fechaInicio: "2026-02-10",
    fechaFin: "2026-03-03",
    imagen: "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tareas: [
      { id: 1, nombre: "DiseÃ±ar base de datos", estado: "pendiente" },
      { id: 2, nombre: "Implementar API REST", estado: "pendiente" },
      { id: 3, nombre: "Integrar con sistema de autenticaciÃ³n", estado: "pendiente" }
    ],
    subtareas: [
      { id: 1, nombre: "Definir entidades y relaciones", estado: "pendiente" },
      { id: 2, nombre: "Configurar entorno de desarrollo", estado: "pendiente" }
    ]
  },
  {
    id: 3,
    nombre: "Dashboard de Ventas",
    responsable: "MarÃ­a",
    estado: "terminado",
    etiqueta: "Data",
    fechaInicio: "2026-01-15",
    fechaFin: "2026-02-05",
    imagen: "https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tareas: [
      { id: 1, nombre: "Recopilar datos de ventas", estado: "terminado" },
      { id: 2, nombre: "Crear visualizaciones clave", estado: "terminado" },
      { id: 3, nombre: "Configurar actualizaciones automÃ¡ticas", estado: "terminado" }
    ],
    subtareas: [
      { id: 1, nombre: "Definir KPIs principales", estado: "terminado" },
      { id: 2, nombre: "Seleccionar herramientas de visualizaciÃ³n", estado: "terminado" }
    ]
  },
  {
    id: 4,
    nombre: "Web de Soporte al Cliente",
    responsable: "Luis",
    estado: "proceso",
    etiqueta: "Frontend",
    fechaInicio: "2026-02-06",
    fechaFin: "2026-02-28",
    imagen: "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tareas: [
      { id: 1, nombre: "DiseÃ±ar interfaz de usuario", estado: "pendiente" },
      { id: 2, nombre: "Implementar secciÃ³n de FAQ", estado: "proceso" },
      { id: 3, nombre: "Configurar sistema de soporte en lÃ­nea", estado: "pendiente" }
    ],
    subtareas: [
      { id: 1, nombre: "Crear prototipos de alta fidelidad", estado: "pendiente" },
      { id: 2, nombre: "Realizar pruebas de usabilidad", estado: "pendiente" }
    ]
  }
];

// Cargar proyectos (se inicializarÃ¡ despuÃ©s de que Firebase estÃ© listo)
let projects = defaultProjects;

// === Alertas personalizadas ===
function customAlert(message) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "custom-alert-overlay";
    overlay.innerHTML = `
      <div class="custom-alert-box">
        <p>${message}</p>
        <button class="editor-btn editor-btn-save">Aceptar</button>
      </div>
    `;
    document.body.appendChild(overlay);
    const btn = overlay.querySelector("button");
    btn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
    btn.focus();
  });
}

function customConfirm(message) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "custom-alert-overlay";
    overlay.innerHTML = `
      <div class="custom-alert-box">
        <p>${message}</p>
        <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end;">
          <button class="editor-btn editor-btn-delete" id="btn-cancel">Cancelar</button>
          <button class="editor-btn editor-btn-save" id="btn-ok">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#btn-cancel").onclick = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };
    const btnOk = overlay.querySelector("#btn-ok");
    btnOk.onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
    btnOk.focus();
  });
}

// === Pestañas ===
const tabDashboardBtn = document.getElementById("tab-dashboard-btn");
const tabGanttBtn = document.getElementById("tab-gantt-btn");
const tabEditorBtn = document.getElementById("tab-editor-btn");
const tabDashboard = document.getElementById("tab-dashboard");
const tabGantt = document.getElementById("tab-gantt");
const tabEditor = document.getElementById("tab-editor");
const viewCompactBtn = document.getElementById("view-compact-btn");
const viewDetailedBtn = document.getElementById("view-detailed-btn");

// === Columnas del Kanban ===
const colPendiente = document.getElementById("col-pendiente");
const colProceso = document.getElementById("col-proceso");
let boardSelectedProjectId = null;

// === Panel de resumen ===
const summaryActiveWrapEl = document.getElementById("summary-active-wrap");
const summaryActiveContentEl = document.getElementById("summary-active-content");
const summaryTotalProjectsEl = document.getElementById("summary-total-projects");
const summaryDoneProjectsEl = document.getElementById("summary-done-projects");
const summaryPendingProjectsEl = document.getElementById("summary-pending-projects");
const summaryInprogressProjectsEl = document.getElementById("summary-inprogress-projects");
const summaryProgressFillEl = document.getElementById("summary-progress-fill");
const summaryCompletionEl = document.getElementById("summary-completion");

// === Checklist de terminados ===
const doneChecklistEl = document.getElementById("done-checklist");
const doneChecklistCountEl = document.getElementById("done-checklist-count");
const doneReopenTargetEl = document.getElementById("done-reopen-target");

// === Carrusel ===
const projectImageEl = document.getElementById("project-image");
const projectTitleEl = document.getElementById("project-title");
const projectStatusDotEl = document.getElementById("project-status-dot");
const projectStatusTextEl = document.getElementById("project-status-text");
const indicatorsEl = document.getElementById("indicators");
const prevBtnEl = document.getElementById("prev-btn");
const nextBtnEl = document.getElementById("next-btn");
const expandImageBtn = document.getElementById("expand-image-btn");
const quickGoProjectBtn = document.getElementById("quick-go-project-btn");
const quickMarkProgressBtn = document.getElementById("quick-mark-progress-btn");
const quickViewCriticalBtn = document.getElementById("quick-view-critical-btn");

// === Modal de imagen ===
const imageModalEl = document.getElementById("image-modal");
const modalImageEl = document.getElementById("modal-image");
const modalTitleEl = document.getElementById("modal-title");
const closeModalBtn = document.getElementById("close-modal-btn");

// === Controles Modo TV ===
const tvPrevBtn = document.getElementById("tv-prev-btn");
const tvNextBtn = document.getElementById("tv-next-btn");
const tvPlayPauseBtn = document.getElementById("tv-play-pause-btn");
const tvStatusBadge = document.getElementById("tv-status-badge");
const tvPauseIcon = document.getElementById("tv-pause-icon");
let isTvModePaused = false;

// === Modal critico ===
const criticalModalEl = document.getElementById("critical-modal");
const criticalModalCloseBtn = document.getElementById("critical-modal-close-btn");
const criticalModalGoBtn = document.getElementById("critical-modal-go-btn");
const criticalModalMarkBtn = document.getElementById("critical-modal-mark-btn");
const criticalModalBodyEl = document.getElementById("critical-modal-body");

// === Contadores de columnas ===
const countPendiente = document.getElementById("count-pendiente");
const countProceso = document.getElementById("count-proceso");
const countTerminado = document.getElementById("count-terminado");

// === Carrusel: variables de estado ===
let currentIndex = 0;
let carouselInterval = null;

// === Helpers de estado ===
function getStatusClass(estado) {
  if (estado === "pendiente") return "status-pendiente";
  if (estado === "proceso") return "status-proceso";
  if (estado === "terminado") return "status-terminado";
  return "";
}

function getStatusLabel(estado) {
  if (estado === "pendiente") return "Pendiente";
  if (estado === "proceso") return "En Proceso";
  if (estado === "terminado") return "Terminado";
  return "";
}

// === Carrusel: funciones ===
function buildIndicators() {
  if (!indicatorsEl) return;
  indicatorsEl.innerHTML = "";
  if (!projects || !projects.length) return;
  if (currentIndex >= projects.length || currentIndex < 0) currentIndex = 0;
  projects.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "indicator-dot" + (i === currentIndex ? " active" : "");
    dot.addEventListener("click", () => {
      currentIndex = i;
      resetCarouselInterval();
      updateCarousel(currentIndex);
      buildIndicators();
    });
    indicatorsEl.appendChild(dot);
  });
}

function nextProject() {
  if (!projects || !projects.length) return;
  currentIndex = (currentIndex + 1) % projects.length;
  updateCarousel(currentIndex);
  buildIndicators();
}

function prevProject() {
  if (!projects || !projects.length) return;
  currentIndex = (currentIndex - 1 + projects.length) % projects.length;
  updateCarousel(currentIndex);
  buildIndicators();
}

function resetCarouselInterval() {
  if (carouselInterval) clearInterval(carouselInterval);
  if (projects && projects.length > 1 && !isTvModePaused) {
    carouselInterval = setInterval(nextProject, 5000);
  } else {
    carouselInterval = null;
  }
}

// Event listeners del carrusel
if (prevBtnEl) {
  prevBtnEl.addEventListener("click", () => {
    prevProject();
    resetCarouselInterval();
  });
}
if (nextBtnEl) {
  nextBtnEl.addEventListener("click", () => {
    nextProject();
    resetCarouselInterval();
  });
}

// === Eventos Modal Imagen (Modo TV) ===
if (expandImageBtn && imageModalEl) {
  expandImageBtn.addEventListener("click", async () => {
    imageModalEl.classList.remove("hidden");
    const project = projects[currentIndex];
    if (project) {
      if (modalImageEl) {
        modalImageEl.src = project.imagen || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIFZpZXdCb3g9IjAgMCA0MDAgMjgwIiBmaWxsPSIjMjIyIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTQwIiByPSI0MCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==";
        modalImageEl.alt = project.nombre || "Sin nombre";
      }
      if (modalTitleEl) modalTitleEl.textContent = project.nombre || "Sin nombre";
      if (tvStatusBadge) {
        tvStatusBadge.textContent = getStatusLabel(project.estado);
        tvStatusBadge.className = "tv-status-badge " + getStatusClass(project.estado);
      }
    }

    try {
      if (imageModalEl.requestFullscreen) {
        await imageModalEl.requestFullscreen();
      } else if (imageModalEl.webkitRequestFullscreen) { /* Safari */
        await imageModalEl.webkitRequestFullscreen();
      } else if (imageModalEl.msRequestFullscreen) { /* IE11 */
        await imageModalEl.msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen API no soportada o bloqueada:", err);
    }
  });
}

function closeTvMode() {
  imageModalEl.classList.add("hidden");
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => { });
  }
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeTvMode);
}

if (modalImageEl) {
  modalImageEl.addEventListener("click", closeTvMode);
}

if (tvPrevBtn) {
  tvPrevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    prevProject();
    resetCarouselInterval();
  });
}

if (tvNextBtn) {
  tvNextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    nextProject();
    resetCarouselInterval();
  });
}

if (tvPlayPauseBtn) {
  tvPlayPauseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isTvModePaused = !isTvModePaused;
    if (isTvModePaused) {
      if (tvPauseIcon) {
        tvPauseIcon.innerHTML = '<path d="M5 3L19 12L5 21V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>';
      }
    } else {
      if (tvPauseIcon) {
        tvPauseIcon.innerHTML = '<path d="M10 15V9M14 15V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      }
    }
    resetCarouselInterval();
  });
}

const UI_VIEW_MODE_KEY = "imc_ui_view_mode";
const UI_VIEW_MODES = { compact: "compact", detailed: "detailed" };
let currentViewMode = UI_VIEW_MODES.detailed;
let isReactiveSystemReady = false;
const reactiveUnsubscribers = [];
const APP_EVENTS = window.AppServices?.eventos?.EVENTS || {
  WORKFLOW_TASK_TOGGLED: "tareaActualizada",
  WORKFLOW_TASK_COMPLETED: "tareaCompletada",
  WORKFLOW_TASK_REOPENED: "tareaReabierta",
  WORKFLOW_TASK_ADDED: "tareaAgregada",
  WORKFLOW_TASK_UPDATED: "tareaEditada",
  WORKFLOW_TASK_REMOVED: "tareaEliminada",
  PROJECT_STATUS_CHANGED: "estadoProyectoCambiado",
  PROJECT_CHANGED: "proyectoActualizado",
  UI_VIEW_MODE_CHANGED: "modoVistaCambiado"
};

function emitAppEvent(eventName, payload = {}) {
  const emit = window.AppServices?.eventos?.emit;
  if (typeof emit !== "function") return false;
  emit(eventName, payload);
  return true;
}

function onAppEvent(eventName, handler) {
  const on = window.AppServices?.eventos?.on;
  if (typeof on !== "function") return null;
  return on(eventName, handler);
}

function normalizeViewMode(mode) {
  return mode === UI_VIEW_MODES.compact ? UI_VIEW_MODES.compact : UI_VIEW_MODES.detailed;
}

function updateViewModeButtons() {
  if (viewCompactBtn) {
    viewCompactBtn.classList.toggle("active", currentViewMode === UI_VIEW_MODES.compact);
  }
  if (viewDetailedBtn) {
    viewDetailedBtn.classList.toggle("active", currentViewMode === UI_VIEW_MODES.detailed);
  }
}

function applyViewMode(mode, options = {}) {
  const opts = options || {};
  const normalizedMode = normalizeViewMode(mode);
  currentViewMode = normalizedMode;

  document.body.classList.remove("view-compact", "view-detailed");
  document.body.classList.add(normalizedMode === UI_VIEW_MODES.compact ? "view-compact" : "view-detailed");
  updateViewModeButtons();

  if (opts.persist !== false) {
    try {
      localStorage.setItem(UI_VIEW_MODE_KEY, normalizedMode);
    } catch (error) {
      console.warn("No se pudo guardar el modo de vista", error);
    }
  }

  if (opts.emit !== false) {
    emitAppEvent(APP_EVENTS.UI_VIEW_MODE_CHANGED, { mode: normalizedMode, persist: opts.persist !== false });
  }
}

function loadPreferredViewMode() {
  try {
    return normalizeViewMode(localStorage.getItem(UI_VIEW_MODE_KEY));
  } catch (error) {
    return UI_VIEW_MODES.detailed;
  }
}

// Estas variables son manejadas por el carrusel pero se necesitan en app.js para showTab
// Se define aquí como valores por defecto; el carrusel actualiza isCriticalModalOpen directamente  
// si se carga carousel.js como módulo separado. En este build monolítico, se gestionan más abajo.
var isCriticalModalOpen = false;
function closeCriticalTasksPanel() {
  const criticalModalEl = document.getElementById("critical-modal");
  if (!criticalModalEl) return;
  criticalModalEl.classList.add("hidden");
  criticalModalEl.setAttribute("aria-hidden", "true");
  isCriticalModalOpen = false;
  document.body.style.overflow = "";
}

function showTab(tab) {
  if (isCriticalModalOpen) {
    closeCriticalTasksPanel();
  }
  const isDashboard = tab === "dashboard";
  const isGantt = tab === "gantt";
  const isEditor = tab === "editor";
  tabDashboard.classList.toggle("hidden", !isDashboard);
  tabGantt.classList.toggle("hidden", !isGantt);
  tabEditor.classList.toggle("hidden", !isEditor);

  tabDashboardBtn.classList.toggle("active", isDashboard);
  tabGanttBtn.classList.toggle("active", isGantt);
  tabEditorBtn.classList.toggle("active", isEditor);

  if (isEditor) {
    buildProjectOptions();
    startNewProjectDraft();
  } else if (isGantt) {
    renderGantt();
  }
}

tabDashboardBtn.addEventListener("click", () => showTab("dashboard"));
tabGanttBtn.addEventListener("click", () => showTab("gantt"));
tabEditorBtn.addEventListener("click", () => showTab("editor"));
if (viewCompactBtn) {
  viewCompactBtn.addEventListener("click", () => {
    applyViewMode(UI_VIEW_MODES.compact);
  });
}
if (viewDetailedBtn) {
  viewDetailedBtn.addEventListener("click", () => {
    applyViewMode(UI_VIEW_MODES.detailed);
  });
}

function setupReactiveSystem() {
  if (isReactiveSystemReady) return;
  isReactiveSystemReady = true;

  const projectMutationEvents = [
    APP_EVENTS.WORKFLOW_TASK_TOGGLED,
    APP_EVENTS.WORKFLOW_TASK_ADDED,
    APP_EVENTS.WORKFLOW_TASK_UPDATED,
    APP_EVENTS.WORKFLOW_TASK_REMOVED,
    APP_EVENTS.PROJECT_STATUS_CHANGED,
    APP_EVENTS.PROJECT_CHANGED
  ];

  const refreshFromProjectEvent = (eventPacket) => {
    const payload = eventPacket?.payload || {};
    const targetProjectId = Number(payload.projectId);

    renderBoard();
    updateCarousel(currentIndex);

    if (
      Number.isFinite(targetProjectId) &&
      Number(currentEditingProjectId) === targetProjectId
    ) {
      const project = projects.find((item) => Number(item?.id) === targetProjectId);
      if (project) {
        editorSubtasksDraft = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
        renderEditorSubtasks();
        if (editorEstado) editorEstado.value = project.estado || "pendiente";
        updateEditorPreview();
      }
    }
  };

  projectMutationEvents.forEach((eventName) => {
    const unsubscribe = onAppEvent(eventName, refreshFromProjectEvent);
    if (typeof unsubscribe === "function") {
      reactiveUnsubscribers.push(unsubscribe);
    }
  });

  const uiModeUnsubscribe = onAppEvent(APP_EVENTS.UI_VIEW_MODE_CHANGED, (eventPacket) => {
    const payload = eventPacket?.payload || {};
    const mode = normalizeViewMode(payload.mode);
    if (mode !== currentViewMode) {
      applyViewMode(mode, { emit: false, persist: payload.persist !== false });
    }
    renderBoard();
    renderGantt();
  });

  if (typeof uiModeUnsubscribe === "function") {
    reactiveUnsubscribers.push(uiModeUnsubscribe);
  }
}


const ganttGridEl = document.getElementById("gantt-grid");
const ganttSummaryEl = document.getElementById("gantt-summary");
const ganttEmptyEl = document.getElementById("gantt-empty");


const MS_PER_DAY = 24 * 60 * 60 * 1000;
const GANTT_DATE_LABEL_FORMAT = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" });

function parseISODate(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(12, 0, 0, 0);
  return result;
}

function getComputerTodayISO() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return formatISODate(today);
}

function dayDiff(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  from.setHours(12, 0, 0, 0);
  to.setHours(12, 0, 0, 0);
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function getStatusProgress(estado) {
  if (estado === "terminado") return 100;
  if (estado === "proceso") return 60;
  return 20;
}

function getProjectDeliveryCountdown(project) {
  const deliveryDate = parseISODate(project?.fechaFin || "");
  if (!deliveryDate) {
    return { text: "sin fecha", className: "" };
  }

  const today = parseISODate(getComputerTodayISO()) || new Date();
  const daysLeft = dayDiff(today, deliveryDate);

  if (daysLeft < 0) {
    const lateDays = Math.abs(daysLeft);
    return {
      text: `${lateDays} dia${lateDays === 1 ? "" : "s"} tarde`,
      className: "overdue"
    };
  }

  if (daysLeft === 0) {
    return { text: "vence hoy", className: "today" };
  }

  if (daysLeft <= 3) {
    return {
      text: `faltan ${daysLeft} dia${daysLeft === 1 ? "" : "s"}`,
      className: "warning"
    };
  }

  return {
    text: `faltan ${daysLeft} dia${daysLeft === 1 ? "" : "s"}`,
    className: ""
  };
}

function ensureProjectMetadata(project) {
  if (!project || typeof project !== "object") return false;
  if (window.AppModels?.ProyectoModel?.ensureMetadata) {
    return !!window.AppModels.ProyectoModel.ensureMetadata(project);
  }

  let changed = false;
  const nowIso = new Date().toISOString();
  if (!project.createdAt) {
    project.createdAt = nowIso;
    changed = true;
  }
  if (!project.lastActivityAt) {
    project.lastActivityAt = project.createdAt || nowIso;
    changed = true;
  }
  return changed;
}

function touchProjectActivity(project, source = "update") {
  if (!project || typeof project !== "object") return;
  ensureProjectMetadata(project);
  project.lastActivityAt = new Date().toISOString();
  project.lastActivitySource = source;
}

function getOpenCriticalTasksCount(project) {
  const pendingMissing = getMissingRequiredWorkflowTasks(project, "pendiente").length;
  const processMissing = getMissingRequiredWorkflowTasks(project, "proceso").length;
  return pendingMissing + processMissing;
}

function getProjectRiskSnapshot(project) {
  const evaluateRisk = window.AppServices?.validaciones?.evaluateProjectRisk;
  if (typeof evaluateRisk === "function") {
    return evaluateRisk(project, {
      projects,
      parseISODate,
      dayDiff,
      todayISO: getComputerTodayISO(),
      workflowRequiredTasks: WORKFLOW_REQUIRED_TASKS,
      openCriticalTasks: getOpenCriticalTasksCount(project),
      workflowProgress: getProjectWorkflowProgress(project)
    });
  }

  return { level: "low", alerts: [], delayPercent: 0 };
}

function getProjectDependencies(project) {
  if (window.AppModels?.ProyectoModel?.getDependencies) {
    return window.AppModels.ProyectoModel.getDependencies(project);
  }
  if (!Array.isArray(project?.dependencies)) return [];
  return project.dependencies
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function parseDependenciesInput(inputValue, selfProjectId = null) {
  const selfId = Number(selfProjectId);
  const parsed = String(inputValue || "")
    .split(",")
    .map((value) => Number(String(value).trim()))
    .filter((value) => Number.isFinite(value) && value > 0 && value !== selfId);

  return Array.from(new Set(parsed));
}

function formatDependenciesInput(dependencies) {
  if (!Array.isArray(dependencies) || !dependencies.length) return "";
  return dependencies
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .join(", ");
}

function renderRiskBadge(level) {
  const renderFromModule = window.AppUI?.render?.renderRiskBadge;
  if (typeof renderFromModule === "function") {
    return renderFromModule(level);
  }

  const safeLevel = ["low", "medium", "high"].includes(level) ? level : "low";
  const labels = { low: "Riesgo bajo", medium: "Riesgo medio", high: "Riesgo alto" };
  return `<span class="card-risk-badge ${safeLevel}">${labels[safeLevel]}</span>`;
}

function renderAlertList(alerts) {
  const renderFromModule = window.AppUI?.render?.renderAlertList;
  if (typeof renderFromModule === "function") {
    return renderFromModule(alerts, 3);
  }

  if (!Array.isArray(alerts) || !alerts.length) return "";
  const items = alerts.slice(0, 3).map((message) => `
      <div class="card-alert-item">${escapeHtmlAttribute(message)}</div>
    `).join("");
  return `<div class="card-alert-list">${items}</div>`;
}

const WORKFLOW_REQUIRED_TASKS = {
  pendiente: [
    { id: "pendiente-materiales", nombre: "Materiales" },
    { id: "pendiente-planos", nombre: "Planos" }
  ],
  proceso: []
};

const WORKFLOW_DEFAULT_OPTIONAL_TASKS = {
  pendiente: [
    { id: "pendiente-validar", nombre: "Validar" }
  ],
  proceso: []
};

const WORKFLOW_TRANSITIONS = {
  pendiente: ["proceso"],
  proceso: ["pendiente", "terminado"],
  terminado: ["proceso", "pendiente"]
};

function normalizeTaskKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildWorkflowTaskId(phase, name) {
  const key = normalizeTaskKey(name) || `${Date.now()}`;
  return `${phase}-opt-${key}`;
}

function buildWorkflowRequiredTaskId(phase, name) {
  const key = normalizeTaskKey(name) || `${Date.now()}`;
  return `${phase}-req-${key}`;
}

function sanitizeWorkflowTask(task, phase, index = 0) {
  if (typeof task === "string") {
    const nameFromString = task.trim();
    if (!nameFromString) return null;
    return {
      id: buildWorkflowTaskId(phase, `${nameFromString}-${index}`),
      nombre: nameFromString,
      done: false,
      required: false
    };
  }

  if (!task || typeof task !== "object") return null;
  const nombre = (task.nombre || task.name || "").trim();
  if (!nombre) return null;

  let done = false;
  if (typeof task.done === "boolean") {
    done = task.done;
  } else if (typeof task.completada === "boolean") {
    done = task.completada;
  } else if (typeof task.estado === "string") {
    done = task.estado === "terminado";
  }

  return {
    id: String(task.id || buildWorkflowTaskId(phase, `${nombre}-${index}`)),
    nombre,
    done,
    required: !!task.required
  };
}

function extractWorkflowInputTasks(phaseInput) {
  if (!phaseInput) return [];
  if (Array.isArray(phaseInput)) return phaseInput;

  const result = [];
  if (Array.isArray(phaseInput.required)) {
    phaseInput.required.forEach((task) => result.push({ ...task, required: true }));
  }
  if (Array.isArray(phaseInput.optional)) {
    phaseInput.optional.forEach((task) => result.push({ ...task, required: false }));
  }
  if (Array.isArray(phaseInput.tareas)) {
    phaseInput.tareas.forEach((task) => result.push(task));
  }
  return result;
}

function normalizeWorkflowPhase(phase, phaseInput, legacyTasksInput = []) {
  const requiredDefs = WORKFLOW_REQUIRED_TASKS[phase] || [];
  const defaultOptionalDefs = WORKFLOW_DEFAULT_OPTIONAL_TASKS[phase] || [];
  const rawTasks = [
    ...extractWorkflowInputTasks(phaseInput),
    ...(Array.isArray(legacyTasksInput) ? legacyTasksInput : [])
  ];
  const inputTasks = rawTasks
    .map((task, index) => sanitizeWorkflowTask(task, phase, index))
    .filter(Boolean);
  const consumedIndexes = new Set();

  const findAndConsumeMatch = (def) => {
    const defKey = normalizeTaskKey(def.nombre);
    const defIdKey = normalizeTaskKey(def.id);
    for (let i = 0; i < inputTasks.length; i++) {
      if (consumedIndexes.has(i)) continue;
      const task = inputTasks[i];
      const taskKey = normalizeTaskKey(task.nombre);
      const taskIdKey = normalizeTaskKey(task.id);
      if (taskIdKey === defIdKey || taskKey === defKey) {
        consumedIndexes.add(i);
        return task;
      }
    }
    return null;
  };

  const required = requiredDefs.map((def) => {
    const match = findAndConsumeMatch(def);
    return {
      id: def.id,
      nombre: def.nombre,
      done: !!match?.done,
      required: true
    };
  });

  const requiredKeySet = new Set(required.map((task) => normalizeTaskKey(task.nombre)));
  inputTasks.forEach((task, index) => {
    if (consumedIndexes.has(index)) return;
    if (!task.required) return;
    const key = normalizeTaskKey(task.nombre);
    if (!key || requiredKeySet.has(key)) return;
    requiredKeySet.add(key);
    consumedIndexes.add(index);
    required.push({
      id: String(task.id || buildWorkflowRequiredTaskId(phase, `${task.nombre}-${index}`)),
      nombre: task.nombre,
      done: !!task.done,
      required: true
    });
  });

  const optional = [];
  const optionalKeySet = new Set();

  // Rastrear tareas opcionales predeterminadas que fueron eliminadas explÃ­citamente
  const deletedDefaultOptionals = new Set(Array.isArray(phaseInput?.deletedDefaultOptionals) ? phaseInput.deletedDefaultOptionals : []);

  const pushOptionalTask = (taskLike) => {
    const name = (taskLike?.nombre || "").trim();
    if (!name) return;
    const key = normalizeTaskKey(name);
    if (!key) return;
    if (requiredKeySet.has(key)) return;
    if (optionalKeySet.has(key)) return;
    optionalKeySet.add(key);
    optional.push({
      id: String(taskLike.id || buildWorkflowTaskId(phase, name)),
      nombre: name,
      done: !!taskLike.done,
      required: false
    });
  };

  defaultOptionalDefs.forEach((def) => {
    // No agregar tareas opcionales predeterminadas que fueron explícitamente eliminadas
    if (deletedDefaultOptionals.has(def.id)) {
      console.log(`Saltando tarea predeterminada eliminada: ${def.id} (${def.nombre})`);
      return;
    }

    const match = findAndConsumeMatch(def);
    pushOptionalTask({
      id: def.id,
      nombre: def.nombre,
      done: !!match?.done
    });
  });

  inputTasks.forEach((task, index) => {
    if (consumedIndexes.has(index)) return;
    pushOptionalTask(task);
  });

  // Preservar el rastreo de tareas opcionales eliminadas
  return { required, optional, deletedDefaultOptionals: Array.from(deletedDefaultOptionals) };
}

function createDefaultProjectWorkflow(legacyPendingTasks = []) {
  return {
    pendiente: normalizeWorkflowPhase("pendiente", null, legacyPendingTasks),
    proceso: normalizeWorkflowPhase("proceso", null, [])
  };
}

function normalizeProjectWorkflow(project) {
  if (!project || typeof project !== "object") return false;
  const workflowSource = project.workflow && typeof project.workflow === "object"
    ? project.workflow
    : {};
  const legacyPendingTasks = Array.isArray(project.tareas) ? project.tareas : [];
  const normalizedWorkflow = {
    pendiente: normalizeWorkflowPhase("pendiente", workflowSource.pendiente, legacyPendingTasks),
    proceso: normalizeWorkflowPhase("proceso", workflowSource.proceso, [])
  };

  if (JSON.stringify(project.workflow || {}) !== JSON.stringify(normalizedWorkflow)) {
    project.workflow = normalizedWorkflow;
    return true;
  }
  return false;
}

function getProjectWorkflowPhase(project, phase) {
  normalizeProjectWorkflow(project);
  const fallback = { required: [], optional: [], deletedDefaultOptionals: [] };
  return project?.workflow?.[phase] || fallback;
}

function getMissingRequiredWorkflowTasks(project, phase) {
  const phaseData = getProjectWorkflowPhase(project, phase);
  return (phaseData.required || [])
    .filter((task) => !task.done)
    .map((task) => task.nombre);
}

function getWorkflowPhaseCounters(project, phase) {
  const phaseData = getProjectWorkflowPhase(project, phase);
  const required = Array.isArray(phaseData.required) ? phaseData.required : [];
  const optional = Array.isArray(phaseData.optional) ? phaseData.optional : [];
  const allTasks = [...required, ...optional];
  const doneTasks = allTasks.filter((task) => !!task.done).length;
  return {
    total: allTasks.length,
    done: doneTasks
  };
}

function resetWorkflowPhaseTasks(project, phase) {
  const phaseData = getProjectWorkflowPhase(project, phase);
  const required = Array.isArray(phaseData.required) ? phaseData.required : [];
  const optional = Array.isArray(phaseData.optional) ? phaseData.optional : [];
  let changed = false;

  [...required, ...optional].forEach((task) => {
    if (task.done) {
      task.done = false;
      changed = true;
    }
  });

  return changed;
}

function getProjectWorkflowProgress(project) {
  const pendingCounters = getWorkflowPhaseCounters(project, "pendiente");
  const processCounters = getWorkflowPhaseCounters(project, "proceso");

  const pendingRequiredTotal = getProjectWorkflowPhase(project, "pendiente").required.length || 0;
  const processRequiredTotal = getProjectWorkflowPhase(project, "proceso").required.length || 0;

  const pendingRequiredDone = (getProjectWorkflowPhase(project, "pendiente").required || []).filter((task) => !!task.done).length;
  const processRequiredDone = (getProjectWorkflowPhase(project, "proceso").required || []).filter((task) => !!task.done).length;

  const pendingRatio = pendingRequiredTotal ? (pendingRequiredDone / pendingRequiredTotal) : 1;
  const processRatio = processRequiredTotal ? (processRequiredDone / processRequiredTotal) : 1;
  const requiredProgress = Math.round((pendingRatio * 50) + (processRatio * 50));

  const optionalTotal = Math.max(0, (pendingCounters.total - pendingRequiredTotal) + (processCounters.total - processRequiredTotal));
  const optionalDone = Math.max(0, (pendingCounters.done - pendingRequiredDone) + (processCounters.done - processRequiredDone));
  const optionalBonus = optionalTotal ? Math.min(10, Math.round((optionalDone / optionalTotal) * 10)) : 0;

  return Math.max(0, Math.min(100, requiredProgress + optionalBonus));
}

function deriveProjectStatusFromWorkflow(project) {
  const missingPendiente = getMissingRequiredWorkflowTasks(project, "pendiente");
  if (missingPendiente.length) return "pendiente";

  const missingProceso = getMissingRequiredWorkflowTasks(project, "proceso");
  if (missingProceso.length) return "proceso";

  return "terminado";
}

function applyAutoParentStatus(project) {
  if (!project) return false;
  const statusRank = { pendiente: 0, proceso: 1, terminado: 2 };
  const current = ["pendiente", "proceso", "terminado"].includes(project.estado) ? project.estado : "pendiente";
  const derived = deriveProjectStatusFromWorkflow(project);

  // No avanzar automáticamente de fase al marcar checklist:
  // el avance se hace con botones de transición y validaciones.
  // Sí permitimos retroceso automático si el estado quedó inconsistente.
  if ((statusRank[derived] ?? 0) < (statusRank[current] ?? 0)) {
    project.estado = derived;
    return true;
  }
  return false;
}

function canTransitionProjectToStatus(project, targetStatus) {
  const normalizedTarget = ["pendiente", "proceso", "terminado"].includes(targetStatus)
    ? targetStatus
    : "pendiente";
  const currentStatus = ["pendiente", "proceso", "terminado"].includes(project?.estado)
    ? project.estado
    : "pendiente";

  if (normalizedTarget === currentStatus) {
    return { ok: true, message: "" };
  }

  const stateMachine = window.AppServices?.workflow?.projectStateMachine;
  const isAllowedByStatePattern = stateMachine?.canTransition(currentStatus, normalizedTarget);
  const allowedTransitions = WORKFLOW_TRANSITIONS[currentStatus] || [];
  const isAllowedTransition = typeof isAllowedByStatePattern === "boolean"
    ? isAllowedByStatePattern
    : allowedTransitions.includes(normalizedTarget);

  if (!isAllowedTransition) {
    return {
      ok: false,
      message: `TransiciÃ³n no permitida: ${getStatusLabel(currentStatus)} -> ${getStatusLabel(normalizedTarget)}.`
    };
  }

  if (normalizedTarget !== "pendiente") {
    const dependencyIds = getProjectDependencies(project);
    const blockingDependencies = dependencyIds.filter((dependencyId) => {
      const dep = projects.find((item) => Number(item?.id) === Number(dependencyId));
      return dep && dep.estado !== "terminado";
    });
    if (blockingDependencies.length) {
      return {
        ok: false,
        message: "Proyecto bloqueado por dependencia: termina primero los proyectos relacionados."
      };
    }
  }

  if (currentStatus === "pendiente" && normalizedTarget === "proceso") {
    const missingPendiente = getMissingRequiredWorkflowTasks(project, "pendiente");
    if (!missingPendiente.length) {
      return { ok: true, message: "" };
    }
    return {
      ok: false,
      message: `Para pasar a En proceso, completa en Pendiente: ${missingPendiente.join(", ")}.`
    };
  }

  if (currentStatus === "proceso" && normalizedTarget === "terminado") {
    const missingPendiente = getMissingRequiredWorkflowTasks(project, "pendiente");
    if (missingPendiente.length) {
      return {
        ok: false,
        message: `Para terminar, primero completa en Pendiente: ${missingPendiente.join(", ")}.`
      };
    }

    const missingProceso = getMissingRequiredWorkflowTasks(project, "proceso");
    if (missingProceso.length) {
      return {
        ok: false,
        message: `Para terminar, completa en Proceso: ${missingProceso.join(", ")}.`
      };
    }
  }

  return { ok: true, message: "" };
}

function normalizeProjectDates(project, index = 0) {
  ensureProjectMetadata(project);
  let startDate = parseISODate(project.fechaInicio);
  let endDate = parseISODate(project.fechaFin);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  if (!startDate && !endDate) {
    const duration = project.estado === "terminado" ? 7 : project.estado === "proceso" ? 12 : 16;
    startDate = addDays(today, index * 3);
    endDate = addDays(startDate, duration);
  } else if (startDate && !endDate) {
    endDate = addDays(startDate, 10);
  } else if (!startDate && endDate) {
    startDate = addDays(endDate, -10);
  }

  if (endDate.getTime() < startDate.getTime()) {
    endDate = addDays(startDate, 1);
  }

  const normalizedStart = formatISODate(startDate);
  const normalizedEnd = formatISODate(endDate);
  let changed = project.fechaInicio !== normalizedStart || project.fechaFin !== normalizedEnd;

  project.fechaInicio = normalizedStart;
  project.fechaFin = normalizedEnd;
  if (normalizeProjectWorkflow(project)) {
    changed = true;
  }
  if (syncProcessRequiredTasksFromSubtasks(project, project.subtareas)) {
    changed = true;
  }
  if (syncSubtasksFromProcessRequiredTasks(project)) {
    changed = true;
  } else {
    const normalizedSubtasks = sanitizeSubtasks(project.subtareas, normalizedStart, normalizedEnd);
    if (JSON.stringify(project.subtareas || []) !== JSON.stringify(normalizedSubtasks)) {
      project.subtareas = normalizedSubtasks;
      changed = true;
    }
  }
  // Evitar cambios automáticos de estado durante normalización/render.
  // Las transiciones principales se controlan por acciones explícitas del usuario.
  return changed;
}

function sanitizeSubtasks(subtasksInput, fallbackStartISO, fallbackEndISO) {
  const fallbackStart = parseISODate(fallbackStartISO) || new Date();
  fallbackStart.setHours(12, 0, 0, 0);
  let fallbackEnd = parseISODate(fallbackEndISO) || addDays(fallbackStart, 7);
  if (fallbackEnd.getTime() < fallbackStart.getTime()) {
    fallbackEnd = addDays(fallbackStart, 1);
  }

  if (!Array.isArray(subtasksInput)) return [];

  return subtasksInput
    .map((subtask, index) => {
      const baseName = (subtask?.nombre || "").trim() || `Subtarea ${index + 1}`;
      const status = ["pendiente", "proceso", "terminado"].includes(subtask?.estado)
        ? subtask.estado
        : "pendiente";

      let start = parseISODate(subtask?.fechaInicio || subtask?.inicio || "");
      let end = parseISODate(subtask?.fechaFin || subtask?.fin || "");

      if (!start && !end) {
        start = addDays(fallbackStart, index * 2);
        end = addDays(start, 2);
      } else if (start && !end) {
        end = addDays(start, 2);
      } else if (!start && end) {
        start = addDays(end, -2);
      }

      if (end.getTime() < start.getTime()) {
        end = addDays(start, 1);
      }

      const normalizedStart = formatISODate(start);
      const normalizedEnd = formatISODate(end);

      const children = sanitizeSubtasks(
        subtask?.subtareas || [],
        normalizedStart,
        normalizedEnd
      );

      return {
        id: subtask?.id || `sub-${index + 1}-${baseName.toLowerCase().replace(/\s+/g, "-").slice(0, 16)}`,
        nombre: baseName,
        estado: status,
        fechaInicio: normalizedStart,
        fechaFin: normalizedEnd,
        subtareas: children
      };
    })
    .sort((a, b) => {
      const aTime = parseISODate(a.fechaInicio)?.getTime() || 0;
      const bTime = parseISODate(b.fechaInicio)?.getTime() || 0;
      return aTime - bTime;
    });
}

function flattenSubtasks(subtasksInput, level = 0, parentId = "") {
  if (!Array.isArray(subtasksInput)) return [];
  let result = [];
  subtasksInput.forEach((subtask) => {
    result.push({
      ...subtask,
      level,
      parentId,
      hasChildren: Array.isArray(subtask.subtareas) && subtask.subtareas.length > 0
    });
    if (subtask.subtareas?.length) {
      result = result.concat(flattenSubtasks(subtask.subtareas, level + 1, subtask.id));
    }
  });
  return result;
}

function addSubtaskToTree(subtasksInput, parentId, newSubtask) {
  if (!parentId) {
    subtasksInput.push(newSubtask);
    return true;
  }

  for (const subtask of subtasksInput) {
    if (String(subtask.id) === String(parentId)) {
      if (!Array.isArray(subtask.subtareas)) subtask.subtareas = [];
      subtask.subtareas.push(newSubtask);
      return true;
    }
    if (subtask.subtareas?.length) {
      if (addSubtaskToTree(subtask.subtareas, parentId, newSubtask)) {
        return true;
      }
    }
  }
  return false;
}

function updateSubtaskInTree(subtasksInput, subtaskId, updater) {
  for (const subtask of subtasksInput) {
    if (String(subtask.id) === String(subtaskId)) {
      updater(subtask);
      return true;
    }
    if (subtask.subtareas?.length) {
      if (updateSubtaskInTree(subtask.subtareas, subtaskId, updater)) {
        return true;
      }
    }
  }
  return false;
}

function removeSubtaskFromTree(subtasksInput, subtaskId) {
  for (let i = 0; i < subtasksInput.length; i++) {
    if (String(subtasksInput[i].id) === String(subtaskId)) {
      subtasksInput.splice(i, 1);
      return true;
    }
    if (subtasksInput[i].subtareas?.length) {
      if (removeSubtaskFromTree(subtasksInput[i].subtareas, subtaskId)) {
        return true;
      }
    }
  }
  return false;
}

function findSubtaskInTree(subtasksInput, subtaskId) {
  for (const subtask of subtasksInput) {
    if (String(subtask.id) === String(subtaskId)) {
      return subtask;
    }
    if (subtask.subtareas?.length) {
      const found = findSubtaskInTree(subtask.subtareas, subtaskId);
      if (found) return found;
    }
  }
  return null;
}

function countSubtasksRecursive(subtasksInput) {
  if (!Array.isArray(subtasksInput)) return 0;
  return subtasksInput.reduce((acc, subtask) => {
    return acc + 1 + countSubtasksRecursive(subtask.subtareas || []);
  }, 0);
}

function syncProcessRequiredTasksFromSubtasks(project, subtasksInput) {
  if (!project) return false;
  normalizeProjectWorkflow(project);
  const processPhase = getProjectWorkflowPhase(project, "proceso");
  const existingRequired = Array.isArray(processPhase.required) ? processPhase.required : [];
  const processDefs = WORKFLOW_REQUIRED_TASKS.proceso || [];
  const processDefKeys = new Set(processDefs.map((def) => normalizeTaskKey(def.nombre)));

  const fixedRequired = processDefs.map((def) => {
    const previous = existingRequired.find((task) => normalizeTaskKey(task.nombre) === normalizeTaskKey(def.nombre));
    return {
      id: def.id,
      nombre: def.nombre,
      done: !!previous?.done,
      required: true
    };
  });

  const nextRequired = [...fixedRequired];
  const seen = new Set(nextRequired.map((task) => normalizeTaskKey(task.nombre)));

  flattenSubtasks(Array.isArray(subtasksInput) ? subtasksInput : []).forEach((subtask, index) => {
    const nombre = String(subtask?.nombre || "").trim();
    if (!nombre) return;
    const key = normalizeTaskKey(nombre);
    if (!key || seen.has(key) || processDefKeys.has(key)) return;
    seen.add(key);

    const previous = existingRequired.find((task) => normalizeTaskKey(task.nombre) === key);
    const doneFromSubtask = subtask?.estado === "terminado";
    nextRequired.push({
      id: String(previous?.id || buildWorkflowRequiredTaskId("proceso", `${nombre}-${index}`)),
      nombre,
      done: typeof previous?.done === "boolean" ? previous.done : doneFromSubtask,
      required: true
    });
  });

  if (JSON.stringify(existingRequired) === JSON.stringify(nextRequired)) {
    return false;
  }
  processPhase.required = nextRequired;
  return true;
}

function syncSubtasksFromProcessRequiredTasks(project) {
  if (!project) return false;
  normalizeProjectWorkflow(project);
  const processPhase = getProjectWorkflowPhase(project, "proceso");
  const required = Array.isArray(processPhase.required) ? processPhase.required : [];
  const processDefKeys = new Set((WORKFLOW_REQUIRED_TASKS.proceso || []).map((def) => normalizeTaskKey(def.nombre)));
  const requiredSubtaskTasks = required.filter((task) => !processDefKeys.has(normalizeTaskKey(task.nombre)));
  const currentSubtasks = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
  const currentMap = new Map();

  flattenSubtasks(currentSubtasks).forEach((subtask) => {
    const key = normalizeTaskKey(subtask.nombre);
    if (key && !currentMap.has(key)) {
      currentMap.set(key, subtask);
    }
  });

  const fallbackStartISO = project.fechaInicio || getComputerTodayISO();
  const fallbackEndISO = project.fechaFin || formatISODate(addDays(parseISODate(fallbackStartISO) || new Date(), 10));
  const nextSubtasks = sanitizeSubtasks(
    requiredSubtaskTasks.map((task, index) => {
      const key = normalizeTaskKey(task.nombre);
      const previous = currentMap.get(key);
      return {
        id: previous?.id || `sub-proc-${normalizeTaskKey(task.id || task.nombre) || index + 1}`,
        nombre: task.nombre,
        estado: task.done ? "terminado" : "pendiente",
        fechaInicio: previous?.fechaInicio || fallbackStartISO,
        fechaFin: previous?.fechaFin || fallbackEndISO,
        subtareas: []
      };
    }),
    fallbackStartISO,
    fallbackEndISO
  );

  if (JSON.stringify(project.subtareas || []) === JSON.stringify(nextSubtasks)) {
    return false;
  }
  project.subtareas = nextSubtasks;
  return true;
}

function normalizeProjectsSchedule() {
  let changed = false;
  projects.forEach((project, index) => {
    if (normalizeProjectDates(project, index)) {
      changed = true;
    }
  });
  return changed;
}

function renderGantt() {
  if (!ganttGridEl) return;

  normalizeProjectsSchedule();

  if (!projects.length) {
    ganttGridEl.innerHTML = "";
    if (ganttEmptyEl) ganttEmptyEl.classList.remove("hidden");
    if (ganttSummaryEl) ganttSummaryEl.textContent = "Sin proyectos";
    return;
  }

  if (ganttEmptyEl) ganttEmptyEl.classList.add("hidden");

  const projectsSorted = [...projects].sort((a, b) => {
    const aStart = parseISODate(a.fechaInicio)?.getTime() || 0;
    const bStart = parseISODate(b.fechaInicio)?.getTime() || 0;
    return aStart - bStart;
  });

  const starts = [];
  const ends = [];
  projectsSorted.forEach((project) => {
    const projectStart = parseISODate(project.fechaInicio);
    const projectEnd = parseISODate(project.fechaFin);
    if (projectStart) starts.push(projectStart);
    if (projectEnd) ends.push(projectEnd);

    const subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
    project.subtareas = subtareas;
    flattenSubtasks(subtareas).forEach((subtask) => {
      const subStart = parseISODate(subtask.fechaInicio);
      const subEnd = parseISODate(subtask.fechaFin);
      if (subStart) starts.push(subStart);
      if (subEnd) ends.push(subEnd);
    });
  });

  const minStart = starts.length ? new Date(Math.min(...starts.map((date) => date.getTime()))) : new Date();
  const maxEnd = ends.length ? new Date(Math.max(...ends.map((date) => date.getTime()))) : addDays(minStart, 7);
  const timelineStart = addDays(minStart, -1);
  const timelineEnd = addDays(maxEnd, 1);
  const totalDays = Math.max(1, dayDiff(timelineStart, timelineEnd) + 1);
  const daySizePx = 24;
  const timelineWidth = Math.max(totalDays * daySizePx, 640);
  ganttGridEl.dataset.timelineStartIso = formatISODate(timelineStart);
  ganttGridEl.dataset.ganttDaySize = String(daySizePx);

  const scaleLabels = [];
  for (let day = 0; day < totalDays; day += 7) {
    const currentDate = addDays(timelineStart, day);
    const left = day * daySizePx;
    scaleLabels.push(
      `<span class="gantt-scale-label" style="left:${left}px">${GANTT_DATE_LABEL_FORMAT.format(currentDate)}</span>`
    );
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayOffset = dayDiff(timelineStart, today);
  const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;
  const todayLineHtml = showTodayLine ? `<div class="gantt-today-line" style="left:${todayOffset * daySizePx}px"></div>` : "";

  const ganttRows = [];
  const addSubtaskRows = (project, subtasks, parentRowId, level, projectProgress, hiddenByAncestor = false) => {
    subtasks.forEach((subtask) => {
      const subtaskStatus = ["pendiente", "proceso", "terminado"].includes(subtask.estado) ? subtask.estado : "pendiente";
      const subtaskStatusProgress = getStatusProgress(subtaskStatus);
      const alignedProgress = Math.max(0, Math.min(100, Math.round((subtaskStatusProgress * projectProgress) / 100)));
      const rowId = `${parentRowId}/sub-${String(subtask.id)}`;
      const hasChildren = Array.isArray(subtask.subtareas) && subtask.subtareas.length > 0;
      const collapsed = hasChildren && ganttCollapsedIds.has(rowId);
      ganttRows.push({
        kind: "subtask",
        rowId,
        subtaskId: subtask.id,
        title: subtask.nombre,
        start: subtask.fechaInicio,
        end: subtask.fechaFin,
        status: subtaskStatus,
        progress: alignedProgress,
        info: `Subtarea de ${project.nombre}`,
        projectId: project.id,
        level,
        hasChildren,
        collapsed,
        visible: !hiddenByAncestor,
        isCritical: false
      });

      if (hasChildren) {
        addSubtaskRows(project, subtask.subtareas, rowId, level + 1, projectProgress, hiddenByAncestor || collapsed);
      }
    });
  };

  projectsSorted.forEach((project) => {
    ensureProjectMetadata(project);
    normalizeProjectWorkflow(project);
    const subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
    project.subtareas = subtareas;
    const rowId = `project-${project.id}`;
    const projectStatus = ["pendiente", "proceso", "terminado"].includes(project.estado) ? project.estado : "pendiente";
    const projectProgress = getProjectWorkflowProgress(project);
    const projectRisk = getProjectRiskSnapshot(project);
    const hasChildren = subtareas.length > 0;
    const collapsed = hasChildren && ganttCollapsedIds.has(rowId);

    ganttRows.push({
      kind: "project",
      rowId,
      projectId: project.id,
      title: project.nombre,
      start: project.fechaInicio,
      end: project.fechaFin,
      status: projectStatus,
      progress: projectProgress,
      info: `${project.responsable || "Sin asignar"} | ${getStatusLabel(projectStatus)}${projectRisk.level === "high" ? " | Ruta critica" : ""}`,
      level: 0,
      hasChildren,
      collapsed,
      visible: true,
      isCritical: projectRisk.level === "high"
    });

    if (hasChildren) {
      addSubtaskRows(project, subtareas, rowId, 1, projectProgress, collapsed);
    }
  });

  const rowsHtml = ganttRows
    .filter((row) => row.visible !== false)
    .map((row) => {
      const start = parseISODate(row.start) || timelineStart;
      const parsedEnd = parseISODate(row.end) || start;
      const end = parsedEnd.getTime() < start.getTime() ? start : parsedEnd;
      const startOffset = Math.max(0, dayDiff(timelineStart, start));
      const spanDays = Math.max(1, dayDiff(start, end) + 1);
      const barLeft = startOffset * daySizePx;
      const barWidth = Math.max(daySizePx, spanDays * daySizePx);
      const status = ["pendiente", "proceso", "terminado"].includes(row.status) ? row.status : "pendiente";
      const isDelayed = status !== "terminado" && end.getTime() < today.getTime();
      const progress = typeof row.progress === "number"
        ? Math.max(0, Math.min(100, row.progress))
        : getStatusProgress(status);
      const delayedClass = isDelayed ? " delayed" : "";
      const criticalClass = row.isCritical ? " critical" : "";
      const projectIdAttr = row.kind === "project" && row.projectId
        ? ` data-project-id="${escapeHtmlAttribute(String(row.projectId))}"`
        : "";
      const ownerProjectIdAttr = row.projectId
        ? ` data-owner-project-id="${escapeHtmlAttribute(String(row.projectId))}"`
        : "";
      const subtaskIdAttr = row.kind === "subtask" && row.subtaskId
        ? ` data-subtask-id="${escapeHtmlAttribute(String(row.subtaskId))}"`
        : "";
      const isSubtask = row.kind === "subtask";
      const rowClass = isSubtask ? "gantt-row is-subtask" : "gantt-row";
      const indentPx = Math.min(row.level || 0, 8) * 16;
      const toggleHtml = row.hasChildren
        ? `<button type="button" class="gantt-toggle-btn" data-gantt-row-id="${escapeHtmlAttribute(row.rowId)}" aria-label="${row.collapsed ? "Expandir" : "Contraer"} subtareas">${row.collapsed ? "+" : "-"}</button>`
        : `<span class="gantt-toggle-placeholder" aria-hidden="true"></span>`;

      return `
          <div class="${rowClass}" data-gantt-row-id="${escapeHtmlAttribute(row.rowId)}">
            <div class="gantt-row-meta">
              <div class="gantt-row-title" style="padding-left:${indentPx}px;">
                ${toggleHtml}
                <span>${escapeHtmlAttribute(row.title)}</span>
              </div>
              <div class="gantt-row-info">${escapeHtmlAttribute(row.start)} a ${escapeHtmlAttribute(row.end)}</div>
              <div class="gantt-row-info">${escapeHtmlAttribute(row.info)}</div>
            </div>
            <div class="gantt-track" style="width:${timelineWidth}px; --gantt-day-size:${daySizePx}px;">
              <div class="gantt-track-grid"></div>
              <div class="gantt-track-grid week"></div>
              ${todayLineHtml}
              <div class="gantt-bar ${status}${delayedClass}${criticalClass}" data-gantt-kind="${escapeHtmlAttribute(row.kind)}"${projectIdAttr}${ownerProjectIdAttr}${subtaskIdAttr} data-start-iso="${escapeHtmlAttribute(row.start)}" data-end-iso="${escapeHtmlAttribute(row.end)}" style="left:${barLeft}px;width:${barWidth}px;">
                <span class="gantt-resize-handle left" data-action="gantt-resize-left"></span>
                <span class="gantt-bar-progress" style="width:${Math.max(0, progress)}%;"></span>
                <span class="gantt-bar-label">${progress}%</span>
                <span class="gantt-resize-handle right" data-action="gantt-resize-right"></span>
              </div>
            </div>
          </div>
        `;
    })
    .join("");

  ganttGridEl.innerHTML = `
      <div class="gantt-scale-row">
        <div class="gantt-scale-meta">Proyecto</div>
        <div class="gantt-scale-track" style="width:${timelineWidth}px; --gantt-day-size:${daySizePx}px;">
          <div class="gantt-track-grid"></div>
          <div class="gantt-track-grid week"></div>
          ${todayLineHtml}
          ${scaleLabels.join("")}
        </div>
      </div>
      ${rowsHtml}
    `;
  renderGanttDependencyLayer(projectsSorted);

  if (ganttSummaryEl) {
    const totalSubtasks = ganttRows.filter((row) => row.kind === "subtask").length;
    ganttSummaryEl.textContent = `${projects.length} proyecto(s), ${totalSubtasks} subtarea(s) | ${formatISODate(minStart)} a ${formatISODate(maxEnd)}`;
  }
}

function renderGanttDependencyLayer(projectsSorted) {
  if (!ganttGridEl) return;
  const existingLayer = ganttGridEl.querySelector(".gantt-dependency-layer");
  if (existingLayer) existingLayer.remove();

  const dependencyLinks = [];
  (Array.isArray(projectsSorted) ? projectsSorted : []).forEach((project) => {
    const dependencyIds = getProjectDependencies(project);
    dependencyIds.forEach((dependencyId) => {
      dependencyLinks.push({ from: dependencyId, to: Number(project.id) });
    });
  });
  if (!dependencyLinks.length) return;

  const containerRect = ganttGridEl.getBoundingClientRect();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "gantt-dependency-layer");
  svg.setAttribute("width", String(Math.max(0, Math.ceil(containerRect.width))));
  svg.setAttribute("height", String(Math.max(0, Math.ceil(containerRect.height))));

  dependencyLinks.forEach((link) => {
    const fromBar = ganttGridEl.querySelector(`.gantt-bar[data-project-id="${link.from}"]`);
    const toBar = ganttGridEl.querySelector(`.gantt-bar[data-project-id="${link.to}"]`);
    if (!fromBar || !toBar) return;
    const fromProject = (Array.isArray(projectsSorted) ? projectsSorted : []).find((item) => Number(item?.id) === Number(link.from));
    const dependencyBlocked = !!fromProject && fromProject.estado !== "terminado";

    const fromRect = fromBar.getBoundingClientRect();
    const toRect = toBar.getBoundingClientRect();
    const x1 = Math.round(fromRect.right - containerRect.left);
    const y1 = Math.round((fromRect.top + (fromRect.height / 2)) - containerRect.top);
    const x2 = Math.round(toRect.left - containerRect.left);
    const y2 = Math.round((toRect.top + (toRect.height / 2)) - containerRect.top);
    const elbowX = x1 + Math.max(18, Math.round((x2 - x1) * 0.45));

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1} ${y1} L ${elbowX} ${y1} L ${elbowX} ${y2} L ${x2} ${y2}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", dependencyBlocked ? "rgba(248,113,113,0.8)" : "rgba(56,189,248,0.65)");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-dasharray", "4 3");
    svg.appendChild(path);
  });

  if (svg.childNodes.length > 0) {
    ganttGridEl.appendChild(svg);
  }
}

function getGanttTimelineContext() {
  if (!ganttGridEl) return null;
  const timelineStartIso = String(ganttGridEl.dataset.timelineStartIso || "");
  const daySizePx = Number(ganttGridEl.dataset.ganttDaySize || 0);
  const timelineStart = parseISODate(timelineStartIso);
  if (!timelineStart || !Number.isFinite(daySizePx) || daySizePx <= 0) return null;
  return { timelineStart, daySizePx };
}

function computeGanttRangeByDelta(startIso, endIso, mode, deltaDays) {
  const startDate = parseISODate(startIso);
  const endDate = parseISODate(endIso);
  if (!startDate || !endDate) return null;

  let nextStart = new Date(startDate);
  let nextEnd = new Date(endDate);
  if (mode === "move" || mode === "resize-left") {
    nextStart = addDays(nextStart, deltaDays);
  }
  if (mode === "move" || mode === "resize-right") {
    nextEnd = addDays(nextEnd, deltaDays);
  }

  if (nextEnd.getTime() < nextStart.getTime()) {
    if (mode === "resize-left") {
      nextStart = new Date(nextEnd);
    } else if (mode === "resize-right") {
      nextEnd = new Date(nextStart);
    }
  }

  return {
    startDate: nextStart,
    endDate: nextEnd,
    startIso: formatISODate(nextStart),
    endIso: formatISODate(nextEnd)
  };
}

function applyGanttBarPreview(barEl, timelineStart, daySizePx, startDate, endDate) {
  if (!barEl || !timelineStart) return;
  const startOffset = dayDiff(timelineStart, startDate);
  const spanDays = Math.max(1, dayDiff(startDate, endDate) + 1);
  barEl.style.left = `${startOffset * daySizePx}px`;
  barEl.style.width = `${Math.max(daySizePx, spanDays * daySizePx)}px`;
}

function getGanttBarSource(barEl) {
  if (!barEl) return null;
  const kind = String(barEl.dataset.ganttKind || "").trim();
  const ownerProjectId = Number(barEl.dataset.ownerProjectId || barEl.dataset.projectId || "");
  if (!Number.isFinite(ownerProjectId) || !kind) return null;

  const project = projects.find((item) => Number(item?.id) === ownerProjectId);
  if (!project) return null;

  if (kind === "project") {
    return {
      kind,
      projectId: ownerProjectId,
      subtaskId: "",
      startIso: project.fechaInicio,
      endIso: project.fechaFin
    };
  }

  if (kind === "subtask") {
    const subtaskId = String(barEl.dataset.subtaskId || "").trim();
    if (!subtaskId) return null;
    project.subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
    const subtask = findSubtaskInTree(project.subtareas, subtaskId);
    if (!subtask) return null;
    return {
      kind,
      projectId: ownerProjectId,
      subtaskId,
      startIso: subtask.fechaInicio,
      endIso: subtask.fechaFin
    };
  }

  return null;
}

async function applyGanttDateEdit(source, nextStartIso, nextEndIso) {
  if (!source) return false;
  const project = projects.find((item) => Number(item?.id) === Number(source.projectId));
  if (!project) return false;

  const previousSnapshot = cloneSingleProjectSnapshot(project);
  if (!previousSnapshot) return false;
  pushHistorySnapshot();

  let updated = false;
  if (source.kind === "project") {
    project.fechaInicio = nextStartIso;
    project.fechaFin = nextEndIso;
    project.subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
    updated = true;
  } else if (source.kind === "subtask") {
    project.subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
    updated = updateSubtaskInTree(project.subtareas, source.subtaskId, (subtask) => {
      subtask.fechaInicio = nextStartIso;
      subtask.fechaFin = nextEndIso;
    });
    if (updated) {
      project.subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
    }
  }

  if (!updated) return false;

  syncProcessRequiredTasksFromSubtasks(project, project.subtareas);
  syncSubtasksFromProcessRequiredTasks(project);
  normalizeProjectDates(project);
  touchProjectActivity(project, source.kind === "project" ? "gantt-project-dates" : "gantt-subtask-dates");

  const saved = await saveProjects(projects);
  if (!saved) {
    replaceProjectFromSnapshot(project, previousSnapshot);
    setEditorSaveState("error", "No se pudo guardar cambio en Gantt");
    renderGantt();
    return false;
  }

  renderGantt();
  const emitted = emitAppEvent(APP_EVENTS.PROJECT_CHANGED, {
    projectId: project.id,
    source: source.kind === "project" ? "gantt-project-dates" : "gantt-subtask-dates",
    kind: source.kind,
    subtaskId: source.subtaskId || null
  });

  if (!emitted) {
    renderBoard();
    updateCarousel(currentIndex);
  }

  if (currentEditingProjectId === project.id) {
    if (source.kind === "project" && editorFechaFin) {
      editorFechaFin.value = project.fechaFin || editorFechaFin.value;
    }
    editorSubtasksDraft = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
    renderEditorSubtasks();
    updateEditorPreview();
  }

  setEditorSaveState("clean", "Fechas actualizadas desde Gantt");
  return true;
}

function startGanttEditInteraction(event) {
  if (!event || !ganttGridEl) return;
  const target = event.target;
  if (!target || typeof target.closest !== "function") return;
  if (target.closest(".gantt-toggle-btn")) return;

  const barEl = target.closest(".gantt-bar");
  if (!barEl) return;
  const handleEl = target.closest(".gantt-resize-handle");
  const mode = handleEl?.dataset.action === "gantt-resize-left"
    ? "resize-left"
    : handleEl?.dataset.action === "gantt-resize-right"
      ? "resize-right"
      : "move";

  const timeline = getGanttTimelineContext();
  const source = getGanttBarSource(barEl);
  if (!timeline || !source) return;
  const startIso = String(source.startIso || "");
  const endIso = String(source.endIso || "");
  if (!parseISODate(startIso) || !parseISODate(endIso)) return;

  event.preventDefault();
  const pointerId = typeof event.pointerId === "number" ? event.pointerId : 1;
  ganttEditInteraction = {
    pointerId,
    mode,
    barEl,
    source,
    timelineStart: timeline.timelineStart,
    daySizePx: timeline.daySizePx,
    pointerStartX: event.clientX,
    startIso,
    endIso,
    currentStartIso: startIso,
    currentEndIso: endIso
  };
  barEl.classList.add("is-editing");
  if (typeof barEl.setPointerCapture === "function" && typeof event.pointerId === "number") {
    try {
      barEl.setPointerCapture(event.pointerId);
    } catch (_) {
      // Ignorar si el navegador no permite capturar este puntero.
    }
  }
}

function updateGanttEditInteraction(event) {
  const interaction = ganttEditInteraction;
  if (!interaction || !event) return;
  if (typeof event.pointerId === "number" && interaction.pointerId !== event.pointerId) return;

  const deltaPx = event.clientX - interaction.pointerStartX;
  const deltaDays = Math.round(deltaPx / interaction.daySizePx);
  const nextRange = computeGanttRangeByDelta(interaction.startIso, interaction.endIso, interaction.mode, deltaDays);
  if (!nextRange) return;

  interaction.currentStartIso = nextRange.startIso;
  interaction.currentEndIso = nextRange.endIso;
  applyGanttBarPreview(
    interaction.barEl,
    interaction.timelineStart,
    interaction.daySizePx,
    nextRange.startDate,
    nextRange.endDate
  );
}

async function finishGanttEditInteraction(pointerId = null) {
  const interaction = ganttEditInteraction;
  if (!interaction) return;
  if (pointerId !== null && interaction.pointerId !== pointerId) return;

  if (interaction.barEl) {
    interaction.barEl.classList.remove("is-editing");
  }
  ganttEditInteraction = null;

  const hasChanges = interaction.currentStartIso !== interaction.startIso || interaction.currentEndIso !== interaction.endIso;
  if (!hasChanges) {
    renderGantt();
    return;
  }

  await applyGanttDateEdit(interaction.source, interaction.currentStartIso, interaction.currentEndIso);
}

if (ganttGridEl) {
  ganttGridEl.addEventListener("pointerdown", (event) => {
    startGanttEditInteraction(event);
  });

  window.addEventListener("pointermove", (event) => {
    updateGanttEditInteraction(event);
  });

  window.addEventListener("pointerup", async (event) => {
    const pointerId = typeof event.pointerId === "number" ? event.pointerId : null;
    await finishGanttEditInteraction(pointerId);
  });

  window.addEventListener("pointercancel", async (event) => {
    const pointerId = typeof event.pointerId === "number" ? event.pointerId : null;
    await finishGanttEditInteraction(pointerId);
  });

  ganttGridEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;
    const toggleBtn = target.closest(".gantt-toggle-btn");
    if (!toggleBtn) return;

    const rowId = toggleBtn.dataset.ganttRowId;
    if (!rowId) return;

    if (ganttCollapsedIds.has(rowId)) {
      ganttCollapsedIds.delete(rowId);
    } else {
      ganttCollapsedIds.add(rowId);
    }
    renderGantt();
  });
}

function renderBoard() {
  // Aquí puedes implementar la lógica para renderizar el tablero Kanban
  // según los proyectos y sus estados. Esto es solo un placeholder.
  colPendiente.innerHTML = "";
  colProceso.innerHTML = "";
  colTerminado.innerHTML = "";

  projects.forEach((project) => {
    const card = document.createElement("div");
    card.className = "kanban-card";
    card.textContent = project.nombre;

    if (project.estado === "pendiente") {
      colPendiente.appendChild(card);
    } else if (project.estado === "proceso") {
      colProceso.appendChild(card);
    } else if (project.estado === "terminado") {
      colTerminado.appendChild(card);
    }
  });

  countPendiente.textContent = colPendiente.children.length;
  countProceso.textContent = colProceso.children.length;
  countTerminado.textContent = colTerminado.children.length;
}

function buildProjectOptions(selectedId = null) {
  editorSelect.innerHTML = "";
  if (!projects.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No hay proyectos disponibles";
    editorSelect.appendChild(option);
    return;
  }

  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.nombre;
    if (project.id === selectedId) {
      option.selected = true;
    }
    editorSelect.appendChild(option);
  });
}

function agregarSubtarea(tareas, parentId, nuevaSubtarea) {
  for (let tarea of tareas) {
    if (tarea.id === parentId) {
      if (!tarea.subtareas) tarea.subtareas = [];

      tarea.subtareas.push({
        id: Date.now(),
        nombre: nuevaSubtarea.nombre,
        inicio: nuevaSubtarea.inicio,
        fin: nuevaSubtarea.fin,
        estado: nuevaSubtarea.estado || "pendiente",
        subtareas: []
      });

      return true;
    }

    if (tarea.subtareas?.length) {
      const agregado = agregarSubtarea(tarea.subtareas, parentId, nuevaSubtarea);
      if (agregado) return true;
    }
  }

  return false;
}
function actualizarSubtarea(tareas, tareaId, datosActualizados) {
  for (let tarea of tareas) {
    if (tarea.id === tareaId) {
      Object.assign(tarea, datosActualizados);
      return true;
    }

    if (tarea.subtareas?.length) {
      const actualizado = actualizarSubtarea(tarea.subtareas, tareaId, datosActualizados);
      if (actualizado) return true;
    }
  }

  return false;
}

function eliminarTarea(tareas, tareaId) {
  for (let i = 0; i < tareas.length; i++) {
    if (tareas[i].id === tareaId) {
      tareas.splice(i, 1);
      return true;
    }

    if (tareas[i].subtareas?.length) {
      const eliminado = eliminarTarea(tareas[i].subtareas, tareaId);
      if (eliminado) return true;
    }
  }

  return false;
}

function actualizarEstadoTarea(tareas, tareaId, nuevoEstado) {
  for (let tarea of tareas) {
    if (tarea.id === tareaId) {
      tarea.estado = nuevoEstado;
      return true;
    }

    if (tarea.subtareas?.length) {
      const actualizado = actualizarEstadoTarea(tarea.subtareas, tareaId, nuevoEstado);
      if (actualizado) return true;
    }
  }

  return false;
}

function encontrarTarea(tareas, tareaId) {
  for (let tarea of tareas) {
    if (tarea.id === tareaId) {
      return tarea;
    }

    if (tarea.subtareas?.length) {
      const encontrada = encontrarTarea(tarea.subtareas, tareaId);
      if (encontrada) return encontrada;
    }
  }

  return null;
}

function aplanarTareas(tareas, nivel = 0) {
  let resultado = [];

  tareas.forEach(t => {
    resultado.push({
      id: t.id,
      nombre: t.nombre,
      inicio: t.inicio,
      fin: t.fin,
      estado: t.estado,
      nivel: nivel
    });

    if (t.subtareas?.length) {
      resultado = resultado.concat(aplanarTareas(t.subtareas, nivel + 1));
    }
  });

  return resultado;
}

function actualizarResumenGeneral() {
  const total = projects.length;
  const done = projects.filter(p => p.estado === "terminado").length;
  const pending = projects.filter(p => p.estado === "pendiente").length;
  const inProgress = projects.filter(p => p.estado === "proceso").length;
  const completion = total ? Math.round((done / total) * 100) : 0;

  summaryTotalProjectsEl.textContent = `${total} proyecto(s)`;
  summaryDoneProjectsEl.textContent = `${done} terminado(s)`;
  summaryPendingProjectsEl.textContent = `${pending} pendiente(s)`;
  summaryInProgressProjectsEl.textContent = `${inProgress} en proceso(s)`;
  summaryCompletionEl.textContent = `Completitud: ${completion}%`;
  summaryProgressFillEl.style.width = `${completion}%`;
}

function condicionProyecto(proyecto) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const startDate = parseISODate(proyecto.fechaInicio);
  const endDate = parseISODate(proyecto.fechaFin);

  if (proyecto.estado === "terminado") {
    return "terminado";
  } else if (proyecto.estado === "proceso") {
    return "proceso";
  } else if (startDate && endDate) {
    if (today.getTime() < startDate.getTime()) {
      return "pendiente";
    } else if (today.getTime() >= startDate.getTime() && today.getTime() <= endDate.getTime()) {
      return "proceso";
    } else {
      return "pendiente";
    }
  } else {
    return "pendiente";
  }
}

function actualizarResumenProyectoActivo() {
  const proyectoActivo = projects[currentIndex];
  if (!proyectoActivo) {
    summaryActiveProjectEl.textContent = "Ningún proyecto activo";
    summaryActiveStatusEl.textContent = "";
    return;
  }

  summaryActiveProjectEl.textContent = proyectoActivo.nombre || "Proyecto sin nombre";
  summaryActiveStatusEl.textContent = getStatusLabel(proyectoActivo.estado);
}

function getActiveProjectFromCarousel() {
  if (!Array.isArray(projects) || !projects.length) return null;
  if (currentIndex < 0 || currentIndex >= projects.length) currentIndex = 0;
  return projects[currentIndex] || null;
}

function getCriticalTasksSnapshot(project) {
  if (!project) return { pendiente: [], proceso: [], total: 0 };
  const pendiente = getMissingRequiredWorkflowTasks(project, "pendiente");
  const proceso = getMissingRequiredWorkflowTasks(project, "proceso");
  return {
    pendiente,
    proceso,
    total: pendiente.length + proceso.length
  };
}

function updateQuickActionsState(project) {
  const hasProject = !!project;
  const criticalSnapshot = hasProject ? getCriticalTasksSnapshot(project) : { total: 0 };

  if (quickGoProjectBtn) quickGoProjectBtn.disabled = !hasProject;
  if (quickViewCriticalBtn) quickViewCriticalBtn.disabled = !hasProject;
  if (quickMarkProgressBtn) {
    quickMarkProgressBtn.disabled = !hasProject || project.estado === "terminado" || criticalSnapshot.total === 0;
  }
}

function getProjectById(projectId) {
  const numericId = Number(projectId);
  if (!Number.isFinite(numericId)) return null;
  return projects.find((project) => Number(project.id) === numericId) || null;
}

function openProjectInEditor(project) {
  if (!project) return;
  showTab("editor");
  buildProjectOptions(project.id);
  loadProjectIntoForm(project.id);
}

function goToActiveProjectInEditor() {
  const project = getActiveProjectFromCarousel();
  if (!project) return;
  openProjectInEditor(project);
}

async function markProjectCriticalProgress(project, options = {}) {
  const opts = options || {};
  if (!project) return;
  if (project.estado === "terminado") {
    if (opts.showAlerts !== false) {
      await customAlert("Este proyecto ya está terminado.");
    }
    return false;
  }

  normalizeProjectWorkflow(project);
  const preferredOrder = project.estado === "pendiente"
    ? ["pendiente", "proceso"]
    : ["proceso", "pendiente"];

  let selectedTask = null;
  let selectedPhase = "";
  preferredOrder.some((phase) => {
    const phaseData = getProjectWorkflowPhase(project, phase);
    const required = Array.isArray(phaseData.required) ? phaseData.required : [];
    const missing = required.find((task) => !task.done);
    if (!missing) return false;
    selectedTask = missing;
    selectedPhase = phase;
    return true;
  });

  if (!selectedTask || !selectedPhase) {
    if (opts.showAlerts !== false) {
      alert("No hay tareas críticas pendientes para marcar avance.");
    }
    updateQuickActionsState(project);
    return false;
  }

  await setWorkflowTaskDone(project.id, selectedPhase, selectedTask.id, true);
  return true;
}

async function markActiveProjectProgress() {
  const project = getActiveProjectFromCarousel();
  if (!project) return;
  await markProjectCriticalProgress(project, { showAlerts: true });
}

function showActiveProjectCriticalTasks() {
  const project = getActiveProjectFromCarousel();
  if (!project) return;
  openCriticalTasksPanel(project);
}

if (quickGoProjectBtn) quickGoProjectBtn.addEventListener("click", goToActiveProjectInEditor);
if (quickMarkProgressBtn) quickMarkProgressBtn.addEventListener("click", markActiveProjectProgress);
if (quickViewCriticalBtn) quickViewCriticalBtn.addEventListener("click", showActiveProjectCriticalTasks);

function updateCarousel(index) {
  const project = projects[index];
  if (!project) {
    if (projectImageEl) {
      projectImageEl.src = "";
      projectImageEl.alt = "";
    }
    if (projectTitleEl) projectTitleEl.textContent = "";
    if (projectStatusTextEl) projectStatusTextEl.textContent = "";
    if (projectStatusDotEl) projectStatusDotEl.className = "status-dot";
    updateSummaryActiveOrComments();
    updateQuickActionsState(null);
    return;
  }

  if (projectImageEl) {
    projectImageEl.style.opacity = 0;
    projectImageEl.style.transform = "scale(1.03)";
  }

  setTimeout(() => {
    if (projectImageEl) {
      projectImageEl.src = project.imagen || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIFZpZXdCb3g9IjAgMCA0MDAgMjgwIiBmaWxsPSIjMjIyIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTQwIiByPSI0MCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==";
      projectImageEl.alt = project.nombre || "Sin nombre";
    }
    if (projectTitleEl) projectTitleEl.textContent = project.nombre || "Sin nombre";
    if (projectStatusTextEl) projectStatusTextEl.textContent = getStatusLabel(project.estado);

    if (projectStatusDotEl) projectStatusDotEl.className = "status-dot " + getStatusClass(project.estado);

    if (indicatorsEl) {
      indicatorsEl.querySelectorAll(".indicator-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
    }

    // === Sincronizar Modal TV ===
    if (imageModalEl && !imageModalEl.classList.contains("hidden")) {
      if (modalImageEl) {
        modalImageEl.src = project.imagen || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIFZpZXdCb3g9IjAgMCA0MDAgMjgwIiBmaWxsPSIjMjIyIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTQwIiByPSI0MCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==";
        modalImageEl.alt = project.nombre || "Sin nombre";
      }
      if (modalTitleEl) modalTitleEl.textContent = project.nombre || "Sin nombre";
      if (tvStatusBadge) {
        tvStatusBadge.textContent = getStatusLabel(project.estado);
        tvStatusBadge.className = "tv-status-badge " + getStatusClass(project.estado);
      }
    }

    if (projectImageEl) {
      projectImageEl.style.opacity = 1;
      projectImageEl.style.transform = "scale(1)";
    }
    updateSummaryActiveOrComments();
    updateQuickActionsState(project);
  }, 150);
}

// === Editor de proyectos ===
const editorForm = document.getElementById("project-editor-form");
const editorSelect = document.getElementById("editor-project-select");
const editorNombre = document.getElementById("editor-nombre");
const editorEstado = document.getElementById("editor-estado");
const editorEtiqueta = document.getElementById("editor-etiqueta");
const editorDependencies = document.getElementById("editor-dependencies");
const editorImagen = document.getElementById("editor-imagen");
const editorImagenFile = document.getElementById("editor-imagen-file");
const editorResponsable = document.getElementById("editor-responsable");
const editorFechaInicio = document.getElementById("editor-fecha-inicio");
const editorFechaFin = document.getElementById("editor-fecha-fin");
const editorSubtaskName = document.getElementById("editor-subtask-name");
const editorAddSubtaskBtn = document.getElementById("editor-add-subtask-btn");
const editorSubtasksList = document.getElementById("editor-subtasks-list");
const editorSaveBtn = document.getElementById("editor-save-btn");
const editorCreateBtn = document.getElementById("editor-create-btn");
const editorDuplicateBtn = document.getElementById("editor-duplicate-btn");
const editorDeleteBtn = document.getElementById("editor-delete-btn");
const editorUndoBtn = document.getElementById("editor-undo-btn");
const editorRedoBtn = document.getElementById("editor-redo-btn");
const editorPrevBtn = document.getElementById("editor-prev-btn");
const editorNextBtn = document.getElementById("editor-next-btn");
const editorNewBtn = document.getElementById("editor-new-btn");
const editorSaveState = document.getElementById("editor-save-state");
const editorValidation = document.getElementById("editor-validation");
const editorPreviewImage = document.getElementById("editor-preview-image");
const editorPreviewTitle = document.getElementById("editor-preview-title");
const editorPreviewTag = document.getElementById("editor-preview-tag");
const editorPreviewOwner = document.getElementById("editor-preview-owner");
const editorCommentsList = document.getElementById("editor-comments-list");
const editorCommentText = document.getElementById("editor-comment-text");
const editorCommentAuthor = document.getElementById("editor-comment-author");
const editorAddCommentBtn = document.getElementById("editor-add-comment-btn");
const editorPlaceholderImage = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#0f172a"/><stop offset="1" stop-color="#1e293b"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="320" cy="150" r="46" fill="#334155"/><rect x="176" y="230" width="288" height="18" rx="9" fill="#334155"/><rect x="225" y="260" width="190" height="12" rx="6" fill="#475569"/></svg>'
);

let lastUploadedImageDataUrl = null;
let currentEditingProjectId = null;
let editorAutosaveTimer = null;
let isLoadingProjectIntoForm = false;
let editorSubtasksDraft = [];
const ganttCollapsedIds = new Set();
let ganttEditInteraction = null;
const HISTORY_LIMIT = 80;
const LOCAL_IMAGE_TARGET_BYTES = 220 * 1024;
const LOCAL_IMAGE_MAX_DIMENSION = 1280;
const LOCAL_IMAGE_MIN_DIMENSION = 520;
let projectHistoryUndoStack = [];
let projectHistoryRedoStack = [];
let imageUploadRequestId = 0;
let editorLoadedProjectBaseline = null;
let editorHasValidationInteraction = false;

function setEditorSaveState(state, message) {
  if (!editorSaveState) return;
  const textByState = {
    clean: "Sin cambios",
    dirty: "Cambios sin guardar",
    saving: "Guardando...",
    error: "Error al guardar"
  };
  editorSaveState.className = `editor-save-state ${state}`;
  editorSaveState.textContent = message || textByState[state] || textByState.clean;
}

function evaluateEditorValidation() {
  const errors = [];
  const warnings = [];
  const invalidFields = [];
  const warningFields = [];

  const nombre = editorNombre?.value.trim() || "";
  const responsable = editorResponsable?.value.trim() || "";
  const fechaFinRaw = editorFechaFin?.value || "";
  const fechaFinDate = parseISODate(fechaFinRaw);
  const todayDate = parseISODate(getComputerTodayISO());

  if (!nombre) {
    errors.push("Falta el nombre del proyecto.");
    invalidFields.push(editorNombre);
  }

  if (!responsable) {
    errors.push("Falta asignar un responsable.");
    invalidFields.push(editorResponsable);
  }

  if (!fechaFinDate) {
    errors.push("Selecciona una fecha de entrega valida.");
    invalidFields.push(editorFechaFin);
  } else if (todayDate && fechaFinDate.getTime() < todayDate.getTime()) {
    warnings.push("Advertencia: la fecha de entrega es menor a hoy.");
    warningFields.push(editorFechaFin);
  }

  return {
    canSave: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    invalidFields,
    warningFields
  };
}

function applyEditorValidation(validation, showFeedback) {
  [editorNombre, editorResponsable, editorFechaFin].forEach((field) => {
    if (!field) return;
    field.classList.remove("is-invalid");
    field.classList.remove("is-warning");
  });

  if (!showFeedback) {
    if (editorValidation) {
      editorValidation.className = "editor-validation hidden";
      editorValidation.textContent = "";
    }
    return;
  }

  validation.invalidFields.forEach((field) => {
    if (field) field.classList.add("is-invalid");
  });
  validation.warningFields.forEach((field) => {
    if (field) field.classList.add("is-warning");
  });

  if (!editorValidation) return;
  const messages = [...validation.errors, ...validation.warnings];
  if (!messages.length) {
    editorValidation.className = "editor-validation hidden";
    editorValidation.textContent = "";
    return;
  }

  const tone = validation.errors.length ? "error" : "warning";
  editorValidation.className = `editor-validation ${tone}`;
  editorValidation.textContent = messages.join(" ");
}

function formatBytes(bytes) {
  const safeBytes = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (safeBytes >= 1024 * 1024) return `${(safeBytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.round(safeBytes / 1024)} KB`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("No se pudo leer la imagen."));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error("No se pudo leer la imagen."));
    };
    reader.readAsDataURL(file);
  });
}

function loadImageElementFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo procesar la imagen."));
    };
    image.src = objectUrl;
  });
}

function dataUrlByteSize(dataUrl) {
  if (typeof dataUrl !== "string") return 0;
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function renderImageOnCanvas(image, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo preparar el lienzo.");
  }
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

async function optimizeImageForStorage(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const originalBytes = dataUrlByteSize(originalDataUrl) || file.size || 0;

  if (!file?.type?.startsWith("image/")) {
    return {
      dataUrl: originalDataUrl,
      optimized: false,
      originalBytes,
      finalBytes: originalBytes
    };
  }

  const isAnimatedOrVector = file.type === "image/gif" || file.type === "image/svg+xml";
  if (isAnimatedOrVector || originalBytes <= LOCAL_IMAGE_TARGET_BYTES) {
    return {
      dataUrl: originalDataUrl,
      optimized: false,
      originalBytes,
      finalBytes: originalBytes
    };
  }

  const image = await loadImageElementFromFile(file);
  const sourceWidth = Math.max(1, image.naturalWidth || image.width || LOCAL_IMAGE_MAX_DIMENSION);
  const sourceHeight = Math.max(1, image.naturalHeight || image.height || LOCAL_IMAGE_MAX_DIMENSION);
  const fitScale = Math.min(1, LOCAL_IMAGE_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));

  let width = Math.max(1, Math.round(sourceWidth * fitScale));
  let height = Math.max(1, Math.round(sourceHeight * fitScale));
  let quality = 0.82;
  let mimeType = "image/webp";

  let canvas = renderImageOnCanvas(image, width, height);
  let candidateDataUrl = canvas.toDataURL(mimeType, quality);
  if (!candidateDataUrl.startsWith("data:image/webp")) {
    mimeType = "image/jpeg";
    candidateDataUrl = canvas.toDataURL(mimeType, quality);
  }

  let bestDataUrl = candidateDataUrl;
  let bestBytes = dataUrlByteSize(candidateDataUrl);

  for (let i = 0; i < 10 && bestBytes > LOCAL_IMAGE_TARGET_BYTES; i += 1) {
    if (quality > 0.46) {
      quality = Math.max(0.46, quality - 0.08);
    } else if (Math.max(width, height) > LOCAL_IMAGE_MIN_DIMENSION) {
      width = Math.max(1, Math.round(width * 0.88));
      height = Math.max(1, Math.round(height * 0.88));
      canvas = renderImageOnCanvas(image, width, height);
      quality = 0.8;
    } else {
      break;
    }

    const attempt = canvas.toDataURL(mimeType, quality);
    const attemptBytes = dataUrlByteSize(attempt);
    if (attemptBytes <= bestBytes) {
      bestDataUrl = attempt;
      bestBytes = attemptBytes;
    }
  }

  if (bestBytes >= originalBytes) {
    return {
      dataUrl: originalDataUrl,
      optimized: false,
      originalBytes,
      finalBytes: originalBytes
    };
  }

  return {
    dataUrl: bestDataUrl,
    optimized: true,
    originalBytes,
    finalBytes: bestBytes
  };
}

function cloneProjectsSnapshot(projectList) {
  return JSON.parse(JSON.stringify(projectList || []));
}

function cloneSingleProjectSnapshot(project) {
  if (!project || typeof project !== "object") return null;
  return cloneProjectsSnapshot([project])[0] || null;
}

function replaceProjectFromSnapshot(targetProject, sourceSnapshot) {
  if (!targetProject || !sourceSnapshot) return false;
  const normalizedSnapshot = cloneSingleProjectSnapshot(sourceSnapshot);
  if (!normalizedSnapshot) return false;

  Object.keys(targetProject).forEach((key) => {
    delete targetProject[key];
  });
  Object.assign(targetProject, normalizedSnapshot);
  return true;
}

function createHistorySnapshot() {
  return {
    projects: cloneProjectsSnapshot(projects),
    currentEditingProjectId,
    currentIndex
  };
}

function areHistorySnapshotsEqual(a, b) {
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function pushHistorySnapshot() {
  const snapshot = createHistorySnapshot();
  const lastSnapshot = projectHistoryUndoStack[projectHistoryUndoStack.length - 1];
  if (areHistorySnapshotsEqual(snapshot, lastSnapshot)) {
    return;
  }

  projectHistoryUndoStack.push(snapshot);
  if (projectHistoryUndoStack.length > HISTORY_LIMIT) {
    projectHistoryUndoStack.shift();
  }
  projectHistoryRedoStack = [];
  updateHistoryButtons();
}

function clearHistoryStacks() {
  projectHistoryUndoStack = [];
  projectHistoryRedoStack = [];
  updateHistoryButtons();
}

function updateHistoryButtons() {
  if (editorUndoBtn) editorUndoBtn.disabled = projectHistoryUndoStack.length === 0;
  if (editorRedoBtn) editorRedoBtn.disabled = projectHistoryRedoStack.length === 0;
}

async function applyHistorySnapshot(snapshot, source) {
  if (!snapshot) return false;

  projects = cloneProjectsSnapshot(snapshot.projects);
  currentIndex = Number.isInteger(snapshot.currentIndex) ? snapshot.currentIndex : 0;
  if (!projects.length) currentIndex = 0;
  if (currentIndex >= projects.length) currentIndex = projects.length - 1;
  if (currentIndex < 0) currentIndex = 0;

  const saved = await saveProjects(projects);
  if (!saved) {
    setEditorSaveState("error", "No se pudo restaurar");
    return false;
  }

  renderBoard();
  buildIndicators();
  updateCarousel(currentIndex);
  resetCarouselInterval();

  if (!projects.length) {
    buildProjectOptions();
    clearEditorForm();
  } else {
    const preferredId = snapshot.currentEditingProjectId;
    const preferredExists = projects.some((p) => p.id === preferredId);
    const targetId = preferredExists ? preferredId : projects[Math.min(currentIndex, projects.length - 1)].id;
    buildProjectOptions(targetId);
    loadProjectIntoForm(targetId);
  }

  setEditorSaveState("clean", source === "undo" ? "Cambio deshecho" : "Cambio rehecho");
  updateHistoryButtons();
  return true;
}

async function undoProjectChange() {
  if (editorAutosaveTimer) {
    clearTimeout(editorAutosaveTimer);
    editorAutosaveTimer = null;
    await persistCurrentProject("auto");
  }
  if (!projectHistoryUndoStack.length) return;

  const previousSnapshot = projectHistoryUndoStack.pop();
  projectHistoryRedoStack.push(createHistorySnapshot());
  await applyHistorySnapshot(previousSnapshot, "undo");
}

async function redoProjectChange() {
  if (editorAutosaveTimer) {
    clearTimeout(editorAutosaveTimer);
    editorAutosaveTimer = null;
    await persistCurrentProject("auto");
  }
  if (!projectHistoryRedoStack.length) return;

  const nextSnapshot = projectHistoryRedoStack.pop();
  projectHistoryUndoStack.push(createHistorySnapshot());
  await applyHistorySnapshot(nextSnapshot, "redo");
}

function updateEditorNavigationState(validationResult = null) {
  const hasProjects = projects.length > 0;
  const hasMultipleProjects = projects.length > 1;
  const hasSelectedProject = projects.some((project) => Number(project.id) === Number(currentEditingProjectId));
  const validation = validationResult || evaluateEditorValidation();

  if (editorSelect) editorSelect.disabled = !hasProjects;
  if (editorSaveBtn) editorSaveBtn.disabled = !hasSelectedProject || !validation.canSave;
  if (editorDeleteBtn) editorDeleteBtn.disabled = !hasSelectedProject;
  if (editorDuplicateBtn) editorDuplicateBtn.disabled = !hasSelectedProject;
  if (editorPrevBtn) editorPrevBtn.disabled = !hasMultipleProjects;
  if (editorNextBtn) editorNextBtn.disabled = !hasMultipleProjects;
  applyEditorValidation(validation, editorHasValidationInteraction);
  updateHistoryButtons();
}

function updateEditorPreview() {
  const id = currentEditingProjectId;
  const project = projects.find((p) => p.id === id);

  const previewNombre = editorNombre.value.trim() || project?.nombre || "Sin nombre";
  const previewEtiqueta = editorEtiqueta.value.trim() || project?.etiqueta || "General";
  const previewResponsable = editorResponsable.value.trim() || project?.responsable || "Sin asignar";
  const previewFin = editorFechaFin.value || project?.fechaFin || "";
  const previewSubtasks = countSubtasksRecursive(editorSubtasksDraft);
  const previewImagen = lastUploadedImageDataUrl || editorImagen.value.trim() || project?.imagen || "";

  if (editorPreviewTitle) editorPreviewTitle.textContent = previewNombre;
  if (editorPreviewTag) editorPreviewTag.textContent = previewEtiqueta;
  if (editorPreviewOwner) {
    const tramo = previewFin ? ` | Entrega: ${previewFin}` : "";
    const subtasksText = ` | ${previewSubtasks} subtarea(s)`;
    editorPreviewOwner.textContent = `Responsable: ${previewResponsable}${tramo}${subtasksText}`;
  }
  if (editorPreviewImage) editorPreviewImage.src = previewImagen || editorPlaceholderImage;
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderEditorSubtasks() {
  if (!editorSubtasksList) return;

  const fallbackStart = editorFechaInicio?.value || getComputerTodayISO();
  const fallbackEnd = editorFechaFin?.value || fallbackStart;
  const subtareas = sanitizeSubtasks(
    editorSubtasksDraft,
    fallbackStart,
    fallbackEnd
  );
  editorSubtasksDraft = subtareas;
  const flatSubtasks = flattenSubtasks(subtareas);

  if (!flatSubtasks.length) {
    editorSubtasksList.innerHTML = `<div class="editor-subtask-empty">Sin subtareas.</div>`;
    return;
  }

  editorSubtasksList.innerHTML = flatSubtasks.map((subtask) => `
      <div class="editor-subtask-item" data-subtask-id="${escapeHtmlAttribute(subtask.id)}">
        <input class="editor-subtask-inline editor-subtask-item-name" type="text" value="${escapeHtmlAttribute(subtask.nombre)}" style="padding-left:${8 + Math.min(subtask.level, 6) * 14}px" />
        <button type="button" class="editor-subtask-remove">Eliminar</button>
      </div>
    `).join("");
}

function renderEditorComments(comments) {
  if (!editorCommentsList) return;
  const list = Array.isArray(comments) ? comments : [];
  const escape = (v) => String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const formatCommentDate = (iso) => {
    if (!iso) return "";
    const d = parseISODate(iso);
    if (!d) return iso;
    return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  if (!list.length) {
    editorCommentsList.innerHTML = `<div class="editor-comment-empty">No hay comentarios. Añade uno abajo.</div>`;
    return;
  }
  editorCommentsList.innerHTML = list.map((c, index) => {
    const text = escape(c.text || "");
    const author = escape(c.author || "Anónimo");
    const date = formatCommentDate(c.createdAt);
    return `<div class="editor-comment-item" data-comment-index="${index}"><div><div>${text}</div><div class="editor-comment-meta">${author} Â· ${date}</div></div><button type="button" class="editor-comment-delete-btn" data-action="delete-comment" data-comment-index="${index}" title="Eliminar comentario">âœ•</button></div>`;
  }).join("");
}

function scheduleEditorAutosave() {
  if (!currentEditingProjectId || isLoadingProjectIntoForm) return;
  const validation = evaluateEditorValidation();
  if (!validation.canSave) return;

  if (editorAutosaveTimer) {
    clearTimeout(editorAutosaveTimer);
  }

  setEditorSaveState("dirty");
  editorAutosaveTimer = setTimeout(() => {
    persistCurrentProject("auto");
  }, 650);
}

function onEditorFieldChange() {
  if (isLoadingProjectIntoForm) return;
  editorHasValidationInteraction = true;
  const validation = evaluateEditorValidation();
  updateEditorNavigationState(validation);
  updateEditorPreview();
  if (validation.canSave) {
    scheduleEditorAutosave();
  } else {
    if (editorAutosaveTimer) {
      clearTimeout(editorAutosaveTimer);
      editorAutosaveTimer = null;
    }
    if (currentEditingProjectId) {
      setEditorSaveState("dirty", validation.errors[0] || validation.warnings[0] || "Completa los campos requeridos");
    }
  }
}

function buildProjectOptions(selectedId) {
  editorSelect.innerHTML = "";
  const selectedNumericId = Number(selectedId);
  const hasSelectedProject = Number.isFinite(selectedNumericId) && selectedNumericId > 0;

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Nuevo proyecto (campos vacios)";
  emptyOption.selected = !hasSelectedProject;
  editorSelect.appendChild(emptyOption);

  if (!projects.length) {
    updateEditorNavigationState();
    return;
  }

  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = String(project.id);
    option.textContent = project.nombre;
    if (hasSelectedProject && Number(project.id) === selectedNumericId) {
      option.selected = true;
    }
    editorSelect.appendChild(option);
  });
  updateEditorNavigationState();
}

function clearEditorForm() {
  isLoadingProjectIntoForm = true;
  editorHasValidationInteraction = false;
  currentEditingProjectId = null;
  editorLoadedProjectBaseline = null;
  const defaultStartISO = getComputerTodayISO();
  const defaultEnd = addDays(parseISODate(defaultStartISO) || new Date(), 10);
  editorNombre.value = "";
  editorEstado.value = "pendiente";
  editorEtiqueta.value = "";
  if (editorDependencies) editorDependencies.value = "";
  editorImagen.value = "";
  editorResponsable.value = "";
  editorFechaInicio.value = defaultStartISO;
  editorFechaFin.value = formatISODate(defaultEnd);
  editorSubtasksDraft = [];
  if (editorImagenFile) editorImagenFile.value = "";
  lastUploadedImageDataUrl = null;
  isLoadingProjectIntoForm = false;

  renderEditorSubtasks();
  renderEditorComments([]);
  updateEditorPreview();
  setEditorSaveState("clean", "Sin proyectos");
  updateEditorNavigationState();
}

function startNewProjectDraft() {
  if (editorAutosaveTimer) {
    clearTimeout(editorAutosaveTimer);
    editorAutosaveTimer = null;
  }

  isLoadingProjectIntoForm = true;
  editorHasValidationInteraction = false;
  currentEditingProjectId = null;
  editorLoadedProjectBaseline = null;
  if (editorSelect) {
    editorSelect.value = "";
  }

  const todayISO = getComputerTodayISO();
  const draftEnd = formatISODate(addDays(parseISODate(todayISO) || new Date(), 10));
  editorNombre.value = "";
  editorEstado.value = "pendiente";
  editorEtiqueta.value = "";
  if (editorDependencies) editorDependencies.value = "";
  editorImagen.value = "";
  editorResponsable.value = "";
  editorFechaInicio.value = todayISO;
  editorFechaFin.value = draftEnd;
  editorSubtasksDraft = [];
  if (editorImagenFile) editorImagenFile.value = "";
  lastUploadedImageDataUrl = null;

  isLoadingProjectIntoForm = false;
  renderEditorSubtasks();
  renderEditorComments([]);
  updateEditorPreview();
  updateEditorNavigationState();
  setEditorSaveState("dirty", "Listo para crear proyecto");
  if (editorNombre) editorNombre.focus();
}

function loadProjectIntoForm(projectId) {
  const id = typeof projectId === "number" ? projectId : parseInt(editorSelect.value, 10);
  const project = projects.find((p) => p.id === id);
  if (!project) {
    clearEditorForm();
    return;
  }

  isLoadingProjectIntoForm = true;
  editorHasValidationInteraction = false;
  currentEditingProjectId = id;
  editorSelect.value = String(id);
  editorNombre.value = project.nombre || "";
  editorEstado.value = project.estado || "pendiente";
  editorEtiqueta.value = project.etiqueta || "";
  if (editorDependencies) editorDependencies.value = formatDependenciesInput(project.dependencies);
  editorImagen.value = project.imagen || "";
  editorResponsable.value = project.responsable || "";
  normalizeProjectDates(project);
  const todayISO = getComputerTodayISO();
  editorFechaInicio.value = todayISO;
  editorFechaFin.value = project.fechaFin || formatISODate(addDays(parseISODate(todayISO) || new Date(), 10));
  syncSubtasksFromProcessRequiredTasks(project);
  editorSubtasksDraft = sanitizeSubtasks(project.subtareas, editorFechaInicio.value, editorFechaFin.value);
  editorLoadedProjectBaseline = cloneSingleProjectSnapshot(project);
  if (editorImagenFile) editorImagenFile.value = "";
  lastUploadedImageDataUrl = null;
  if (!Array.isArray(project.comments)) project.comments = [];
  isLoadingProjectIntoForm = false;

  renderEditorSubtasks();
  renderEditorComments(project.comments);
  updateEditorPreview();
  setEditorSaveState("clean");
  updateEditorNavigationState();
}

async function persistCurrentProject(source = "manual") {
  const id = currentEditingProjectId;
  const project = projects.find((p) => p.id === id);
  if (!project) return false;

  const validation = evaluateEditorValidation();
  if (!validation.canSave) {
    if (source === "manual") {
      editorHasValidationInteraction = true;
      updateEditorNavigationState(validation);
      setEditorSaveState("error", validation.errors[0] || validation.warnings[0] || "Completa los campos requeridos");
    }
    return false;
  }

  const workflowBeforeNormalization = JSON.stringify(project.workflow || {});
  normalizeProjectWorkflow(project);
  const nombreNuevo = editorNombre.value.trim();

  const siguienteNombre = nombreNuevo || project.nombre;
  const siguienteEstado = project.estado || "pendiente";
  if (editorEstado) editorEstado.value = siguienteEstado;
  const siguienteEtiqueta = editorEtiqueta.value.trim() || "General";
  const siguienteImagen = lastUploadedImageDataUrl || editorImagen.value.trim() || "";
  const siguienteResponsable = editorResponsable.value.trim() || "Sin asignar";
  const siguientesDependencias = parseDependenciesInput(editorDependencies?.value || "", id);
  const todayISO = getComputerTodayISO();
  if (editorFechaInicio) editorFechaInicio.value = todayISO;
  const inicioSeleccionado = parseISODate(todayISO);
  const finSeleccionado = parseISODate(editorFechaFin.value);

  let siguienteInicio = inicioSeleccionado || parseISODate(project.fechaInicio);
  let siguienteFin = finSeleccionado || parseISODate(project.fechaFin);

  if (!siguienteInicio && !siguienteFin) {
    siguienteInicio = new Date();
    siguienteInicio.setHours(12, 0, 0, 0);
    siguienteFin = addDays(siguienteInicio, 10);
  } else if (siguienteInicio && !siguienteFin) {
    siguienteFin = addDays(siguienteInicio, 10);
  } else if (!siguienteInicio && siguienteFin) {
    siguienteInicio = addDays(siguienteFin, -10);
  }

  if (siguienteFin.getTime() < siguienteInicio.getTime()) {
    if (source === "manual") {
      alert("La fecha de fin no puede ser menor que la fecha de inicio.");
    }
    setEditorSaveState("error", "Rango de fechas inválido");
    return false;
  }

  const siguienteFechaInicio = formatISODate(siguienteInicio);
  const siguienteFechaFin = formatISODate(siguienteFin);
  let siguienteSubtareas = sanitizeSubtasks(editorSubtasksDraft, siguienteFechaInicio, siguienteFechaFin);
  syncProcessRequiredTasksFromSubtasks(project, siguienteSubtareas);
  syncSubtasksFromProcessRequiredTasks(project);
  siguienteSubtareas = sanitizeSubtasks(project.subtareas, siguienteFechaInicio, siguienteFechaFin);
  const workflowAfterNormalization = JSON.stringify(project.workflow || {});

  const hayCambios = (
    project.nombre !== siguienteNombre ||
    project.estado !== siguienteEstado ||
    project.etiqueta !== siguienteEtiqueta ||
    project.imagen !== siguienteImagen ||
    project.responsable !== siguienteResponsable ||
    JSON.stringify(getProjectDependencies(project)) !== JSON.stringify(siguientesDependencias) ||
    project.fechaInicio !== siguienteFechaInicio ||
    project.fechaFin !== siguienteFechaFin ||
    workflowBeforeNormalization !== workflowAfterNormalization ||
    JSON.stringify(project.subtareas || []) !== JSON.stringify(siguienteSubtareas)
  );

  if (!hayCambios) {
    setEditorSaveState("clean", "Sin cambios");
    return true;
  }

  pushHistorySnapshot();

  const estadoAnterior = project.estado;
  project.nombre = siguienteNombre;
  project.estado = siguienteEstado;
  project.etiqueta = siguienteEtiqueta;
  project.imagen = siguienteImagen;
  project.responsable = siguienteResponsable;
  project.dependencies = siguientesDependencias;
  project.fechaInicio = siguienteFechaInicio;
  project.fechaFin = siguienteFechaFin;
  project.subtareas = siguienteSubtareas;
  if (
    (estadoAnterior === "proceso" || estadoAnterior === "terminado") &&
    siguienteEstado === "pendiente"
  ) {
    resetWorkflowPhaseTasks(project, "proceso");
  }
  touchProjectActivity(project, source === "auto" ? "autosave" : "manual-edit");

  setEditorSaveState("saving", source === "auto" ? "Guardando..." : "Guardando cambios...");
  const ok = await saveProjects(projects);
  if (!ok) {
    setEditorSaveState("error", "No se pudo guardar");
    return false;
  }

  renderBoard();
  buildIndicators();

  const editedIndex = projects.findIndex((p) => p.id === id);
  if (editedIndex >= 0) {
    currentIndex = editedIndex;
    updateCarousel(currentIndex);
  }

  buildProjectOptions(id);
  updateEditorPreview();
  setEditorSaveState("clean", source === "auto" ? "Guardado automatico" : "Guardado");
  if (source === "manual" && currentEditingProjectId === id) {
    editorLoadedProjectBaseline = cloneSingleProjectSnapshot(project);
  }
  return true;
}

async function switchEditorProject(targetId) {
  if (!Number.isInteger(targetId) || targetId === currentEditingProjectId) {
    return;
  }

  if (editorAutosaveTimer) {
    clearTimeout(editorAutosaveTimer);
    editorAutosaveTimer = null;
  }

  if (currentEditingProjectId) {
    await persistCurrentProject("auto");
  }

  buildProjectOptions(targetId);
  loadProjectIntoForm(targetId);
}

editorSelect.addEventListener("change", async () => {
  const selectedValue = editorSelect.value;
  if (!selectedValue) {
    if (editorAutosaveTimer) {
      clearTimeout(editorAutosaveTimer);
      editorAutosaveTimer = null;
    }
    if (currentEditingProjectId) {
      await persistCurrentProject("auto");
    }
    startNewProjectDraft();
    return;
  }

  const nextId = parseInt(selectedValue, 10);
  if (!Number.isInteger(nextId)) {
    startNewProjectDraft();
    return;
  }
  await switchEditorProject(nextId);
});

if (editorPrevBtn) {
  editorPrevBtn.addEventListener("click", async () => {
    if (projects.length < 2 || !currentEditingProjectId) return;
    const currentEditorIndex = projects.findIndex((p) => p.id === currentEditingProjectId);
    const nextIndex = (currentEditorIndex - 1 + projects.length) % projects.length;
    await switchEditorProject(projects[nextIndex].id);
  });
}

if (editorNextBtn) {
  editorNextBtn.addEventListener("click", async () => {
    if (projects.length < 2 || !currentEditingProjectId) return;
    const currentEditorIndex = projects.findIndex((p) => p.id === currentEditingProjectId);
    const nextIndex = (currentEditorIndex + 1) % projects.length;
    await switchEditorProject(projects[nextIndex].id);
  });
}

[editorNombre, editorEtiqueta, editorDependencies, editorImagen, editorResponsable, editorFechaFin].forEach((field) => {
  if (!field) return;
  field.addEventListener("input", onEditorFieldChange);
  field.addEventListener("change", onEditorFieldChange);
});

if (editorAddSubtaskBtn) {
  editorAddSubtaskBtn.addEventListener("click", () => {
    const nombre = (editorSubtaskName?.value || "").trim();
    if (!nombre) {
      alert("Escribe un nombre para la subtarea.");
      return;
    }

    const fallbackStart = editorFechaInicio?.value || getComputerTodayISO();
    const fallbackEnd = editorFechaFin?.value || fallbackStart;

    editorSubtasksDraft = sanitizeSubtasks(editorSubtasksDraft, fallbackStart, fallbackEnd);
    const alreadyExists = flattenSubtasks(editorSubtasksDraft)
      .some((subtask) => normalizeTaskKey(subtask.nombre) === normalizeTaskKey(nombre));
    if (alreadyExists) {
      alert("Esa subtarea ya existe.");
      return;
    }
    const nuevaSubtarea = sanitizeSubtasks([{
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      nombre,
      estado: "pendiente",
      fechaInicio: fallbackStart,
      fechaFin: fallbackEnd,
      subtareas: []
    }], fallbackStart, fallbackEnd)[0];
    editorSubtasksDraft.push(nuevaSubtarea);

    if (editorSubtaskName) editorSubtaskName.value = "";

    renderEditorSubtasks();
    onEditorFieldChange();
  });
}

if (editorSubtasksList) {
  const updateSubtaskField = (target) => {
    const row = target.closest("[data-subtask-id]");
    if (!row) return false;
    const subtaskId = row.dataset.subtaskId;
    if (!subtaskId) return false;

    return updateSubtaskInTree(editorSubtasksDraft, subtaskId, (subtask) => {
      if (target.classList.contains("editor-subtask-item-name")) {
        subtask.nombre = target.value;
      }
    });
  };

  editorSubtasksList.addEventListener("input", (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;
    if (!updateSubtaskField(target)) return;
    onEditorFieldChange();
  });

  editorSubtasksList.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;
    const removeBtn = target.closest(".editor-subtask-remove");
    if (!removeBtn) return;
    const row = removeBtn.closest("[data-subtask-id]");
    if (!row) return;
    const subtaskId = row.dataset.subtaskId;
    if (!subtaskId) return;
    if (removeSubtaskFromTree(editorSubtasksDraft, subtaskId)) {
      renderEditorSubtasks();
      onEditorFieldChange();
    }
  });
}

if (editorImagenFile) {
  editorImagenFile.addEventListener("change", async () => {
    const requestId = ++imageUploadRequestId;
    const file = editorImagenFile.files && editorImagenFile.files[0];
    if (!file) {
      lastUploadedImageDataUrl = null;
      onEditorFieldChange();
      return;
    }
    setEditorSaveState("saving", "Procesando imagen...");
    try {
      const optimizedImage = await optimizeImageForStorage(file);
      if (requestId !== imageUploadRequestId) return;
      lastUploadedImageDataUrl = optimizedImage.dataUrl || null;
      onEditorFieldChange();
      if (optimizedImage.optimized) {
        setEditorSaveState(
          "dirty",
          `Imagen optimizada: ${formatBytes(optimizedImage.originalBytes)} -> ${formatBytes(optimizedImage.finalBytes)}`
        );
      }
    } catch (error) {
      if (requestId !== imageUploadRequestId) return;
      console.error("Error procesando imagen local", error);
      lastUploadedImageDataUrl = null;
      setEditorSaveState("error", "No se pudo procesar la imagen");
      alert("No se pudo procesar la imagen local. Intenta con otro archivo o con URL.");
    }
  });
}

if (editorPreviewImage) {
  editorPreviewImage.addEventListener("error", () => {
    if (editorPreviewImage.src !== editorPlaceholderImage) {
      editorPreviewImage.src = editorPlaceholderImage;
    }
  });
}

if (editorAddCommentBtn && editorCommentText) {
  editorAddCommentBtn.addEventListener("click", async () => {
    const projectId = currentEditingProjectId;
    const project = projectId ? projects.find((p) => p.id === projectId) : null;
    const text = (editorCommentText.value || "").trim();
    if (!project || !text) {
      if (!project) return;
      if (!text) {
        editorCommentText.focus();
        return;
      }
    }
    if (!Array.isArray(project.comments)) project.comments = [];
    const author = (editorCommentAuthor && editorCommentAuthor.value) ? editorCommentAuthor.value.trim() : "";
    project.comments.push({
      id: Date.now(),
      text: text,
      author: author || "AnÃ³nimo",
      createdAt: new Date().toISOString()
    });
    touchProjectActivity(project, "comment");
    const saved = await saveProjects(projects);
    if (saved) {
      renderEditorComments(project.comments);
      editorCommentText.value = "";
      if (editorCommentAuthor) editorCommentAuthor.value = "";
      setEditorSaveState("clean", "Comentario agregado");
    } else {
      setEditorSaveState("error", "No se pudo guardar el comentario");
    }
  });
}

if (editorCommentsList) {
  editorCommentsList.addEventListener("click", async (event) => {
    const deleteBtn = event.target.closest("[data-action='delete-comment']");
    if (!deleteBtn) return;

    const commentIndex = parseInt(deleteBtn.dataset.commentIndex || "-1", 10);
    if (commentIndex < 0) return;

    const projectId = currentEditingProjectId;
    const project = projectId ? projects.find((p) => p.id === projectId) : null;
    if (!project || !Array.isArray(project.comments)) return;
    if (commentIndex >= project.comments.length) return;

    const confirmDelete = await customConfirm(`¿Eliminar este comentario?`);
    if (!confirmDelete) return;

    project.comments.splice(commentIndex, 1);
    touchProjectActivity(project, "comment-deleted");
    const saved = await saveProjects(projects);
    if (saved) {
      renderEditorComments(project.comments);
      setEditorSaveState("clean", "Comentario eliminado");
    } else {
      project.comments.splice(commentIndex, 0, { id: Date.now(), text: "", author: "", createdAt: "" });
      renderEditorComments(project.comments);
      setEditorSaveState("error", "No se pudo eliminar el comentario");
    }
  });
}

if (editorNewBtn) {
  editorNewBtn.addEventListener("click", () => {
    if (editorAutosaveTimer) {
      clearTimeout(editorAutosaveTimer);
      editorAutosaveTimer = null;
    }
    currentEditingProjectId = null;
    editorLoadedProjectBaseline = null;
    editorNombre.value = "";
    editorImagen.value = "";
    editorResponsable.value = "";
    editorEtiqueta.value = "";
    if (editorDependencies) editorDependencies.value = "";
    if (editorFechaInicio) editorFechaInicio.value = formatISODate(new Date());
    if (editorFechaFin) editorFechaFin.value = "";
    editorSubtasksDraft = [];
    renderEditorSubtasks();
    renderEditorComments([]);
    if (editorSelect) {
      editorSelect.value = "";
    }
    lastUploadedImageDataUrl = null;
    if (editorPreviewImage) {
      editorPreviewImage.src = editorPlaceholderImage;
      editorPreviewImage.alt = "Nuevo Proyecto";
    }
    if (editorPreviewTitle) editorPreviewTitle.textContent = "Nuevo Proyecto";
    if (editorPreviewTag) editorPreviewTag.textContent = "General";
    if (editorPreviewOwner) editorPreviewOwner.textContent = "Sin asignar";

    setEditorSaveState("clean", "Formulario en blanco");
    editorNombre.focus();
  });
}

if (editorCreateBtn) {
  editorCreateBtn.addEventListener("click", async () => {
    if (editorAutosaveTimer) {
      clearTimeout(editorAutosaveTimer);
      editorAutosaveTimer = null;
    }

    const proyectoSeleccionado = projects.find((p) => p.id === currentEditingProjectId);
    if (
      proyectoSeleccionado &&
      editorLoadedProjectBaseline &&
      Number(editorLoadedProjectBaseline.id) === Number(proyectoSeleccionado.id)
    ) {
      replaceProjectFromSnapshot(proyectoSeleccionado, editorLoadedProjectBaseline);
    }

    const nombreNuevo = editorNombre.value.trim();
    const urlImagenNueva = editorImagen.value.trim();
    const responsableNuevo = editorResponsable.value.trim();
    const etiquetaNueva = editorEtiqueta.value.trim();
    const dependenciasNuevas = parseDependenciesInput(editorDependencies?.value || "");
    const fechaInicioNueva = parseISODate(getComputerTodayISO());
    const fechaFinNueva = parseISODate(editorFechaFin.value);

    if (!nombreNuevo) {
      alert("Escribe al menos un nombre para crear un nuevo proyecto.");
      return;
    }

    const maxId = projects.reduce((max, p) => {
      const projectId = Number(p?.id);
      return Number.isFinite(projectId) ? Math.max(max, projectId) : max;
    }, 0);
    const newId = maxId + 1;

    let imagenNueva = undefined;
    if (lastUploadedImageDataUrl) {
      imagenNueva = lastUploadedImageDataUrl;
    } else if (urlImagenNueva) {
      imagenNueva = urlImagenNueva;
    }

    const proyectoBase = projects.find((p) => p.id === currentEditingProjectId);
    let startDate = fechaInicioNueva || parseISODate(getComputerTodayISO());
    let endDate = fechaFinNueva || parseISODate(proyectoBase?.fechaFin || "");

    if (startDate && !endDate) {
      endDate = addDays(startDate, 12);
    }

    if (endDate.getTime() < startDate.getTime()) {
      alert("La fecha de fin no puede ser menor que la fecha de inicio.");
      setEditorSaveState("error", "Rango de fechas inválido");
      return;
    }

    const workflowNuevo = createDefaultProjectWorkflow();

    const nuevoProyecto = {
      id: newId,
      nombre: nombreNuevo,
      responsable: responsableNuevo || (proyectoBase?.responsable || "Sin asignar"),
      estado: "pendiente",
      etiqueta: etiquetaNueva || proyectoBase?.etiqueta || "General",
      fechaInicio: formatISODate(startDate),
      fechaFin: formatISODate(endDate),
      subtareas: sanitizeSubtasks(editorSubtasksDraft, formatISODate(startDate), formatISODate(endDate)),
      workflow: workflowNuevo,
      dependencies: dependenciasNuevas,
      imagen: imagenNueva || proyectoBase?.imagen || "",
      comments: [],
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };
    normalizeProjectWorkflow(nuevoProyecto);
    ensureProjectMetadata(nuevoProyecto);
    syncProcessRequiredTasksFromSubtasks(nuevoProyecto, nuevoProyecto.subtareas);
    syncSubtasksFromProcessRequiredTasks(nuevoProyecto);

    pushHistorySnapshot();
    projects.push(nuevoProyecto);
    const saved = await saveProjects(projects);
    if (!saved) {
      setEditorSaveState("error", "No se pudo crear");
      return;
    }

    buildProjectOptions(newId);
    loadProjectIntoForm(newId);
    renderBoard();
    buildIndicators();
    currentIndex = projects.findIndex((p) => p.id === newId);
    if (currentIndex < 0) currentIndex = 0;
    updateCarousel(currentIndex);
    setEditorSaveState("clean", "Proyecto creado");
  });
}

if (editorDuplicateBtn) {
  editorDuplicateBtn.addEventListener("click", async () => {
    if (!currentEditingProjectId) return;

    if (editorAutosaveTimer) {
      clearTimeout(editorAutosaveTimer);
      editorAutosaveTimer = null;
    }
    await persistCurrentProject("auto");

    const baseProject = projects.find((p) => p.id === currentEditingProjectId);
    if (!baseProject) return;

    const maxId = projects.reduce((max, p) => Math.max(max, p.id || 0), 0);
    const newId = maxId + 1;

    const duplicateTemplate = cloneProjectsSnapshot([baseProject])[0];
    const duplicateStartISO = getComputerTodayISO();
    const duplicateStartDate = parseISODate(duplicateStartISO) || new Date();
    let duplicateEndDate = parseISODate(duplicateTemplate.fechaFin || "");
    if (!duplicateEndDate || duplicateEndDate.getTime() < duplicateStartDate.getTime()) {
      duplicateEndDate = addDays(duplicateStartDate, 12);
    }
    const duplicate = {
      ...duplicateTemplate,
      id: newId,
      nombre: `${baseProject.nombre} (copia)`,
      estado: "pendiente",
      fechaInicio: duplicateStartISO,
      fechaFin: formatISODate(duplicateEndDate),
      subtareas: sanitizeSubtasks(
        duplicateTemplate.subtareas,
        duplicateStartISO,
        formatISODate(duplicateEndDate)
      ),
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      workflow: duplicateTemplate.workflow
        ? cloneProjectsSnapshot([duplicateTemplate.workflow])[0]
        : createDefaultProjectWorkflow(Array.isArray(duplicateTemplate.tareas) ? duplicateTemplate.tareas : [])
    };
    normalizeProjectWorkflow(duplicate);
    ensureProjectMetadata(duplicate);
    touchProjectActivity(duplicate, "duplicated");
    syncProcessRequiredTasksFromSubtasks(duplicate, duplicate.subtareas);
    syncSubtasksFromProcessRequiredTasks(duplicate);

    pushHistorySnapshot();
    projects.push(duplicate);
    const saved = await saveProjects(projects);
    if (!saved) {
      setEditorSaveState("error", "No se pudo duplicar");
      return;
    }

    buildProjectOptions(newId);
    loadProjectIntoForm(newId);
    renderBoard();
    buildIndicators();
    currentIndex = projects.findIndex((p) => p.id === newId);
    if (currentIndex < 0) currentIndex = 0;
    updateCarousel(currentIndex);
    setEditorSaveState("clean", "Proyecto duplicado");
  });
}

if (editorDeleteBtn) {
  editorDeleteBtn.addEventListener("click", async () => {
    if (!projects.length) return;
    const id = currentEditingProjectId;
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    const confirmar = await customConfirm(`¿Seguro que quieres eliminar el proyecto "${project.nombre}"?`);
    if (!confirmar) return;

    pushHistorySnapshot();
    projects = projects.filter((p) => p.id !== id);
    const saved = await saveProjects(projects);
    if (!saved) {
      setEditorSaveState("error", "No se pudo eliminar");
      return;
    }

    if (!projects.length) {
      editorSelect.innerHTML = "";
      clearEditorForm();

      updateCarousel(-1);
      if (indicatorsEl) indicatorsEl.innerHTML = "";

      renderBoard();
      setEditorSaveState("clean", "Proyecto eliminado");
      return;
    }

    if (currentIndex >= projects.length) {
      currentIndex = projects.length - 1;
    }

    const nextProject = projects[Math.min(currentIndex, projects.length - 1)];
    buildProjectOptions(nextProject.id);
    loadProjectIntoForm(nextProject.id);
    renderBoard();
    buildIndicators();
    updateCarousel(currentIndex);
    setEditorSaveState("clean", "Proyecto eliminado");
  });
}

if (editorUndoBtn) {
  editorUndoBtn.addEventListener("click", async () => {
    await undoProjectChange();
  });
}

if (editorRedoBtn) {
  editorRedoBtn.addEventListener("click", async () => {
    await redoProjectChange();
  });
}

editorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (editorAutosaveTimer) {
    clearTimeout(editorAutosaveTimer);
    editorAutosaveTimer = null;
  }
  editorHasValidationInteraction = true;
  updateEditorNavigationState();
  await persistCurrentProject("manual");
});

document.addEventListener("keydown", (e) => {
  if (tabEditor.classList.contains("hidden")) return;

  const hasCommandKey = e.ctrlKey || e.metaKey;
  if (!hasCommandKey) return;

  const key = e.key.toLowerCase();
  const target = e.target;
  const isTypingTarget = !!target && (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );

  const isSaveShortcut = key === "s";
  if (isSaveShortcut) {
    e.preventDefault();
    if (editorAutosaveTimer) {
      clearTimeout(editorAutosaveTimer);
      editorAutosaveTimer = null;
    }
    persistCurrentProject("manual");
    return;
  }

  const isUndoShortcut = key === "z" && !e.shiftKey;
  const isRedoShortcut = (key === "z" && e.shiftKey) || key === "y";
  if (!isUndoShortcut && !isRedoShortcut) return;

  if (isTypingTarget) return; // mantener deshacer nativo dentro de campos
  e.preventDefault();
  if (isUndoShortcut) {
    undoProjectChange();
  } else {
    redoProjectChange();
  }
});

function updateSummaryActiveProject() {
  const activeProject = projects[currentIndex];
  if (!activeProject) {
    if (summaryActiveProjectEl) summaryActiveProjectEl.textContent = "Sin proyecto activo";
    if (summaryActiveStatusEl) summaryActiveStatusEl.textContent = "Estado: Sin datos";
    return;
  }
  if (summaryActiveProjectEl) summaryActiveProjectEl.textContent = activeProject.nombre || "Proyecto sin nombre";
  if (summaryActiveStatusEl) summaryActiveStatusEl.textContent = `Estado: ${getStatusLabel(activeProject.estado || "pendiente")}`;
}

function formatSummaryCommentDate(iso) {
  if (!iso) return "";
  const d = parseISODate(iso);
  if (!d) return iso;
  return d.toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function updateSummaryActiveOrComments() {
  if (!summaryActiveContentEl) return;
  const escape = (v) => String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  if (boardSelectedProjectId != null) {
    const project = projects.find((p) => p.id === boardSelectedProjectId);
    if (!project) {
      boardSelectedProjectId = null;
      updateSummaryActiveOrComments();
      return;
    }
    const comments = Array.isArray(project.comments) ? project.comments : [];
    const projectName = escape(project.nombre || "Proyecto sin nombre");
    const commentsHtml = comments.length
      ? comments.map((c) => {
        const text = escape(c.text || "");
        const author = escape(c.author || "AnÃ³nimo");
        const date = formatSummaryCommentDate(c.createdAt);
        return `<div class="summary-comment-item"><div class="summary-comment-text">${text}</div><div class="summary-comment-meta">${author} Â· ${date}</div></div>`;
      }).join("")
      : `<div class="summary-comment-empty">Sin comentarios.</div>`;
    summaryActiveContentEl.innerHTML = `
        <span class="summary-active-label">Comentarios</span>
        <div class="summary-active-name summary-selected-project-name">${projectName}</div>
        <div class="summary-comments-list">${commentsHtml}</div>
        <button type="button" class="summary-back-active-btn">Mostrar proyecto activo</button>
      `;
    return;
  }
  const activeProject = projects[currentIndex];
  if (!activeProject) {
    summaryActiveContentEl.innerHTML = `
        <span class="summary-active-label">Proyecto activo</span>
        <div class="summary-active-name">Sin proyecto activo</div>
        <div class="summary-active-status">Estado: Sin datos</div>
        <div class="summary-active-hint">Clic en una tarjeta para ver sus comentarios</div>
      `;
    return;
  }
  const name = escape(activeProject.nombre || "Proyecto sin nombre");
  const status = `Estado: ${getStatusLabel(activeProject.estado || "pendiente")}`;
  summaryActiveContentEl.innerHTML = `
      <span class="summary-active-label">Proyecto activo</span>
      <div class="summary-active-name">${name}</div>
      <div class="summary-active-status">${status}</div>
      <div class="summary-active-hint">Clic en una tarjeta para ver sus comentarios</div>
    `;
}

if (summaryActiveWrapEl) {
  summaryActiveWrapEl.addEventListener("click", (e) => {
    if (e.target.closest(".summary-back-active-btn")) {
      boardSelectedProjectId = null;
      updateSummaryActiveOrComments();
    }
  });
}

function renderDoneChecklist(terminados) {
  if (!doneChecklistEl) return;
  doneChecklistEl.innerHTML = "";

  if (!terminados.length) {
    doneChecklistEl.innerHTML = `<div class="done-check-empty">No hay proyectos terminados.</div>`;
    if (doneChecklistCountEl) doneChecklistCountEl.textContent = "0";
    return;
  }

  const fragment = document.createDocumentFragment();
  terminados.forEach((project) => {
    const itemLabel = document.createElement("label");
    itemLabel.className = "done-check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.projectId = String(project.id);

    const text = document.createElement("span");
    text.textContent = project.nombre || "Proyecto sin nombre";

    itemLabel.appendChild(checkbox);
    itemLabel.appendChild(text);
    fragment.appendChild(itemLabel);
  });

  doneChecklistEl.appendChild(fragment);
  if (doneChecklistCountEl) doneChecklistCountEl.textContent = String(terminados.length);
}

function getDoneChecklistReopenTarget() {
  if (!doneReopenTargetEl) return "pendiente";
  return doneReopenTargetEl.value === "proceso" ? "proceso" : "pendiente";
}

function renderSummaryPanel(estadoCounts) {
  const total = projects.length;
  const terminados = estadoCounts.terminado;
  const completion = total
    ? Math.round(projects.reduce((acc, project) => acc + getProjectWorkflowProgress(project), 0) / total)
    : 0;

  if (summaryTotalProjectsEl) summaryTotalProjectsEl.textContent = String(total);
  if (summaryDoneProjectsEl) summaryDoneProjectsEl.textContent = String(terminados);
  if (summaryPendingProjectsEl) summaryPendingProjectsEl.textContent = String(estadoCounts.pendiente);
  if (summaryInprogressProjectsEl) summaryInprogressProjectsEl.textContent = String(estadoCounts.proceso);
  if (summaryCompletionEl) summaryCompletionEl.textContent = `${completion}% avance`;
  if (summaryProgressFillEl) summaryProgressFillEl.style.width = `${completion}%`;
  updateSummaryActiveOrComments();
}

function renderWorkflowPanel(project, phase) {
  const phaseData = getProjectWorkflowPhase(project, phase);
  const required = Array.isArray(phaseData.required) ? phaseData.required : [];
  const optional = Array.isArray(phaseData.optional) ? phaseData.optional : [];
  const tasks = [
    ...required.map((task) => ({ ...task, required: true })),
    ...optional.map((task) => ({ ...task, required: false }))
  ];
  const counters = getWorkflowPhaseCounters(project, phase);

  const panelTitle = phase === "pendiente" ? "Checklist pendiente" : "Checklist proceso";
  const panelHint = phase === "pendiente"
    ? "Debes completar Materiales y Planos para pasar a En proceso."
    : "Completa las tareas requeridas para habilitar Finalizar.";

  const tasksHtml = tasks.map((task) => {
    const optionalControls = task.required
      ? ""
      : `
          <button
            type="button"
            class="workflow-task-control-btn"
            data-action="rename-optional-task"
            data-project-id="${escapeHtmlAttribute(project.id)}"
            data-workflow-phase="${escapeHtmlAttribute(phase)}"
            data-task-id="${escapeHtmlAttribute(task.id)}"
            title="Editar tarea"
            draggable="false"
          >Editar</button>
          <button
            type="button"
            class="workflow-task-control-btn delete"
            data-action="remove-optional-task"
            data-project-id="${escapeHtmlAttribute(project.id)}"
            data-workflow-phase="${escapeHtmlAttribute(phase)}"
            data-task-id="${escapeHtmlAttribute(task.id)}"
            title="Eliminar tarea"
            draggable="false"
          >Quitar</button>
        `;

    return `
        <div class="workflow-task-item">
          <label class="workflow-task-main">
            <input
              type="checkbox"
              class="workflow-task-checkbox"
              data-action="toggle-workflow-task"
              data-project-id="${escapeHtmlAttribute(project.id)}"
              data-workflow-phase="${escapeHtmlAttribute(phase)}"
              data-task-id="${escapeHtmlAttribute(task.id)}"
              ${task.done ? "checked" : ""}
              draggable="false"
            />
            <span class="workflow-task-name ${task.required ? "required" : ""}">${escapeHtmlAttribute(task.nombre)}</span>
          </label>
          <div class="workflow-task-controls">${optionalControls}</div>
        </div>
      `;
  }).join("");

  const optionalAddHtml = (phase === "pendiente" || phase === "proceso") ? `
      <div class="workflow-optional-add">
        <input
          type="text"
          class="workflow-optional-input"
          data-action="add-optional-task-input"
          data-project-id="${escapeHtmlAttribute(project.id)}"
          data-workflow-phase="${escapeHtmlAttribute(phase)}"
          placeholder="${phase === "pendiente" ? "Agregar tarea opcional" : "Agregar tarea de proceso"}"
          draggable="false"
        />
        <button
          type="button"
          class="workflow-optional-add-btn"
          data-action="add-optional-task"
          data-project-id="${escapeHtmlAttribute(project.id)}"
          data-workflow-phase="${escapeHtmlAttribute(phase)}"
          draggable="false"
        >Agregar</button>
      </div>
    ` : "";

  return `
      <div class="workflow-panel">
        <div class="workflow-panel-head">
          <span class="workflow-panel-title">${panelTitle}</span>
          <span class="workflow-panel-state">${counters.done}/${counters.total}</span>
        </div>
        <div class="workflow-task-list">${tasksHtml}</div>
        <div class="workflow-panel-hint">${panelHint}</div>
        ${optionalAddHtml}
      </div>
    `;
}

function findWorkflowTaskRef(project, phase, taskId) {
  const phaseData = getProjectWorkflowPhase(project, phase);
  const required = Array.isArray(phaseData.required) ? phaseData.required : [];
  const optional = Array.isArray(phaseData.optional) ? phaseData.optional : [];

  const inRequired = required.find((task) => String(task.id) === String(taskId));
  if (inRequired) {
    return { task: inRequired, list: required, phaseData, required: true };
  }

  const inOptional = optional.find((task) => String(task.id) === String(taskId));
  if (inOptional) {
    return { task: inOptional, list: optional, phaseData, required: false };
  }

  return null;
}

async function setWorkflowTaskDone(projectId, phase, taskId, checked) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  const taskRef = findWorkflowTaskRef(project, phase, taskId);
  if (!taskRef || taskRef.task.done === checked) return;

  pushHistorySnapshot();
  const previousDone = !!taskRef.task.done;
  const previousStatus = project.estado;
  const previousSubtasks = cloneProjectsSnapshot(project.subtareas || []);
  const previousActivityAt = project.lastActivityAt;
  const previousActivitySource = project.lastActivitySource;
  taskRef.task.done = checked;
  if (
    phase === "pendiente" &&
    checked &&
    taskRef.required &&
    project.estado === "pendiente"
  ) {
    const readyForProcess = canTransitionProjectToStatus(project, "proceso");
    if (readyForProcess.ok) {
      project.estado = "proceso";
    }
  }
  if (phase === "proceso") {
    syncSubtasksFromProcessRequiredTasks(project);
    // Solo permitir ajuste automÃ¡tico al retroceder al desmarcar en Proceso.
    if (!checked) {
      applyAutoParentStatus(project);
    }
  }
  touchProjectActivity(project, `workflow-${phase}`);
  const saved = await saveProjects(projects);
  if (!saved) {
    taskRef.task.done = previousDone;
    project.estado = previousStatus;
    project.subtareas = cloneProjectsSnapshot(previousSubtasks);
    project.lastActivityAt = previousActivityAt;
    project.lastActivitySource = previousActivitySource;
    setEditorSaveState("error", "No se pudo actualizar tarea");
    return;
  }

  const payload = {
    projectId,
    phase,
    taskId,
    checked: !!checked,
    status: project.estado
  };
  const emitted = emitAppEvent(APP_EVENTS.WORKFLOW_TASK_TOGGLED, payload);
  if (checked) {
    emitAppEvent(APP_EVENTS.WORKFLOW_TASK_COMPLETED, payload);
  } else {
    emitAppEvent(APP_EVENTS.WORKFLOW_TASK_REOPENED, payload);
  }

  if (!emitted) {
    renderBoard();
    updateCarousel(currentIndex);
    if (currentEditingProjectId === projectId) {
      editorSubtasksDraft = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
      renderEditorSubtasks();
      updateEditorPreview();
    }
  }
}

async function addOptionalWorkflowTask(projectId, phase, taskName) {
  if (phase !== "pendiente" && phase !== "proceso") return;
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  const name = String(taskName || "").trim();
  if (!name) return;

  const phaseData = getProjectWorkflowPhase(project, phase);
  const required = Array.isArray(phaseData.required) ? phaseData.required : [];
  const optional = Array.isArray(phaseData.optional) ? phaseData.optional : [];
  const newKey = normalizeTaskKey(name);
  const existsInRequired = required.some((task) => normalizeTaskKey(task.nombre) === newKey);
  const existsInOptional = optional.some((task) => normalizeTaskKey(task.nombre) === newKey);

  if (existsInRequired || existsInOptional) {
    alert("Esa tarea ya existe en el checklist.");
    return;
  }

  pushHistorySnapshot();
  const previousSubtasks = cloneProjectsSnapshot(project.subtareas || []);
  const previousActivityAt = project.lastActivityAt;
  const previousActivitySource = project.lastActivitySource;
  const newTask = {
    id: buildWorkflowTaskId(phase, `${name}-${Date.now()}`),
    nombre: name,
    done: false,
    required: false
  };
  optional.push(newTask);
  touchProjectActivity(project, `add-optional-${phase}`);
  const saved = await saveProjects(projects);
  if (!saved) {
    const rollbackIndex = optional.findIndex((task) => task.id === newTask.id);
    if (rollbackIndex >= 0) optional.splice(rollbackIndex, 1);
    if (phase === "proceso") {
      project.subtareas = cloneProjectsSnapshot(previousSubtasks);
    }
    project.lastActivityAt = previousActivityAt;
    project.lastActivitySource = previousActivitySource;
    setEditorSaveState("error", "No se pudo agregar tarea");
    return;
  }

  const emitted = emitAppEvent(APP_EVENTS.WORKFLOW_TASK_ADDED, {
    projectId,
    phase,
    taskId: newTask.id,
    taskName: newTask.nombre
  });
  if (!emitted) {
    renderBoard();
    updateCarousel(currentIndex);
    if (phase === "proceso" && currentEditingProjectId === projectId) {
      editorSubtasksDraft = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
      renderEditorSubtasks();
      updateEditorPreview();
    }
  }
}

async function renameOptionalWorkflowTask(projectId, phase, taskId, nextNameInput) {
  if (phase !== "pendiente" && phase !== "proceso") return;
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  const taskRef = findWorkflowTaskRef(project, phase, taskId);
  if (!taskRef || taskRef.required) return;

  const currentName = String(taskRef.task.nombre || "").trim();
  const nextName = String(nextNameInput || "").trim();
  if (!nextName || nextName === currentName) return;

  const phaseData = getProjectWorkflowPhase(project, phase);
  const required = Array.isArray(phaseData.required) ? phaseData.required : [];
  const optional = Array.isArray(phaseData.optional) ? phaseData.optional : [];
  const nextKey = normalizeTaskKey(nextName);
  const existsInRequired = required.some((task) => normalizeTaskKey(task.nombre) === nextKey);
  const existsInOptional = optional.some(
    (task) => String(task.id) !== String(taskId) && normalizeTaskKey(task.nombre) === nextKey
  );
  if (existsInRequired || existsInOptional) {
    alert("Ya existe una tarea con ese nombre en este checklist.");
    return;
  }

  pushHistorySnapshot();
  const previousName = taskRef.task.nombre;
  const previousSubtasks = cloneProjectsSnapshot(project.subtareas || []);
  const previousActivityAt = project.lastActivityAt;
  const previousActivitySource = project.lastActivitySource;
  taskRef.task.nombre = nextName;
  touchProjectActivity(project, `rename-optional-${phase}`);
  const saved = await saveProjects(projects);
  if (!saved) {
    taskRef.task.nombre = previousName;
    if (phase === "proceso") {
      project.subtareas = cloneProjectsSnapshot(previousSubtasks);
    }
    project.lastActivityAt = previousActivityAt;
    project.lastActivitySource = previousActivitySource;
    setEditorSaveState("error", "No se pudo editar tarea");
    return;
  }

  const emitted = emitAppEvent(APP_EVENTS.WORKFLOW_TASK_UPDATED, {
    projectId,
    phase,
    taskId,
    taskName: nextName
  });
  if (!emitted) {
    renderBoard();
    updateCarousel(currentIndex);
    if (phase === "proceso" && currentEditingProjectId === projectId) {
      editorSubtasksDraft = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
      renderEditorSubtasks();
      updateEditorPreview();
    }
  }
}

async function removeOptionalWorkflowTask(projectId, phase, taskId) {
  if (phase !== "pendiente" && phase !== "proceso") return;
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  const taskRef = findWorkflowTaskRef(project, phase, taskId);
  if (!taskRef || taskRef.required) return;

  const confirmDelete = await customConfirm(`¿Eliminar la tarea "${taskRef.task.nombre}"?`);
  if (!confirmDelete) return;

  const taskIndex = taskRef.list.findIndex((task) => String(task.id) === String(taskId));
  if (taskIndex < 0) return;

  pushHistorySnapshot();
  const previousSubtasks = cloneProjectsSnapshot(project.subtareas || []);
  const previousActivityAt = project.lastActivityAt;
  const previousActivitySource = project.lastActivitySource;
  const removedTask = taskRef.list.splice(taskIndex, 1)[0];

  // Rastrear si la tarea eliminada es una tarea opcional predeterminada
  const defaultOptionalDefs = WORKFLOW_DEFAULT_OPTIONAL_TASKS[phase] || [];
  const isDefaultOptional = defaultOptionalDefs.some((def) => def.id === removedTask.id);
  if (isDefaultOptional) {
    // Marcar esta tarea como eliminada explÃ­citamente para que no se regenere
    const phaseData = taskRef.phaseData;
    if (!Array.isArray(phaseData.deletedDefaultOptionals)) {
      phaseData.deletedDefaultOptionals = [];
    }
    if (!phaseData.deletedDefaultOptionals.includes(removedTask.id)) {
      phaseData.deletedDefaultOptionals.push(removedTask.id);
    }
    console.log("Tarea eliminada marcada como deleted:", removedTask.id, "en fase", phase, "Deleteds ahora:", phaseData.deletedDefaultOptionals);
  }

  touchProjectActivity(project, `remove-optional-${phase}`);
  const saved = await saveProjects(projects);
  if (!saved) {
    taskRef.list.splice(taskIndex, 0, removedTask);

    // Revertir el rastreo si la tarea no se guardÃ³
    if (isDefaultOptional) {
      const phaseData = taskRef.phaseData;
      if (Array.isArray(phaseData.deletedDefaultOptionals)) {
        const idx = phaseData.deletedDefaultOptionals.indexOf(removedTask.id);
        if (idx >= 0) {
          phaseData.deletedDefaultOptionals.splice(idx, 1);
        }
      }
    }

    if (phase === "proceso") {
      project.subtareas = cloneProjectsSnapshot(previousSubtasks);
    }
    project.lastActivityAt = previousActivityAt;
    project.lastActivitySource = previousActivitySource;
    setEditorSaveState("error", "No se pudo eliminar tarea");
    return;
  }

  const emitted = emitAppEvent(APP_EVENTS.WORKFLOW_TASK_REMOVED, {
    projectId,
    phase,
    taskId
  });
  if (!emitted) {
    renderBoard();
    updateCarousel(currentIndex);
    if (phase === "proceso" && currentEditingProjectId === projectId) {
      editorSubtasksDraft = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
      renderEditorSubtasks();
      updateEditorPreview();
    }
  }
}

function renderBoard() {
  if (colPendiente) colPendiente.innerHTML = "";
  if (colProceso) colProceso.innerHTML = "";

  const estadoCounts = { pendiente: 0, proceso: 0, terminado: 0 };
  const terminados = [];

  projects.forEach(project => {
    ensureProjectMetadata(project);
    const estado = ["pendiente", "proceso", "terminado"].includes(project.estado) ? project.estado : "pendiente";
    estadoCounts[estado]++;
    if (estado === "terminado") {
      terminados.push(project);
      return;
    }

    normalizeProjectWorkflow(project);

    const card = document.createElement("article");
    card.className = "card";
    card.draggable = true;
    card.dataset.id = project.id;
    card.dataset.status = estado;

    const workflowHtml = renderWorkflowPanel(project, estado === "pendiente" ? "pendiente" : "proceso");
    const projectProgress = getProjectWorkflowProgress(project);
    const deliveryCountdown = getProjectDeliveryCountdown(project);
    const riskSnapshot = getProjectRiskSnapshot(project);
    const riskBadgeHtml = renderRiskBadge(riskSnapshot.level);
    const riskAlertsHtml = renderAlertList(riskSnapshot.alerts);
    card.dataset.risk = String(riskSnapshot.level || "low");
    const buildStatusActionButton = (targetStatus, label, className) => {
      const transitionCheck = canTransitionProjectToStatus(project, targetStatus);
      const buttonHtml = `
          <button
            type="button"
            class="card-status-action-btn ${className}"
            data-action="transition-status"
            data-target-status="${escapeHtmlAttribute(targetStatus)}"
            ${transitionCheck.ok ? "" : "disabled"}
            title="${escapeHtmlAttribute(transitionCheck.ok ? label : transitionCheck.message)}"
            draggable="false"
          >${label}</button>
        `;
      const blockedHtml = transitionCheck.ok
        ? ""
        : `<div class="card-action-blocked-msg">${escapeHtmlAttribute(transitionCheck.message)}</div>`;
      return { buttonHtml, blockedHtml };
    };

    let statusActionsHtml = "";
    let blockedMsgHtml = "";
    if (estado === "pendiente") {
      const goProcessAction = buildStatusActionButton("proceso", "Pasar a proceso", "to-proceso");
      statusActionsHtml = goProcessAction.buttonHtml;
      blockedMsgHtml = goProcessAction.blockedHtml;
    } else {
      const finishAction = buildStatusActionButton("terminado", "Finalizar", "to-terminado");
      const backAction = buildStatusActionButton("pendiente", "Volver a pendiente", "to-pendiente");
      statusActionsHtml = finishAction.buttonHtml + backAction.buttonHtml;
      blockedMsgHtml = finishAction.blockedHtml || backAction.blockedHtml;
    }

    card.innerHTML = `
        <div class="card-title-row">
          <div class="card-title">${project.nombre}</div>
          ${riskBadgeHtml}
        </div>
        <div class="card-meta">
          <span class="card-tag">${project.etiqueta}</span>
          <div class="card-meta-right">
            <span class="card-owner">${project.responsable}</span>
            <span class="card-meta-separator">|</span>
            <span class="card-deadline ${deliveryCountdown.className}">${escapeHtmlAttribute(deliveryCountdown.text)}</span>
          </div>
        </div>
        ${riskAlertsHtml}
        <div class="card-progress">
          <div class="card-progress-track">
            <div class="card-progress-fill" style="width:${projectProgress}%;"></div>
          </div>
          <span class="card-progress-text">${projectProgress}%</span>
        </div>
        ${workflowHtml}
        <div class="card-status-actions">${statusActionsHtml}</div>
        ${blockedMsgHtml}
      `;

    addDragEvents(card);

    card.addEventListener("click", (e) => {
      const interactive = e.target.closest("button, input, select, textarea, [data-action], .card-status-actions");
      if (interactive) return;
      boardSelectedProjectId = project.id;
      updateSummaryActiveOrComments();
    });

    if (estado === "pendiente" && colPendiente) {
      colPendiente.appendChild(card);
    } else if (estado === "proceso" && colProceso) {
      colProceso.appendChild(card);
    }
  });

  if (!estadoCounts.pendiente && colPendiente) {
    colPendiente.innerHTML = `<div class="empty-text">No hay proyectos pendientes.</div>`;
  }
  if (!estadoCounts.proceso && colProceso) {
    colProceso.innerHTML = `<div class="empty-text">No hay proyectos en proceso.</div>`;
  }

  if (countPendiente) countPendiente.textContent = `${estadoCounts.pendiente} proyecto(s)`;
  if (countProceso) countProceso.textContent = `${estadoCounts.proceso} proyecto(s)`;
  if (countTerminado) countTerminado.textContent = `${estadoCounts.terminado} proyecto(s)`;

  renderDoneChecklist(terminados);
  renderSummaryPanel(estadoCounts);
  renderGantt();
}

async function transitionProjectStatus(projectId, targetStatus, options = {}) {
  if (!Number.isInteger(projectId)) return false;
  const project = projects.find((p) => p.id === projectId);
  if (!project) return false;

  normalizeProjectWorkflow(project);
  const transition = canTransitionProjectToStatus(project, targetStatus);
  if (!transition.ok) {
    if (options.showAlert !== false) {
      alert(transition.message);
    }
    return false;
  }

  pushHistorySnapshot();
  const previousStatus = project.estado;
  const previousWorkflow = cloneProjectsSnapshot([project.workflow || {}])[0];
  const previousActivityAt = project.lastActivityAt;
  const previousActivitySource = project.lastActivitySource;
  project.estado = targetStatus;
  if (
    (previousStatus === "proceso" || previousStatus === "terminado") &&
    targetStatus === "pendiente"
  ) {
    resetWorkflowPhaseTasks(project, "proceso");
  }
  touchProjectActivity(project, `status-${targetStatus}`);

  const saved = await saveProjects(projects);
  if (!saved) {
    project.estado = previousStatus;
    project.workflow = cloneProjectsSnapshot([previousWorkflow])[0];
    project.lastActivityAt = previousActivityAt;
    project.lastActivitySource = previousActivitySource;
    setEditorSaveState("error", "No se pudo actualizar estado");
    return false;
  }

  const emitted = emitAppEvent(APP_EVENTS.PROJECT_STATUS_CHANGED, {
    projectId,
    fromStatus: previousStatus,
    toStatus: targetStatus,
    source: options.source || "manual"
  });
  if (!emitted) {
    renderBoard();
    updateCarousel(currentIndex);
    if (currentEditingProjectId === projectId && editorEstado) {
      editorEstado.value = project.estado;
      updateEditorPreview();
    }
  }
  return true;
}

async function finalizeProjectFromCard(projectId) {
  await transitionProjectStatus(projectId, "terminado");
}

async function onCardStatusTransitionClick(event) {
  const target = event.target;
  if (!target || typeof target.closest !== "function") return;
  const transitionBtn = target.closest("[data-action='transition-status']");
  if (!transitionBtn) return;

  event.preventDefault();
  event.stopPropagation();

  if (transitionBtn.disabled) {
    if (transitionBtn.title) alert(transitionBtn.title);
    return;
  }

  const card = transitionBtn.closest(".card");
  if (!card) return;
  const projectId = parseInt(card.dataset.id || "", 10);
  const targetStatus = transitionBtn.dataset.targetStatus || "";
  if (!targetStatus) return;
  await transitionProjectStatus(projectId, targetStatus);
}

async function onBoardWorkflowClick(event) {
  const target = event.target;
  if (!target || typeof target.closest !== "function") return;

  const renameBtn = target.closest("[data-action='rename-optional-task']");
  if (renameBtn) {
    event.preventDefault();
    event.stopPropagation();

    const projectId = parseInt(renameBtn.dataset.projectId || "", 10);
    const phase = renameBtn.dataset.workflowPhase || "pendiente";
    const taskId = renameBtn.dataset.taskId || "";
    if (!Number.isInteger(projectId) || !taskId) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const taskRef = findWorkflowTaskRef(project, phase, taskId);
    if (!taskRef || taskRef.required) return;

    const nextName = window.prompt("Nuevo nombre para la tarea:", taskRef.task.nombre || "");
    if (nextName === null) return;
    await renameOptionalWorkflowTask(projectId, phase, taskId, nextName);
    return;
  }

  const removeBtn = target.closest("[data-action='remove-optional-task']");
  if (removeBtn) {
    event.preventDefault();
    event.stopPropagation();

    const projectId = parseInt(removeBtn.dataset.projectId || "", 10);
    const phase = removeBtn.dataset.workflowPhase || "pendiente";
    const taskId = removeBtn.dataset.taskId || "";
    if (!Number.isInteger(projectId) || !taskId) return;

    await removeOptionalWorkflowTask(projectId, phase, taskId);
    return;
  }

  const addBtn = target.closest("[data-action='add-optional-task']");
  if (!addBtn) return;

  event.preventDefault();
  event.stopPropagation();

  const projectId = parseInt(addBtn.dataset.projectId || "", 10);
  const phase = addBtn.dataset.workflowPhase || "pendiente";
  if (!Number.isInteger(projectId)) return;

  const panel = addBtn.closest(".workflow-panel");
  const input = panel?.querySelector("[data-action='add-optional-task-input']");
  if (!input) return;

  const taskName = input.value.trim();
  if (!taskName) {
    input.focus();
    return;
  }

  await addOptionalWorkflowTask(projectId, phase, taskName);
}

async function onBoardWorkflowChange(event) {
  const target = event.target;
  if (!target || typeof target.closest !== "function") return;

  const checkbox = target.closest("[data-action='toggle-workflow-task']");
  if (!checkbox) return;

  const projectId = parseInt(checkbox.dataset.projectId || "", 10);
  const phase = checkbox.dataset.workflowPhase || "";
  const taskId = checkbox.dataset.taskId || "";
  if (!Number.isInteger(projectId) || !phase || !taskId) return;

  await setWorkflowTaskDone(projectId, phase, taskId, !!checkbox.checked);
}

async function onBoardWorkflowKeydown(event) {
  if (event.key !== "Enter") return;
  const target = event.target;
  if (!target || typeof target.closest !== "function") return;
  if (!target.matches("[data-action='add-optional-task-input']")) return;

  event.preventDefault();
  const input = target;
  const projectId = parseInt(input.dataset.projectId || "", 10);
  const phase = input.dataset.workflowPhase || "pendiente";
  if (!Number.isInteger(projectId)) return;

  const taskName = input.value.trim();
  if (!taskName) return;
  await addOptionalWorkflowTask(projectId, phase, taskName);
}

function addDragEvents(card) {
  card.addEventListener("dragstart", (e) => {
    const dragOrigin = e.target;
    if (dragOrigin && typeof dragOrigin.closest === "function") {
      const interactive = dragOrigin.closest("button, input, select, textarea, label");
      if (interactive && interactive !== card) {
        e.preventDefault();
        return;
      }
    }
    e.dataTransfer.setData("text/plain", card.dataset.id);
    setTimeout(() => {
      card.style.opacity = "0.3";
    }, 0);
  });

  card.addEventListener("dragend", () => {
    card.style.opacity = "1";
  });
}

[colPendiente, colProceso].forEach((column) => {
  if (!column) return;
  column.addEventListener("mousedown", (event) => {
    const target = event.target;
    if (
      target &&
      typeof target.closest === "function" &&
      target.closest(".card-status-action-btn, .workflow-optional-add-btn, .workflow-task-control-btn")
    ) {
      event.preventDefault();
    }
  });
  column.addEventListener("click", onCardStatusTransitionClick);
  column.addEventListener("click", onBoardWorkflowClick);
  column.addEventListener("change", onBoardWorkflowChange);
  column.addEventListener("keydown", onBoardWorkflowKeydown);
});

if (doneChecklistEl) {
  doneChecklistEl.addEventListener("change", async (event) => {
    const checkbox = event.target;
    if (!checkbox || checkbox.tagName !== "INPUT" || checkbox.type !== "checkbox") return;

    const projectId = parseInt(checkbox.dataset.projectId || "", 10);
    if (!Number.isInteger(projectId)) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    if (!checkbox.checked && project.estado === "terminado") {
      const targetStatus = getDoneChecklistReopenTarget();
      const reopened = await transitionProjectStatus(projectId, targetStatus, { showAlert: false });
      if (!reopened) {
        checkbox.checked = true;
      }
    } else {
      checkbox.checked = true;
    }
  });
}

document.querySelectorAll(".column[data-status]").forEach(column => {
  column.addEventListener("dragover", (e) => {
    e.preventDefault();
    column.classList.add("drop-target");
  });

  column.addEventListener("dragleave", () => {
    column.classList.remove("drop-target");
  });

  column.addEventListener("drop", async (e) => {
    e.preventDefault();
    column.classList.remove("drop-target");

    const projectId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const newStatus = column.dataset.status;

    const project = projects.find(p => p.id === projectId);
    if (project && project.estado !== newStatus) {
      await transitionProjectStatus(projectId, newStatus);
    }
  });
});

// === Inicializar todo ===
async function init() {
  // Esperar a que Firebase se inicialice (con timeout de 4 segundos)
  try {
    if (window.firebaseReadyPromise) {
      await Promise.race([
        window.firebaseReadyPromise,
        new Promise(resolve => setTimeout(() => resolve(false), 4000))
      ]);
    } else {
      // Fallback: esperar un momento por si Firebase carga tarde
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  } catch (e) {
    console.warn("Error esperando Firebase:", e);
  }
  try { if (typeof cleanupLegacyScrumStorageKeys === 'function') cleanupLegacyScrumStorageKeys(); } catch (e) { /* ignorar */ }

  // Cargar proyectos (desde Firestore o localStorage)
  let loadedProjects = null;
  try {
    if (typeof loadProjects === 'function') {
      loadedProjects = await loadProjects();
    } else {
      // Fallback: acceder a localStorage directamente si storage.js no exportó loadProjects
      try {
        const raw = localStorage.getItem("tablero_proyectos_data");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) loadedProjects = parsed;
        }
      } catch (e) { /* ignorar errores de localStorage */ }
    }
  } catch (e) {
    console.warn("Error cargando proyectos:", e);
  }

  if (Array.isArray(loadedProjects) && loadedProjects.length > 0) {
    projects = loadedProjects;
  } else {
    // Sin datos guardados: usar proyectos de demostración y guardarlos
    projects = defaultProjects;
    try {
      if (typeof saveProjects === 'function') {
        await saveProjects(projects);
      } else {
        localStorage.setItem("tablero_proyectos_data", JSON.stringify(projects));
      }
    } catch (e) { /* ignorar errores de guardado */ }
  }

  try {
    const schedulesWereNormalized = normalizeProjectsSchedule();
    if (schedulesWereNormalized && typeof saveProjects === 'function') {
      await saveProjects(projects);
    }
  } catch (e) { console.warn('Error normalizando schedule:', e); }

  try { clearHistoryStacks(); } catch (e) { console.warn('Error limpiando historial:', e); }
  try { setupReactiveSystem(); } catch (e) { console.warn('Error configurando sistema reactivo:', e); }
  try { applyViewMode(loadPreferredViewMode(), { persist: false, emit: false }); } catch (e) { console.warn('Error aplicando modo de vista:', e); }

  try { if (typeof setupRealtimeSync === 'function') await setupRealtimeSync(); } catch (e) { console.warn('Error configurando sync:', e); }

  try { buildProjectOptions(); } catch (e) { console.warn('Error construyendo opciones:', e); }
  try { startNewProjectDraft(); } catch (e) { console.warn('Error iniciando borrador:', e); }

  try { buildIndicators(); } catch (e) { console.warn('Error construyendo indicadores:', e); }
  try { updateCarousel(currentIndex); } catch (e) { console.warn('Error actualizando carrusel:', e); }
  try { resetCarouselInterval(); } catch (e) { console.warn('Error reseteando carrusel:', e); }
  try { renderBoard(); } catch (e) { console.error('Error renderizando tablero:', e); }

  try {
    const syncStatusEl = document.getElementById("sync-status");
    const syncStatusTextEl = document.getElementById("sync-status-text");
    if (window.firebaseReady) {
      syncStatusEl.className = "sync-status synced";
      syncStatusTextEl.textContent = "Sincronizado";
    } else {
      syncStatusEl.className = "sync-status local";
      syncStatusTextEl.textContent = "Modo local";
    }
  } catch (e) { /* ignorar */ }
}

init();
