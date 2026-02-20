// js/carousel.js

// === Referencias del carrusel ===
const imgEl = document.getElementById("project-image");
const titleEl = document.getElementById("project-title");
const statusDotEl = document.getElementById("project-status-dot");
const statusTextEl = document.getElementById("project-status-text");
const indicatorsEl = document.getElementById("indicators");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const expandImageBtn = document.getElementById("expand-image-btn");
const quickGoProjectBtn = document.getElementById("quick-go-project-btn");
const quickMarkProgressBtn = document.getElementById("quick-mark-progress-btn");
const quickViewCriticalBtn = document.getElementById("quick-view-critical-btn");

// === Referencias del modal de imagen ===
const imageModal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const modalTitle = document.getElementById("modal-title");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalOverlay = imageModal?.querySelector(".image-modal-overlay");
const criticalModalEl = document.getElementById("critical-modal");
const criticalModalBodyEl = document.getElementById("critical-modal-body");
const criticalModalTitleEl = document.getElementById("critical-modal-title");
const criticalModalCloseBtn = document.getElementById("critical-modal-close-btn");
const criticalModalGoBtn = document.getElementById("critical-modal-go-btn");
const criticalModalMarkBtn = document.getElementById("critical-modal-mark-btn");
const criticalModalOverlay = criticalModalEl?.querySelector(".critical-modal-overlay");

let currentIndex = 0;
let carouselInterval = null;
let isModalOpen = false;
let isCriticalModalOpen = false;
let criticalModalProjectId = null;

function syncBodyScrollLock() {
    document.body.style.overflow = (isModalOpen || isCriticalModalOpen) ? "hidden" : "";
}

// === Funciones del modal ===
function openImageModal() {
    if (!imageModal || !imgEl.src) return;

    modalImage.src = imgEl.src;
    modalImage.alt = imgEl.alt;
    modalTitle.textContent = titleEl.textContent || "";

    imageModal.classList.remove("hidden");
    isModalOpen = true;
    syncBodyScrollLock();
}

function closeImageModal() {
    if (!imageModal) return;

    imageModal.classList.add("hidden");
    isModalOpen = false;
    syncBodyScrollLock();
}

function closeCriticalTasksPanel() {
    if (!criticalModalEl) return;
    criticalModalEl.classList.add("hidden");
    criticalModalEl.setAttribute("aria-hidden", "true");
    isCriticalModalOpen = false;
    criticalModalProjectId = null;
    syncBodyScrollLock();
}

function renderCriticalTasksPanel(project) {
    if (!criticalModalBodyEl || !criticalModalTitleEl) return;
    const projectName = project?.nombre || "Proyecto";
    const snapshot = typeof getCriticalTasksSnapshot === 'function' ? getCriticalTasksSnapshot(project) : { pendiente: [], proceso: [], total: 0 };
    criticalModalTitleEl.textContent = `Tareas criticas - ${projectName}`;

    const parts = [];
    if (snapshot.pendiente.length) {
        parts.push(`
      <section class="critical-modal-section">
        <h4 class="critical-modal-section-title">Pendiente</h4>
        <ul class="critical-modal-list">
          ${snapshot.pendiente.map((taskName) => `<li class="critical-modal-item">\${escapeHtmlAttribute(taskName)}</li>`).join("")}
        </ul>
      </section>
    `);
    }
    if (snapshot.proceso.length) {
        parts.push(`
      <section class="critical-modal-section">
        <h4 class="critical-modal-section-title">Proceso</h4>
        <ul class="critical-modal-list">
          ${snapshot.proceso.map((taskName) => `<li class="critical-modal-item">\${escapeHtmlAttribute(taskName)}</li>`).join("")}
        </ul>
      </section>
    `);
    }

    if (!parts.length) {
        criticalModalBodyEl.innerHTML = `
      <div class="critical-modal-empty">
        Este proyecto no tiene tareas criticas pendientes.
      </div>
    `;
    } else {
        criticalModalBodyEl.innerHTML = parts.join("");
    }

    if (criticalModalGoBtn) criticalModalGoBtn.disabled = !project;
    if (criticalModalMarkBtn) {
        criticalModalMarkBtn.disabled = !project || project.estado === "terminado" || snapshot.total === 0;
    }
}

function openCriticalTasksPanel(project) {
    if (!criticalModalEl || !project) return;
    criticalModalProjectId = Number(project.id);
    renderCriticalTasksPanel(project);
    criticalModalEl.classList.remove("hidden");
    criticalModalEl.setAttribute("aria-hidden", "false");
    isCriticalModalOpen = true;
    syncBodyScrollLock();
}

// Event listeners del modal
if (expandImageBtn) {
    expandImageBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isModalOpen) {
            closeImageModal();
        } else {
            openImageModal();
        }
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeImageModal);
}

