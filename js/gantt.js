// js/gantt.js

const ganttGridEl = document.getElementById("gantt-grid");
const ganttSummaryEl = document.getElementById("gantt-summary");
const ganttEmptyEl = document.getElementById("gantt-empty");
const GANTT_DATE_LABEL_FORMAT = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" });

let ganttCollapsedIds = new Set();
let ganttEditInteraction = null;

function renderGantt() {
    if (!ganttGridEl) return;

    if (typeof normalizeProjectsSchedule === "function") normalizeProjectsSchedule();

    if (typeof projects === "undefined" || !projects.length) {
        ganttGridEl.innerHTML = "";
        if (ganttEmptyEl) ganttEmptyEl.classList.remove("hidden");
        if (ganttSummaryEl) ganttSummaryEl.textContent = "Sin proyectos";
        return;
    }

    if (ganttEmptyEl) ganttEmptyEl.classList.add("hidden");

    const projectsSorted = [...projects].sort((a, b) => {
        const aStart = typeof parseISODate === "function" ? parseISODate(a.fechaInicio)?.getTime() || 0 : new Date(a.fechaInicio).getTime();
        const bStart = typeof parseISODate === "function" ? parseISODate(b.fechaInicio)?.getTime() || 0 : new Date(b.fechaInicio).getTime();
        return aStart - bStart;
    });

    const starts = [];
    const ends = [];
    projectsSorted.forEach((project) => {
        const projectStart = typeof parseISODate === "function" ? parseISODate(project.fechaInicio) : new Date(project.fechaInicio);
        const projectEnd = typeof parseISODate === "function" ? parseISODate(project.fechaFin) : new Date(project.fechaFin);
        if (projectStart && !isNaN(projectStart.valueOf())) starts.push(projectStart);
        if (projectEnd && !isNaN(projectEnd.valueOf())) ends.push(projectEnd);

        if (typeof sanitizeSubtasks === "function") {
            const subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
            project.subtareas = subtareas;
            if (typeof flattenSubtasks === "function") {
                flattenSubtasks(subtareas).forEach((subtask) => {
                    const subStart = parseISODate(subtask.fechaInicio);
                    const subEnd = parseISODate(subtask.fechaFin);
                    if (subStart && !isNaN(subStart.valueOf())) starts.push(subStart);
                    if (subEnd && !isNaN(subEnd.valueOf())) ends.push(subEnd);
                });
            }
        }
    });

    const minStart = starts.length ? new Date(Math.min(...starts.map((date) => date.getTime()))) : new Date();
    const maxEnd = ends.length ? new Date(Math.max(...ends.map((date) => date.getTime()))) : (typeof addDays === "function" ? addDays(minStart, 7) : new Date(minStart.getTime() + 7 * 24 * 60 * 60 * 1000));

    let timelineStart, timelineEnd;
    if (typeof addDays === "function") {
        timelineStart = addDays(minStart, -1);
        timelineEnd = addDays(maxEnd, 1);
    } else {
        timelineStart = new Date(minStart.getTime() - 24 * 60 * 60 * 1000);
        timelineEnd = new Date(maxEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    const totalDays = Math.max(1, (typeof dayDiff === "function" ? dayDiff(timelineStart, timelineEnd) : Math.floor((timelineEnd - timelineStart) / (1000 * 60 * 60 * 24))) + 1);
    const daySizePx = 24;
    const timelineWidth = Math.max(totalDays * daySizePx, 640);
    if (typeof formatISODate === "function") {
        ganttGridEl.dataset.timelineStartIso = formatISODate(timelineStart);
    }
    ganttGridEl.dataset.ganttDaySize = String(daySizePx);

    const scaleLabels = [];
    for (let day = 0; day < totalDays; day += 7) {
        const currentDate = typeof addDays === "function" ? addDays(timelineStart, day) : new Date(timelineStart.getTime() + day * 24 * 60 * 60 * 1000);
        const left = day * daySizePx;
        scaleLabels.push(
            `<span class="gantt-scale-label" style="left:${left}px">${GANTT_DATE_LABEL_FORMAT.format(currentDate)}</span>`
        );
    }

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const todayOffset = typeof dayDiff === "function" ? dayDiff(timelineStart, today) : Math.floor((today - timelineStart) / (1000 * 60 * 60 * 24));
    const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;
    const todayLineHtml = showTodayLine ? `<div class="gantt-today-line" style="left:${todayOffset * daySizePx}px"></div>` : "";

    const ganttRows = [];
    const addSubtaskRows = (project, subtasks, parentRowId, level, projectProgress, hiddenByAncestor = false) => {
        subtasks.forEach((subtask) => {
            const subtaskStatus = ["pendiente", "proceso", "terminado"].includes(subtask.estado) ? subtask.estado : "pendiente";
            const subtaskStatusProgress = typeof getStatusProgress === "function" ? getStatusProgress(subtaskStatus) : (subtaskStatus === "terminado" ? 100 : (subtaskStatus === "proceso" ? 50 : 0));
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
        if (typeof ensureProjectMetadata === "function") ensureProjectMetadata(project);
        if (typeof normalizeProjectWorkflow === "function") normalizeProjectWorkflow(project);

        let subtareas = project.subtareas || [];
        if (typeof sanitizeSubtasks === "function") {
            subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
            project.subtareas = subtareas;
        }

        const rowId = `project-${project.id}`;
        const projectStatus = ["pendiente", "proceso", "terminado"].includes(project.estado) ? project.estado : "pendiente";
        const projectProgress = typeof getProjectWorkflowProgress === "function" ? getProjectWorkflowProgress(project) : (projectStatus === "terminado" ? 100 : 0);
        const projectRisk = typeof getProjectRiskSnapshot === "function" ? getProjectRiskSnapshot(project) : { level: "low" };
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
            info: `${project.responsable || "Sin asignar"} | ${typeof getStatusLabel === "function" ? getStatusLabel(projectStatus) : projectStatus}${projectRisk.level === "high" ? " | Ruta critica" : ""}`,
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

    const escapeHtmlAttr = typeof escapeHtmlAttribute === "function" ? escapeHtmlAttribute : (v) => String(v).replace(/"/g, '&quot;');

    const rowsHtml = ganttRows
        .filter((row) => row.visible !== false)
        .map((row) => {
            const start = (typeof parseISODate === "function" ? parseISODate(row.start) : new Date(row.start)) || timelineStart;
            const parsedEnd = (typeof parseISODate === "function" ? parseISODate(row.end) : new Date(row.end)) || start;
            const end = parsedEnd.getTime() < start.getTime() ? start : parsedEnd;
            const startOffset = Math.max(0, typeof dayDiff === "function" ? dayDiff(timelineStart, start) : Math.floor((start - timelineStart) / (1000 * 60 * 60 * 24)));
            const spanDays = Math.max(1, (typeof dayDiff === "function" ? dayDiff(start, end) : Math.floor((end - start) / (1000 * 60 * 60 * 24))) + 1);
            const barLeft = startOffset * daySizePx;
            const barWidth = Math.max(daySizePx, spanDays * daySizePx);
            const status = ["pendiente", "proceso", "terminado"].includes(row.status) ? row.status : "pendiente";
            const isDelayed = status !== "terminado" && end.getTime() < today.getTime();
            const progress = typeof row.progress === "number"
                ? Math.max(0, Math.min(100, row.progress))
                : (typeof getStatusProgress === "function" ? getStatusProgress(status) : 0);
            const delayedClass = isDelayed ? " delayed" : "";
            const criticalClass = row.isCritical ? " critical" : "";
            const projectIdAttr = row.kind === "project" && row.projectId
                ? ` data-project-id="${escapeHtmlAttr(String(row.projectId))}"`
                : "";
            const ownerProjectIdAttr = row.projectId
                ? ` data-owner-project-id="${escapeHtmlAttr(String(row.projectId))}"`
                : "";
            const subtaskIdAttr = row.kind === "subtask" && row.subtaskId
                ? ` data-subtask-id="${escapeHtmlAttr(String(row.subtaskId))}"`
                : "";
            const isSubtask = row.kind === "subtask";
            const rowClass = isSubtask ? "gantt-row is-subtask" : "gantt-row";
            const indentPx = Math.min(row.level || 0, 8) * 16;
            const toggleHtml = row.hasChildren
                ? `<button type="button" class="gantt-toggle-btn" data-gantt-row-id="${escapeHtmlAttr(row.rowId)}" aria-label="${row.collapsed ? "Expandir" : "Contraer"} subtareas">${row.collapsed ? "+" : "-"}</button>`
                : `<span class="gantt-toggle-placeholder" aria-hidden="true"></span>`;

            return `
          <div class="${rowClass}" data-gantt-row-id="${escapeHtmlAttr(row.rowId)}">
            <div class="gantt-row-meta">
              <div class="gantt-row-title" style="padding-left:${indentPx}px;">
                ${toggleHtml}
                <span>${escapeHtmlAttr(row.title)}</span>
              </div>
              <div class="gantt-row-info">${escapeHtmlAttr(row.start)} a ${escapeHtmlAttr(row.end)}</div>
              <div class="gantt-row-info">${escapeHtmlAttr(row.info)}</div>
            </div>
            <div class="gantt-track" style="width:${timelineWidth}px; --gantt-day-size:${daySizePx}px;">
              <div class="gantt-track-grid"></div>
              <div class="gantt-track-grid week"></div>
              ${todayLineHtml}
              <div class="gantt-bar ${status}${delayedClass}${criticalClass}" data-gantt-kind="${escapeHtmlAttr(row.kind)}"${projectIdAttr}${ownerProjectIdAttr}${subtaskIdAttr} data-start-iso="${escapeHtmlAttr(row.start)}" data-end-iso="${escapeHtmlAttr(row.end)}" style="left:${barLeft}px;width:${barWidth}px;">
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
        let formatIso = typeof formatISODate === "function" ? formatISODate : (d) => d?.toISOString().split('T')[0];
        ganttSummaryEl.textContent = `${projectsSorted.length} proyecto(s), ${totalSubtasks} subtarea(s) | ${formatIso(minStart)} a ${formatIso(maxEnd)}`;
    }
}

function renderGanttDependencyLayer(projectsSorted) {
    if (!ganttGridEl) return;
    const existingLayer = ganttGridEl.querySelector(".gantt-dependency-layer");
    if (existingLayer) existingLayer.remove();

    const dependencyLinks = [];
    (Array.isArray(projectsSorted) ? projectsSorted : []).forEach((project) => {
        const dependencyIds = typeof getProjectDependencies === "function" ? getProjectDependencies(project) : [];
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
    const timelineStart = typeof parseISODate === "function" ? parseISODate(timelineStartIso) : new Date(timelineStartIso);
    if (!timelineStart || isNaN(timelineStart.valueOf()) || !Number.isFinite(daySizePx) || daySizePx <= 0) return null;
    return { timelineStart, daySizePx };
}

function computeGanttRangeByDelta(startIso, endIso, mode, deltaDays) {
    const startDate = typeof parseISODate === "function" ? parseISODate(startIso) : new Date(startIso);
    const endDate = typeof parseISODate === "function" ? parseISODate(endIso) : new Date(endIso);
    if (!startDate || isNaN(startDate.valueOf()) || !endDate || isNaN(endDate.valueOf())) return null;

    let nextStart = new Date(startDate);
    let nextEnd = new Date(endDate);

    if (typeof addDays === "function") {
        if (mode === "move" || mode === "resize-left") {
            nextStart = addDays(nextStart, deltaDays);
        }
        if (mode === "move" || mode === "resize-right") {
            nextEnd = addDays(nextEnd, deltaDays);
        }
    } else {
        if (mode === "move" || mode === "resize-left") {
            nextStart = new Date(nextStart.getTime() + deltaDays * 24 * 60 * 60 * 1000);
        }
        if (mode === "move" || mode === "resize-right") {
            nextEnd = new Date(nextEnd.getTime() + deltaDays * 24 * 60 * 60 * 1000);
        }
    }


    if (nextEnd.getTime() < nextStart.getTime()) {
        if (mode === "resize-left") {
            nextStart = new Date(nextEnd);
        } else if (mode === "resize-right") {
            nextEnd = new Date(nextStart);
        }
    }

    const formatIso = typeof formatISODate === "function" ? formatISODate : (d) => d?.toISOString() || "";

    return {
        startDate: nextStart,
        endDate: nextEnd,
        startIso: formatIso(nextStart),
        endIso: formatIso(nextEnd)
    };
}

function applyGanttBarPreview(barEl, timelineStart, daySizePx, startDate, endDate) {
    if (!barEl || !timelineStart) return;
    const startOffset = typeof dayDiff === "function" ? dayDiff(timelineStart, startDate) : Math.floor((startDate - timelineStart) / (1000 * 60 * 60 * 24));
    const spanDays = Math.max(1, (typeof dayDiff === "function" ? dayDiff(startDate, endDate) : Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))) + 1);
    barEl.style.left = `${startOffset * daySizePx}px`;
    barEl.style.width = `${Math.max(daySizePx, spanDays * daySizePx)}px`;
}

function getGanttBarSource(barEl) {
    if (!barEl) return null;
    const kind = String(barEl.dataset.ganttKind || "").trim();
    const ownerProjectId = Number(barEl.dataset.ownerProjectId || barEl.dataset.projectId || "");
    if (!Number.isFinite(ownerProjectId) || !kind || typeof projects === "undefined") return null;

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

        if (typeof sanitizeSubtasks === "function") {
            project.subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
        }

        let subtask = null;
        if (typeof findSubtaskInTree === "function") {
            subtask = findSubtaskInTree(project.subtareas, subtaskId);
        }

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
    if (!source || typeof projects === "undefined") return false;
    const project = projects.find((item) => Number(item?.id) === Number(source.projectId));
    if (!project) return false;

    let previousSnapshot = null;
    if (typeof cloneSingleProjectSnapshot === "function") {
        previousSnapshot = cloneSingleProjectSnapshot(project);
        if (!previousSnapshot) return false;
    }

    if (typeof pushHistorySnapshot === "function") pushHistorySnapshot();

    let updated = false;
    if (source.kind === "project") {
        project.fechaInicio = nextStartIso;
        project.fechaFin = nextEndIso;
        if (typeof sanitizeSubtasks === "function") {
            project.subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
        }
        updated = true;
    } else if (source.kind === "subtask") {
        if (typeof sanitizeSubtasks === "function") {
            project.subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
        }

        if (typeof updateSubtaskInTree === "function") {
            updated = updateSubtaskInTree(project.subtareas, source.subtaskId, (subtask) => {
                subtask.fechaInicio = nextStartIso;
                subtask.fechaFin = nextEndIso;
            });
        }

        if (updated && typeof sanitizeSubtasks === "function") {
            project.subtareas = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
        }
    }

    if (!updated) return false;

    if (typeof syncProcessRequiredTasksFromSubtasks === "function") syncProcessRequiredTasksFromSubtasks(project, project.subtareas);
    if (typeof syncSubtasksFromProcessRequiredTasks === "function") syncSubtasksFromProcessRequiredTasks(project);
    if (typeof normalizeProjectDates === "function") normalizeProjectDates(project);
    if (typeof touchProjectActivity === "function") touchProjectActivity(project, source.kind === "project" ? "gantt-project-dates" : "gantt-subtask-dates");

    let saved = true;
    if (typeof saveProjects === "function") saved = await saveProjects(projects);

    if (!saved) {
        if (typeof replaceProjectFromSnapshot === "function" && previousSnapshot) replaceProjectFromSnapshot(project, previousSnapshot);
        if (typeof setEditorSaveState === "function") setEditorSaveState("error", "No se pudo guardar cambio en Gantt");
        renderGantt();
        return false;
    }

    renderGantt();

    let emitted = false;
    if (typeof emitAppEvent === "function" && typeof APP_EVENTS !== "undefined") {
        emitted = emitAppEvent(APP_EVENTS.PROJECT_CHANGED, {
            projectId: project.id,
            source: source.kind === "project" ? "gantt-project-dates" : "gantt-subtask-dates",
            kind: source.kind,
            subtaskId: source.subtaskId || null
        });
    }

    if (!emitted) {
        if (typeof renderBoard === "function") renderBoard();
        if (typeof updateCarousel === "function" && typeof currentIndex !== "undefined") updateCarousel(currentIndex);
    }

    if (typeof currentEditingProjectId !== "undefined" && currentEditingProjectId === project.id) {
        const editorFechaFin = document.getElementById("editor-fecha-fin");
        if (source.kind === "project" && editorFechaFin) {
            editorFechaFin.value = project.fechaFin || editorFechaFin.value;
        }
        if (typeof sanitizeSubtasks === "function" && typeof editorSubtasksDraft !== "undefined") {
            editorSubtasksDraft = sanitizeSubtasks(project.subtareas, project.fechaInicio, project.fechaFin);
        }
        if (typeof renderEditorSubtasks === "function") renderEditorSubtasks();
        if (typeof updateEditorPreview === "function") updateEditorPreview();
    }

    if (typeof setEditorSaveState === "function") setEditorSaveState("clean", "Fechas actualizadas desde Gantt");
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

    const pStart = typeof parseISODate === "function" ? parseISODate(startIso) : new Date(startIso);
    const pEnd = typeof parseISODate === "function" ? parseISODate(endIso) : new Date(endIso);

    if (!pStart || isNaN(pStart.valueOf()) || !pEnd || isNaN(pEnd.valueOf())) return;

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

document.addEventListener("DOMContentLoaded", () => {
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
});
