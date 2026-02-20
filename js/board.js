// js/board.js

const colPendiente = document.getElementById("col-pendiente");
const colProceso = document.getElementById("col-proceso");
const colTerminado = document.getElementById("col-terminado");

const countPendiente = document.getElementById("count-pendiente");
const countProceso = document.getElementById("count-proceso");
const countTerminado = document.getElementById("count-terminado");
const doneChecklistEl = document.getElementById("done-checklist");
const doneChecklistCountEl = document.getElementById("done-checklist-count");
const doneReopenTargetEl = document.getElementById("done-reopen-target");
const summaryTotalProjectsEl = document.getElementById("summary-total-projects");
const summaryDoneProjectsEl = document.getElementById("summary-done-projects");
const summaryPendingProjectsEl = document.getElementById("summary-pending-projects");
const summaryInProgressProjectsEl = document.getElementById("summary-inprogress-projects");
const summaryCompletionEl = document.getElementById("summary-completion");
const summaryProgressFillEl = document.getElementById("summary-progress-fill");
const summaryActiveProjectEl = document.getElementById("summary-active-project");
const summaryActiveStatusEl = document.getElementById("summary-active-status");
const summaryActiveContentEl = document.getElementById("summary-active-content");
const summaryActiveWrapEl = document.getElementById("summary-active-wrap");
let boardSelectedProjectId = null;

function renderBoard() {
    if (!colPendiente || !colProceso || !colTerminado) return;
    colPendiente.innerHTML = "";
    colProceso.innerHTML = "";
    colTerminado.innerHTML = "";

    if (typeof projects === 'undefined') return;

    projects.forEach((project) => {
        const card = document.createElement("div");
        card.className = "kanban-card";
        card.dataset.id = project.id;
        card.draggable = true;

        // Título del proyecto
        const titleEl = document.createElement("div");
        titleEl.className = "kanban-card-title";
        titleEl.textContent = project.nombre;
        card.appendChild(titleEl);

        // Etiqueta y responsable (si existen)
        if (project.etiqueta || project.responsable) {
            const metaEl = document.createElement("div");
            metaEl.className = "kanban-card-meta";
            if (project.etiqueta) {
                const tagEl = document.createElement("span");
                tagEl.className = "kanban-card-tag";
                tagEl.textContent = project.etiqueta;
                metaEl.appendChild(tagEl);
            }
            if (project.responsable) {
                const ownerEl = document.createElement("span");
                ownerEl.className = "kanban-card-owner";
                ownerEl.textContent = "👤 " + project.responsable;
                metaEl.appendChild(ownerEl);
            }
            card.appendChild(metaEl);
        }

        // Fecha de entrega (si existe)
        if (project.fechaFin) {
            const dateEl = document.createElement("div");
            dateEl.className = "kanban-card-date";
            dateEl.textContent = "📅 " + project.fechaFin;
            card.appendChild(dateEl);
        }

        // Drag and drop
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", project.id);
            card.classList.add("dragging");
        });
        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
        });

        if (project.estado === "pendiente") {
            colPendiente.appendChild(card);
        } else if (project.estado === "proceso") {
            colProceso.appendChild(card);
        } else if (project.estado === "terminado") {
            colTerminado.appendChild(card);
        }
    });

    if (countPendiente) countPendiente.textContent = colPendiente.children.length;
    if (countProceso) countProceso.textContent = colProceso.children.length;
    if (countTerminado) countTerminado.textContent = colTerminado.children.length;

    actualizarResumenGeneral();
    actualizarResumenProyectoActivo();
    renderDoneChecklist();
}

