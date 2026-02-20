// js/editor.js

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
const HISTORY_LIMIT = 80;
const LOCAL_IMAGE_TARGET_BYTES = 220 * 1024;
const LOCAL_IMAGE_MAX_DIMENSION = 1280;
const LOCAL_IMAGE_MIN_DIMENSION = 520;
let projectHistoryUndoStack = [];
let projectHistoryRedoStack = [];
let imageUploadRequestId = 0;
let editorLoadedProjectBaseline = null;
let editorHasValidationInteraction = false;

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
    const fechaFinDate = typeof parseISODate === "function" ? parseISODate(fechaFinRaw) : null;
    const todayDate = typeof parseISODate === "function" && typeof getComputerTodayISO === "function"
        ? parseISODate(getComputerTodayISO())
        : new Date();

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
        projects: cloneProjectsSnapshot(typeof projects !== "undefined" ? projects : []),
        currentEditingProjectId,
        currentIndex: typeof currentIndex !== "undefined" ? currentIndex : 0
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
    if (!snapshot || typeof projects === "undefined") return false;

    projects = cloneProjectsSnapshot(snapshot.projects);
    currentIndex = Number.isInteger(snapshot.currentIndex) ? snapshot.currentIndex : 0;
    if (!projects.length) currentIndex = 0;
    if (currentIndex >= projects.length) currentIndex = projects.length - 1;
    if (currentIndex < 0) currentIndex = 0;

    let saved = true;
    if (typeof saveProjects === "function") {
        saved = await saveProjects(projects);
    }

    if (!saved) {
        setEditorSaveState("error", "No se pudo restaurar");
        return false;
    }

    if (typeof renderBoard === "function") renderBoard();
    if (typeof buildIndicators === "function") buildIndicators();
    if (typeof updateCarousel === "function") updateCarousel(currentIndex);
    if (typeof resetCarouselInterval === "function") resetCarouselInterval();

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
    const hasProjects = typeof projects !== "undefined" && projects.length > 0;
    const hasMultipleProjects = typeof projects !== "undefined" && projects.length > 1;
    const hasSelectedProject = typeof projects !== "undefined" && projects.some((project) => Number(project.id) === Number(currentEditingProjectId));
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
    if (typeof projects === "undefined") return;
    const id = currentEditingProjectId;
    const project = projects.find((p) => p.id === id);

    const previewNombre = editorNombre?.value.trim() || project?.nombre || "Sin nombre";
    const previewEtiqueta = editorEtiqueta?.value.trim() || project?.etiqueta || "General";
    const previewResponsable = editorResponsable?.value.trim() || project?.responsable || "Sin asignar";
    const previewFin = editorFechaFin?.value || project?.fechaFin || "";
    const previewSubtasks = typeof countSubtasksRecursive === "function" ? countSubtasksRecursive(editorSubtasksDraft) : 0;
    const previewImagen = lastUploadedImageDataUrl || editorImagen?.value.trim() || project?.imagen || "";

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

    const fallbackStart = editorFechaInicio?.value || (typeof getComputerTodayISO === "function" ? getComputerTodayISO() : "");
    const fallbackEnd = editorFechaFin?.value || fallbackStart;

    if (typeof sanitizeSubtasks === "function") {
        const subtareas = sanitizeSubtasks(editorSubtasksDraft, fallbackStart, fallbackEnd);
        editorSubtasksDraft = subtareas;
        const flatSubtasks = typeof flattenSubtasks === "function" ? flattenSubtasks(subtareas) : [];

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
}