if (modalOverlay) {
    modalOverlay.addEventListener("click", closeImageModal);
}

if (criticalModalCloseBtn) {
    criticalModalCloseBtn.addEventListener("click", closeCriticalTasksPanel);
}

if (criticalModalOverlay) {
    criticalModalOverlay.addEventListener("click", closeCriticalTasksPanel);
}

// Cerrar modal con tecla ESC
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (isModalOpen) {
        closeImageModal();
    }
    if (isCriticalModalOpen) {
        closeCriticalTasksPanel();
    }
});

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

function updateCarousel(index) {
    if (typeof projects === 'undefined') return;
    if (!projects.length) {
        if (imgEl) { imgEl.src = ""; imgEl.alt = "No hay proyectos"; }
        if (titleEl) titleEl.textContent = "No hay proyectos";
        if (statusDotEl) statusDotEl.className = "status-dot";
        if (statusTextEl) statusTextEl.textContent = "";
        return;
    }

    const project = projects[index];
    if (imgEl) { imgEl.src = project.imagen || ""; imgEl.alt = project.nombre || "Proyecto sin nombre"; }
    if (titleEl) titleEl.textContent = project.nombre || "Proyecto sin nombre";
    if (statusDotEl) statusDotEl.className = `status-dot ${getStatusClass(project.estado)}`;
    if (statusTextEl) statusTextEl.textContent = getStatusLabel(project.estado);
}

function buildIndicators() {
    if (!indicatorsEl) return;
    indicatorsEl.innerHTML = "";
    if (typeof projects === 'undefined') return;
    if (!projects.length) return;
    if (currentIndex >= projects.length || currentIndex < 0) {
        currentIndex = 0;
    }
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
    if (typeof projects === 'undefined' || !projects.length) return;
    currentIndex = (currentIndex + 1) % projects.length;
    updateCarousel(currentIndex);
    buildIndicators();
}

function prevProject() {
    if (typeof projects === 'undefined' || !projects.length) return;
    currentIndex = (currentIndex - 1 + projects.length) % projects.length;
    updateCarousel(currentIndex);
    buildIndicators();
}

function showNextProject() {
    nextProject();
}

function resetCarouselInterval() {
    if (carouselInterval) clearInterval(carouselInterval);
    if (typeof projects !== 'undefined' && projects.length > 1) {
        carouselInterval = setInterval(nextProject, 5000); // cambia cada 5 segundos
    } else {
        carouselInterval = null;
    }
}

if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        prevProject();
        resetCarouselInterval();
    });
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        nextProject();
        resetCarouselInterval();
    });
}

if (quickGoProjectBtn) {
    quickGoProjectBtn.addEventListener("click", () => {
        if (typeof goToActiveProjectInEditor === 'function') goToActiveProjectInEditor();
    });
}

if (quickMarkProgressBtn) {
    quickMarkProgressBtn.addEventListener("click", async () => {
        if (typeof markActiveProjectProgress === 'function') await markActiveProjectProgress();
    });
}

if (quickViewCriticalBtn) {
    quickViewCriticalBtn.addEventListener("click", () => {
        if (typeof showActiveProjectCriticalTasks === 'function') showActiveProjectCriticalTasks();
    });
}

if (criticalModalGoBtn) {
    criticalModalGoBtn.addEventListener("click", () => {
        const project = (typeof getProjectById === 'function' ? getProjectById(criticalModalProjectId) : null) || (typeof getActiveProjectFromCarousel === 'function' ? getActiveProjectFromCarousel() : null);
        if (!project) {
            closeCriticalTasksPanel();
            return;
        }
        closeCriticalTasksPanel();
        if (typeof openProjectInEditor === 'function') openProjectInEditor(project);
    });
}

if (criticalModalMarkBtn) {
    criticalModalMarkBtn.addEventListener("click", async () => {
        const project = (typeof getProjectById === 'function' ? getProjectById(criticalModalProjectId) : null) || (typeof getActiveProjectFromCarousel === 'function' ? getActiveProjectFromCarousel() : null);
        if (!project) {
            closeCriticalTasksPanel();
            return;
        }
        if (typeof markProjectCriticalProgress === 'function') await markProjectCriticalProgress(project, { showAlerts: false });
        const refreshedProject = typeof getProjectById === 'function' ? getProjectById(project.id) : null;
        if (!refreshedProject) {
            closeCriticalTasksPanel();
            return;
        }
        renderCriticalTasksPanel(refreshedProject);
        if (typeof updateQuickActionsState === 'function') updateQuickActionsState(typeof getActiveProjectFromCarousel === 'function' ? getActiveProjectFromCarousel() : null);
    });
}