function renderDoneChecklist() {
    if (!doneChecklistEl) return;
    if (typeof projects === 'undefined') return;

    const terminados = projects.filter(p => p.estado === "terminado");
    if (doneChecklistCountEl) doneChecklistCountEl.textContent = terminados.length;

    doneChecklistEl.innerHTML = terminados.map(p => `
        <div class="done-checklist-item" data-project-id="${p.id}">
            <input type="checkbox" class="done-checklist-check" id="done-check-${p.id}" checked />
            <label class="done-checklist-label" for="done-check-${p.id}">${p.nombre}</label>
        </div>
    `).join("");

    doneChecklistEl.querySelectorAll(".done-checklist-check").forEach(check => {
        check.addEventListener("change", async () => {
            const projectId = Number(check.closest("[data-project-id]").dataset.projectId);
            const project = projects.find(p => p.id === projectId);
            if (!project) return;
            const targetState = doneReopenTargetEl ? doneReopenTargetEl.value : "pendiente";
            project.estado = targetState;
            if (typeof touchProjectActivity === 'function') touchProjectActivity(project, "reopen");
            if (typeof saveProjects === 'function') await saveProjects(projects);
            renderBoard();
            if (typeof updateCarousel === 'function') updateCarousel(currentIndex);
            if (typeof renderGantt === 'function') renderGantt();
        });
    });
}

function initDragAndDrop() {
    const columnas = [colPendiente, colProceso, colTerminado];

    columnas.forEach(col => {
        if (!col) return;

        col.addEventListener("dragover", e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(col, e.clientY);
            const dragging = document.querySelector(".dragging");
            if (!dragging) return;

            if (afterElement == null) {
                col.appendChild(dragging);
            } else {
                col.insertBefore(dragging, afterElement);
            }
        });

        col.addEventListener("drop", async e => {
            e.preventDefault();
            const projectId = e.dataTransfer.getData("text/plain");
            let nuevoEstado = "pendiente";

            if (col === colProceso) nuevoEstado = "proceso";
            else if (col === colTerminado) nuevoEstado = "terminado";

            const project = typeof getProjectById === 'function'
                ? getProjectById(projectId)
                : (typeof projects !== 'undefined' ? projects.find(p => String(p.id) === String(projectId)) : null);

            if (project && project.estado !== nuevoEstado) {
                project.estado = nuevoEstado;
                if (typeof touchProjectActivity === 'function') {
                    touchProjectActivity(project, "drag-and-drop");
                }

                if (typeof saveProjects === 'function') {
                    await saveProjects(projects);
                }

                if (typeof emitAppEvent === 'function' && typeof APP_EVENTS !== 'undefined') {
                    emitAppEvent(APP_EVENTS.PROJECT_STATUS_CHANGED, {
                        projectId: project.id,
                        status: nuevoEstado,
                        source: "drag-and-drop"
                    });
                }

                renderBoard();
                if (typeof renderGantt === 'function') renderGantt();
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".kanban-card:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function actualizarResumenGeneral() {
    if (typeof projects === 'undefined') return;
    const total = projects.length;
    const done = projects.filter(p => p.estado === "terminado").length;
    const pending = projects.filter(p => p.estado === "pendiente").length;
    const inProgress = projects.filter(p => p.estado === "proceso").length;
    const completion = total ? Math.round((done / total) * 100) : 0;

    if (summaryTotalProjectsEl) summaryTotalProjectsEl.textContent = `${total} proyecto(s)`;
    if (summaryDoneProjectsEl) summaryDoneProjectsEl.textContent = `${done} terminado(s)`;
    if (summaryPendingProjectsEl) summaryPendingProjectsEl.textContent = `${pending} pendiente(s)`;
    if (summaryInProgressProjectsEl) summaryInProgressProjectsEl.textContent = `${inProgress} en proceso(s)`;
    if (summaryCompletionEl) summaryCompletionEl.textContent = `Completitud: ${completion}%`;
    if (summaryProgressFillEl) summaryProgressFillEl.style.width = `${completion}%`;
}

function actualizarResumenProyectoActivo() {
    if (typeof projects === 'undefined' || typeof currentIndex === 'undefined') return;
    const proyectoActivo = projects[currentIndex];

    if (!summaryActiveProjectEl || !summaryActiveStatusEl) return;

    if (!proyectoActivo) {
        summaryActiveProjectEl.textContent = "Ningún proyecto activo";
        summaryActiveStatusEl.textContent = "";
        return;
    }

    summaryActiveProjectEl.textContent = proyectoActivo.nombre || "Proyecto sin nombre";
    summaryActiveStatusEl.textContent = typeof getStatusLabel === 'function'
        ? getStatusLabel(proyectoActivo.estado)
        : proyectoActivo.estado;
}

// Inicializar drag and drop cuando este script cargue
document.addEventListener("DOMContentLoaded", () => {
    initDragAndDrop();
});