function renderEditorComments(comments) {
    if (!editorCommentsList) return;
    const list = Array.isArray(comments) ? comments : [];
    const escape = (v) => String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const formatCommentDate = (iso) => {
        if (!iso) return "";
        let d = null;
        if (typeof parseISODate === "function") {
            d = parseISODate(iso);
        } else {
            d = new Date(iso);
        }
        if (!d) return iso;
        return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    if (!list.length) {
        editorCommentsList.innerHTML = `<div class="editor-comment-empty">Aún no hay comentarios. Añade uno abajo.</div>`;
        return;
    }
    editorCommentsList.innerHTML = list.map((c, index) => {
        const text = escape(c.text || "");
        const author = escape(c.author || "Anónimo");
        const date = formatCommentDate(c.createdAt);
        return `<div class="editor-comment-item" data-comment-index="${index}"><div><div>${text}</div><div class="editor-comment-meta">${author} · ${date}</div></div><button type="button" class="editor-comment-delete-btn" data-action="delete-comment" data-comment-index="${index}" title="Eliminar comentario">✕</button></div>`;
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
    if (!editorSelect) return;
    editorSelect.innerHTML = "";
    const selectedNumericId = Number(selectedId);
    const hasSelectedProject = Number.isFinite(selectedNumericId) && selectedNumericId > 0;

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Nuevo proyecto (campos vacios)";
    emptyOption.selected = !hasSelectedProject;
    editorSelect.appendChild(emptyOption);

    if (typeof projects === "undefined" || !projects.length) {
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

    const defaultStartISO = typeof getComputerTodayISO === "function" ? getComputerTodayISO() : new Date().toISOString();
    let defaultEnd = new Date();
    if (typeof addDays === "function" && typeof parseISODate === "function") {
        defaultEnd = addDays(parseISODate(defaultStartISO) || new Date(), 10);
    }

    if (editorNombre) editorNombre.value = "";
    if (editorEstado) editorEstado.value = "pendiente";
    if (editorEtiqueta) editorEtiqueta.value = "";
    if (editorDependencies) editorDependencies.value = "";
    if (editorImagen) editorImagen.value = "";
    if (editorResponsable) editorResponsable.value = "";
    if (editorFechaInicio) editorFechaInicio.value = defaultStartISO;
    if (editorFechaFin) {
        editorFechaFin.value = typeof formatISODate === "function" ? formatISODate(defaultEnd) : defaultEnd.toISOString().split("T")[0];
    }

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

    const todayISO = typeof getComputerTodayISO === "function" ? getComputerTodayISO() : new Date().toISOString();
    let draftEnd = new Date();
    if (typeof addDays === "function" && typeof parseISODate === "function") {
        draftEnd = addDays(parseISODate(todayISO) || new Date(), 10);
    }

    if (editorNombre) editorNombre.value = "";
    if (editorEstado) editorEstado.value = "pendiente";
    if (editorEtiqueta) editorEtiqueta.value = "";
    if (editorDependencies) editorDependencies.value = "";
    if (editorImagen) editorImagen.value = "";
    if (editorResponsable) editorResponsable.value = "";
    if (editorFechaInicio) editorFechaInicio.value = todayISO;
    if (editorFechaFin) {
        editorFechaFin.value = typeof formatISODate === "function" ? formatISODate(draftEnd) : draftEnd.toISOString().split("T")[0];
    }

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
    if (typeof projects === "undefined") return;
    const id = typeof projectId === "number" ? projectId : parseInt(editorSelect.value, 10);
    const project = projects.find((p) => p.id === id);
    if (!project) {
        clearEditorForm();
        return;
    }

    isLoadingProjectIntoForm = true;
    editorHasValidationInteraction = false;
    currentEditingProjectId = id;
    if (editorSelect) editorSelect.value = String(id);
    if (editorNombre) editorNombre.value = project.nombre || "";
    if (editorEstado) editorEstado.value = project.estado || "pendiente";
    if (editorEtiqueta) editorEtiqueta.value = project.etiqueta || "";
    if (editorDependencies && typeof formatDependenciesInput === "function") {
        editorDependencies.value = formatDependenciesInput(project.dependencies);
    }
    if (editorImagen) editorImagen.value = project.imagen || "";
    if (editorResponsable) editorResponsable.value = project.responsable || "";

    if (typeof normalizeProjectDates === "function") {
        normalizeProjectDates(project);
    }

    const todayISO = typeof getComputerTodayISO === "function" ? getComputerTodayISO() : new Date().toISOString();
    if (editorFechaInicio) editorFechaInicio.value = todayISO;
    if (editorFechaFin) {
        let fFin = project.fechaFin;
        if (!fFin && typeof addDays === "function" && typeof parseISODate === "function") {
            fFin = typeof formatISODate === "function" ? formatISODate(addDays(parseISODate(todayISO) || new Date(), 10)) : "";
        }
        editorFechaFin.value = fFin || "";
    }

    if (typeof syncSubtasksFromProcessRequiredTasks === "function") {
        syncSubtasksFromProcessRequiredTasks(project);
    }

    if (typeof sanitizeSubtasks === "function") {
        editorSubtasksDraft = sanitizeSubtasks(project.subtareas, editorFechaInicio?.value, editorFechaFin?.value);
    } else {
        editorSubtasksDraft = project.subtareas || [];
    }

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
    if (typeof projects === "undefined") return false;
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
    if (typeof normalizeProjectWorkflow === "function") {
        normalizeProjectWorkflow(project);
    }

    const nombreNuevo = editorNombre?.value.trim() || project.nombre;
    const siguienteEstado = project.estado || "pendiente";
    if (editorEstado) editorEstado.value = siguienteEstado;
    const siguienteEtiqueta = editorEtiqueta?.value.trim() || "General";
    const siguienteImagen = lastUploadedImageDataUrl || editorImagen?.value.trim() || "";
    const siguienteResponsable = editorResponsable?.value.trim() || "Sin asignar";

    let siguientesDependencias = [];
    if (typeof parseDependenciesInput === "function") {
        siguientesDependencias = parseDependenciesInput(editorDependencies?.value || "", id);
    }

    const todayISO = typeof getComputerTodayISO === "function" ? getComputerTodayISO() : new Date().toISOString();
    if (editorFechaInicio) editorFechaInicio.value = todayISO;

    const inicioSeleccionado = typeof parseISODate === "function" ? parseISODate(todayISO) : new Date(todayISO);
    const finSeleccionado = typeof parseISODate === "function" ? parseISODate(editorFechaFin?.value) : new Date(editorFechaFin?.value || todayISO);

    let siguienteInicio = inicioSeleccionado || (typeof parseISODate === "function" ? parseISODate(project.fechaInicio) : new Date());
    let siguienteFin = finSeleccionado || (typeof parseISODate === "function" ? parseISODate(project.fechaFin) : new Date());

    if (typeof addDays === "function") {
        if (!siguienteInicio && !siguienteFin) {
            siguienteInicio = new Date();
            siguienteInicio.setHours(12, 0, 0, 0);
            siguienteFin = addDays(siguienteInicio, 10);
        } else if (siguienteInicio && !siguienteFin) {
            siguienteFin = addDays(siguienteInicio, 10);
        } else if (!siguienteInicio && siguienteFin) {
            siguienteInicio = addDays(siguienteFin, -10);
        }
    }

    if (siguienteFin.getTime() < siguienteInicio.getTime()) {
        if (source === "manual") {
            alert("La fecha de fin no puede ser menor que la fecha de inicio.");
        }
        setEditorSaveState("error", "Rango de fechas inválido");
        return false;
    }

    const formatIso = typeof formatISODate === "function" ? formatISODate : (d) => d.toISOString();
    const siguienteFechaInicio = formatIso(siguienteInicio);
    const siguienteFechaFin = formatIso(siguienteFin);

    let siguienteSubtareas = editorSubtasksDraft;
    if (typeof sanitizeSubtasks === "function") {
        siguienteSubtareas = sanitizeSubtasks(editorSubtasksDraft, siguienteFechaInicio, siguienteFechaFin);
    }

    if (typeof syncProcessRequiredTasksFromSubtasks === "function") {
        syncProcessRequiredTasksFromSubtasks(project, siguienteSubtareas);
    }
    if (typeof syncSubtasksFromProcessRequiredTasks === "function") {
        syncSubtasksFromProcessRequiredTasks(project);
    }
    if (typeof sanitizeSubtasks === "function") {
        siguienteSubtareas = sanitizeSubtasks(project.subtareas, siguienteFechaInicio, siguienteFechaFin);
    }

    const workflowAfterNormalization = JSON.stringify(project.workflow || {});

    const compareDeps = typeof getProjectDependencies === "function" ? JSON.stringify(getProjectDependencies(project)) : "[]";

    const hayCambios = (
        project.nombre !== nombreNuevo ||
        project.estado !== siguienteEstado ||
        project.etiqueta !== siguienteEtiqueta ||
        project.imagen !== siguienteImagen ||
        project.responsable !== siguienteResponsable ||
        compareDeps !== JSON.stringify(siguientesDependencias) ||
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
    project.nombre = nombreNuevo;
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
        if (typeof resetWorkflowPhaseTasks === "function") resetWorkflowPhaseTasks(project, "proceso");
    }

    if (typeof touchProjectActivity === "function") touchProjectActivity(project, source === "auto" ? "autosave" : "manual-edit");

    setEditorSaveState("saving", source === "auto" ? "Guardando..." : "Guardando cambios...");

    let saved = true;
    if (typeof saveProjects === "function") {
        saved = await saveProjects(projects);
    }

    if (!saved) {
        setEditorSaveState("error", "No se pudo guardar");
        return false;
    }

    if (typeof renderBoard === "function") renderBoard();
    if (typeof buildIndicators === "function") buildIndicators();

    const editedIndex = projects.findIndex((p) => p.id === id);
    if (editedIndex >= 0) {
        if (typeof currentIndex !== "undefined") {
            currentIndex = editedIndex;
            if (typeof updateCarousel === "function") updateCarousel(currentIndex);
        }
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

document.addEventListener("DOMContentLoaded", () => {

    if (editorSelect) {
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
    }

    if (editorPrevBtn) {
        editorPrevBtn.addEventListener("click", async () => {
            if (typeof projects === "undefined" || projects.length < 2 || !currentEditingProjectId) return;
            const currentEditorIndex = projects.findIndex((p) => p.id === currentEditingProjectId);
            const nextIndex = (currentEditorIndex - 1 + projects.length) % projects.length;
            await switchEditorProject(projects[nextIndex].id);
        });
    }

    if (editorNextBtn) {
        editorNextBtn.addEventListener("click", async () => {
            if (typeof projects === "undefined" || projects.length < 2 || !currentEditingProjectId) return;
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

            const fallbackStart = editorFechaInicio?.value || (typeof getComputerTodayISO === "function" ? getComputerTodayISO() : new Date().toISOString());
            const fallbackEnd = editorFechaFin?.value || fallbackStart;

            if (typeof sanitizeSubtasks === "function") {
                editorSubtasksDraft = sanitizeSubtasks(editorSubtasksDraft, fallbackStart, fallbackEnd);
                const alreadyExists = (typeof flattenSubtasks === "function" ? flattenSubtasks(editorSubtasksDraft) : [])
                    .some((subtask) => (typeof normalizeTaskKey === "function" ? normalizeTaskKey(subtask.nombre) : subtask.nombre) === (typeof normalizeTaskKey === "function" ? normalizeTaskKey(nombre) : nombre));
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
            } else {
                editorSubtasksDraft.push({
                    id: `sub-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
                    nombre,
                    estado: "pendiente",
                    fechaInicio: fallbackStart,
                    fechaFin: fallbackEnd,
                    subtareas: []
                });
            }

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

            if (typeof updateSubtaskInTree === "function") {
                return updateSubtaskInTree(editorSubtasksDraft, subtaskId, (subtask) => {
                    if (target.classList.contains("editor-subtask-item-name")) {
                        subtask.nombre = target.value;
                    }
                });
            }
            return false;
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

            if (typeof removeSubtaskFromTree === "function") {
                if (removeSubtaskFromTree(editorSubtasksDraft, subtaskId)) {
                    renderEditorSubtasks();
                    onEditorFieldChange();
                }
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
            const project = (projectId && typeof projects !== "undefined") ? projects.find((p) => p.id === projectId) : null;
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
                author: author || "Anónimo",
                createdAt: new Date().toISOString()
            });

            if (typeof touchProjectActivity === "function") touchProjectActivity(project, "comment");

            let saved = true;
            if (typeof saveProjects === "function") saved = await saveProjects(projects);

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
            const project = (projectId && typeof projects !== "undefined") ? projects.find((p) => p.id === projectId) : null;
            if (!project || !Array.isArray(project.comments)) return;
            if (commentIndex >= project.comments.length) return;

            const confirmDelete = window.confirm(`¿Eliminar este comentario?`);
            if (!confirmDelete) return;

            project.comments.splice(commentIndex, 1);
            if (typeof touchProjectActivity === "function") touchProjectActivity(project, "comment-deleted");

            let saved = true;
            if (typeof saveProjects === "function") saved = await saveProjects(projects);

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

    if (editorCreateBtn) {
        editorCreateBtn.addEventListener("click", async () => {
            if (editorAutosaveTimer) {
                clearTimeout(editorAutosaveTimer);
                editorAutosaveTimer = null;
            }

            const proyectoSeleccionado = (typeof projects !== "undefined") ? projects.find((p) => p.id === currentEditingProjectId) : null;
            if (
                proyectoSeleccionado &&
                editorLoadedProjectBaseline &&
                Number(editorLoadedProjectBaseline.id) === Number(proyectoSeleccionado.id)
            ) {
                replaceProjectFromSnapshot(proyectoSeleccionado, editorLoadedProjectBaseline);
            }

            const nombreNuevo = editorNombre?.value.trim() || "";
            const urlImagenNueva = editorImagen?.value.trim() || "";
            const responsableNuevo = editorResponsable?.value.trim() || "";
            const etiquetaNueva = editorEtiqueta?.value.trim() || "";

            let dependenciasNuevas = [];
            if (typeof parseDependenciesInput === "function") {
                dependenciasNuevas = parseDependenciesInput(editorDependencies?.value || "");
            }

            const fechaInicioNueva = typeof parseISODate === "function" ? parseISODate(typeof getComputerTodayISO === "function" ? getComputerTodayISO() : new Date().toISOString()) : new Date();
            const fechaFinNueva = typeof parseISODate === "function" ? parseISODate(editorFechaFin?.value || "") : null;

            if (!nombreNuevo) {
                alert("Escribe al menos un nombre para crear un nuevo proyecto.");
                return;
            }

            const maxId = (typeof projects !== "undefined" ? projects : []).reduce((max, p) => {
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

            const proyectoBase = (typeof projects !== "undefined") ? projects.find((p) => p.id === currentEditingProjectId) : null;
            let startDate = fechaInicioNueva || new Date();
            let endDate = fechaFinNueva || (typeof parseISODate === "function" ? parseISODate(proyectoBase?.fechaFin || "") : null);

            if (startDate && !endDate && typeof addDays === "function") {
                endDate = addDays(startDate, 12);
            }

            if (endDate && startDate && endDate.getTime() < startDate.getTime()) {
                alert("La fecha de fin no puede ser menor que la fecha de inicio.");
                setEditorSaveState("error", "Rango de fechas inválido");
                return;
            }

            const workflowNuevo = typeof createDefaultProjectWorkflow === "function" ? createDefaultProjectWorkflow() : {};

            const formatIso = typeof formatISODate === "function" ? formatISODate : (d) => d?.toISOString() || "";

            const nuevoProyecto = {
                id: newId,
                nombre: nombreNuevo,
                responsable: responsableNuevo || (proyectoBase?.responsable || "Sin asignar"),
                estado: "pendiente",
                etiqueta: etiquetaNueva || proyectoBase?.etiqueta || "General",
                fechaInicio: formatIso(startDate),
                fechaFin: formatIso(endDate),
                subtareas: typeof sanitizeSubtasks === "function" ? sanitizeSubtasks(editorSubtasksDraft, formatIso(startDate), formatIso(endDate)) : editorSubtasksDraft,
                workflow: workflowNuevo,
                dependencies: dependenciasNuevas,
                imagen: imagenNueva || proyectoBase?.imagen || "",
                comments: [],
                createdAt: new Date().toISOString(),
                lastActivityAt: new Date().toISOString()
            };

            if (typeof normalizeProjectWorkflow === "function") normalizeProjectWorkflow(nuevoProyecto);
            if (typeof ensureProjectMetadata === "function") ensureProjectMetadata(nuevoProyecto);
            if (typeof syncProcessRequiredTasksFromSubtasks === "function") syncProcessRequiredTasksFromSubtasks(nuevoProyecto, nuevoProyecto.subtareas);
            if (typeof syncSubtasksFromProcessRequiredTasks === "function") syncSubtasksFromProcessRequiredTasks(nuevoProyecto);

            pushHistorySnapshot();
            if (typeof projects !== "undefined") {
                projects.push(nuevoProyecto);
            }

            let saved = true;
            if (typeof saveProjects === "function") saved = await saveProjects(projects);

            if (!saved) {
                setEditorSaveState("error", "No se pudo crear");
                return;
            }

            buildProjectOptions(newId);
            loadProjectIntoForm(newId);
            if (typeof renderBoard === "function") renderBoard();
            if (typeof buildIndicators === "function") buildIndicators();

            if (typeof currentIndex !== "undefined") {
                currentIndex = (typeof projects !== "undefined" ? projects.findIndex((p) => p.id === newId) : 0);
                if (currentIndex < 0) currentIndex = 0;
                if (typeof updateCarousel === "function") updateCarousel(currentIndex);
            }
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

            const baseProject = (typeof projects !== "undefined") ? projects.find((p) => p.id === currentEditingProjectId) : null;
            if (!baseProject) return;

            const maxId = (typeof projects !== "undefined" ? projects.reduce((max, p) => Math.max(max, p.id || 0), 0) : 0);
            const newId = maxId + 1;

            const duplicateTemplate = cloneProjectsSnapshot([baseProject])[0];
            const duplicateStartISO = typeof getComputerTodayISO === "function" ? getComputerTodayISO() : new Date().toISOString();
            const duplicateStartDate = typeof parseISODate === "function" ? parseISODate(duplicateStartISO) : new Date(duplicateStartISO);

            let duplicateEndDate = typeof parseISODate === "function" ? parseISODate(duplicateTemplate.fechaFin || "") : null;

            if (!duplicateEndDate || duplicateEndDate.getTime() < duplicateStartDate.getTime()) {
                if (typeof addDays === "function") duplicateEndDate = addDays(duplicateStartDate, 12);
            }

            const formatIso = typeof formatISODate === "function" ? formatISODate : (d) => d?.toISOString() || "";

            const duplicate = {
                ...duplicateTemplate,
                id: newId,
                nombre: `${baseProject.nombre} (copia)`,
                estado: "pendiente",
                fechaInicio: duplicateStartISO,
                fechaFin: formatIso(duplicateEndDate),
                subtareas: typeof sanitizeSubtasks === "function" ? sanitizeSubtasks(
                    duplicateTemplate.subtareas,
                    duplicateStartISO,
                    formatIso(duplicateEndDate)
                ) : [],
                createdAt: new Date().toISOString(),
                lastActivityAt: new Date().toISOString(),
                workflow: duplicateTemplate.workflow
                    ? cloneProjectsSnapshot([duplicateTemplate.workflow])[0]
                    : (typeof createDefaultProjectWorkflow === "function" ? createDefaultProjectWorkflow(Array.isArray(duplicateTemplate.tareas) ? duplicateTemplate.tareas : []) : {})
            };

            if (typeof normalizeProjectWorkflow === "function") normalizeProjectWorkflow(duplicate);
            if (typeof ensureProjectMetadata === "function") ensureProjectMetadata(duplicate);
            if (typeof touchProjectActivity === "function") touchProjectActivity(duplicate, "duplicated");
            if (typeof syncProcessRequiredTasksFromSubtasks === "function") syncProcessRequiredTasksFromSubtasks(duplicate, duplicate.subtareas);
            if (typeof syncSubtasksFromProcessRequiredTasks === "function") syncSubtasksFromProcessRequiredTasks(duplicate);

            pushHistorySnapshot();
            if (typeof projects !== "undefined") projects.push(duplicate);

            let saved = true;
            if (typeof saveProjects === "function") saved = await saveProjects(projects);

            if (!saved) {
                setEditorSaveState("error", "No se pudo duplicar");
                return;
            }

            buildProjectOptions(newId);
            loadProjectIntoForm(newId);
            if (typeof renderBoard === "function") renderBoard();
            if (typeof buildIndicators === "function") buildIndicators();

            if (typeof currentIndex !== "undefined") {
                currentIndex = (typeof projects !== "undefined" ? projects.findIndex((p) => p.id === newId) : 0);
                if (currentIndex < 0) currentIndex = 0;
                if (typeof updateCarousel === "function") updateCarousel(currentIndex);
            }
            setEditorSaveState("clean", "Proyecto duplicado");
        });
    }

    if (editorDeleteBtn) {
        editorDeleteBtn.addEventListener("click", async () => {
            if (typeof projects === "undefined" || !projects.length) return;
            const id = currentEditingProjectId;
            const project = projects.find((p) => p.id === id);
            if (!project) return;

            const confirmar = window.confirm(`¿Seguro que quieres eliminar el proyecto "${project.nombre}"?`);
            if (!confirmar) return;

            pushHistorySnapshot();
            projects = projects.filter((p) => p.id !== id);

            let saved = true;
            if (typeof saveProjects === "function") saved = await saveProjects(projects);

            if (!saved) {
                setEditorSaveState("error", "No se pudo eliminar");
                return;
            }

            if (!projects.length) {
                if (editorSelect) editorSelect.innerHTML = "";
                clearEditorForm();

                const imgEl = document.getElementById("header-img");
                const titleEl = document.getElementById("header-title");
                const statusTextEl = document.getElementById("header-status-text");
                const indicatorsEl = document.getElementById("header-indicators");
                const statusDotEl = document.getElementById("header-status-dot");

                if (imgEl) { imgEl.src = ""; imgEl.alt = ""; }
                if (titleEl) titleEl.textContent = "";
                if (statusTextEl) statusTextEl.textContent = "";
                if (indicatorsEl) indicatorsEl.innerHTML = "";
                if (statusDotEl) statusDotEl.className = "status-dot";

                if (typeof renderBoard === "function") renderBoard();
                setEditorSaveState("clean", "Proyecto eliminado");
                return;
            }

            if (typeof currentIndex !== "undefined") {
                if (currentIndex >= projects.length) {
                    currentIndex = projects.length - 1;
                }

                const nextProject = projects[Math.min(currentIndex, projects.length - 1)];
                buildProjectOptions(nextProject.id);
                loadProjectIntoForm(nextProject.id);
                if (typeof renderBoard === "function") renderBoard();
                if (typeof buildIndicators === "function") buildIndicators();
                if (typeof updateCarousel === "function") updateCarousel(currentIndex);
                setEditorSaveState("clean", "Proyecto eliminado");
            }
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

    if (editorForm) {
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
    }
});

document.addEventListener("keydown", (e) => {
    const tabEditor = document.getElementById("tab-content-editor");
    if (!tabEditor || tabEditor.classList.contains("hidden")) return;

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
