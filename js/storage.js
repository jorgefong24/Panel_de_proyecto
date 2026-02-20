  // === Persistencia hiÂ­brida: Firebase Firestore + localStorage ===
  const STORAGE_KEY = "tablero_proyectos_data";
  const FIRESTORE_COLLECTION = "proyectos";
  const FIRESTORE_DOC_ID = "tablero_principal";
  const LEGACY_SCRUM_STORAGE_KEYS = [
    "tablero_proyectos_scrum",
    "tablero_scrum_data",
    "tablero_scrum_state",
    "imc_scrum_state",
    "scrum_state"
  ];
  const LEGACY_SCRUM_FIELD_KEYS = new Set([
    "scrum",
    "scrumState",
    "scrumData",
    "sprint",
    "sprintPlanning",
    "burndown",
    "velocity",
    "selectedTasks",
    "storyPoints",
    "doneAt",
    "committedPoints",
    "remainingPoints"
  ]);
  let firestoreUnsubscribe = null;
  let isSyncing = false;
  let hasShownLocalStorageSaveError = false;
  let hasShownLocalStorageDegradedWarning = false;

  function isLocalStorageQuotaError(error) {
    if (!error) return false;
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014
    );
  }

  function stripInlineImagesForLocalStorage(projectsToSave) {
    if (!Array.isArray(projectsToSave)) return [];
    return projectsToSave.map((project) => {
      if (!project || typeof project !== "object") return project;
      const safeProject = { ...project };
      if (typeof safeProject.imagen === "string" && safeProject.imagen.startsWith("data:image/")) {
        safeProject.imagen = "";
      }
      return safeProject;
    });
  }

  function cleanupLegacyScrumStorageKeys() {
    LEGACY_SCRUM_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn("No se pudo limpiar la llave legacy", key, error);
      }
    });
  }

  function stripLegacyScrumFieldsDeep(value) {
    if (Array.isArray(value)) {
      let changed = false;
      const cleanedArray = value.map((item) => {
        const result = stripLegacyScrumFieldsDeep(item);
        if (result.changed) changed = true;
        return result.value;
      });
      return changed ? { value: cleanedArray, changed: true } : { value, changed: false };
    }

    if (!value || typeof value !== "object") {
      return { value, changed: false };
    }

    let changed = false;
    const cleanedObject = {};
    Object.keys(value).forEach((key) => {
      if (LEGACY_SCRUM_FIELD_KEYS.has(key)) {
        changed = true;
        return;
      }
      const nested = stripLegacyScrumFieldsDeep(value[key]);
      cleanedObject[key] = nested.value;
      if (nested.changed) changed = true;
    });

    return changed ? { value: cleanedObject, changed: true } : { value, changed: false };
  }

  function sanitizeLegacyScrumArtifacts(projectsInput) {
    if (!Array.isArray(projectsInput)) {
      return { projects: null, changed: false };
    }
    const cleaned = stripLegacyScrumFieldsDeep(projectsInput);
    const projects = Array.isArray(cleaned.value) ? cleaned.value : [];
    return { projects, changed: !!cleaned.changed };
  }

  // FunciÃ³n para cargar desde localStorage (respaldo local)
  function loadProjectsFromLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      const cleaned = sanitizeLegacyScrumArtifacts(parsed);
      if (cleaned.changed) {
        saveProjectsToLocal(cleaned.projects);
      }
      return cleaned.projects;
    } catch (e) {
      console.error("Error cargando proyectos de localStorage", e);
      return null;
    }
  }

  // FunciÃ³n para guardar en localStorage (respaldo local)
  function saveProjectsToLocal(projectsToSave) {
    const cleaned = sanitizeLegacyScrumArtifacts(projectsToSave);
    const payload = Array.isArray(cleaned.projects) ? cleaned.projects : [];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return { ok: true, degraded: false };
    } catch (e) {
      if (isLocalStorageQuotaError(e)) {
        try {
          const strippedProjects = stripInlineImagesForLocalStorage(payload);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(strippedProjects));
          return { ok: true, degraded: true };
        } catch (fallbackError) {
          console.error("Error guardando versiÃ³n reducida en localStorage", fallbackError);
        }
      }
      console.error("Error guardando proyectos en localStorage", e);
      return { ok: false, degraded: false };
    }
  }

  // FunciÃ³n para cargar desde Firestore
  async function loadProjectsFromFirestore() {
    if (!window.firebaseReady || !window.firestore) return null;
    
    try {
      if (!window.firebaseDoc || !window.firebaseGetDoc) {
        console.warn("Funciones de Firestore no disponibles");
        return null;
      }
      
      const docRef = window.firebaseDoc(window.firestore, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
      const docSnap = await window.firebaseGetDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!Array.isArray(data.projects)) return null;
        return sanitizeLegacyScrumArtifacts(data.projects).projects;
      }
      return null;
    } catch (e) {
      console.error("Error cargando proyectos de Firestore", e);
      return null;
    }
  }

  // FunciÃ³n para guardar en Firestore
  async function saveProjectsToFirestore(projectsToSave) {
    if (!window.firebaseReady || !window.firestore) return false;
    const cleaned = sanitizeLegacyScrumArtifacts(projectsToSave);
    const payload = Array.isArray(cleaned.projects) ? cleaned.projects : [];
    
    try {
      if (!window.firebaseDoc || !window.firebaseSetDoc) {
        console.warn("Funciones de Firestore no disponibles");
        return false;
      }
      
      const docRef = window.firebaseDoc(window.firestore, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
      await window.firebaseSetDoc(docRef, { 
        projects: payload,
        lastUpdate: new Date().toISOString()
      }, { merge: false });
      return true;
    } catch (e) {
      console.error("Error guardando proyectos en Firestore", e);
      return false;
    }
  }

  // FunciÃ³n principal para cargar proyectos (intenta Firestore primero, luego localStorage)
  async function loadProjects() {
    // Intentar cargar desde Firestore primero
    const firestoreProjects = await loadProjectsFromFirestore();
    if (firestoreProjects) {
      // Guardar tambiÃ©n en localStorage como respaldo
      saveProjectsToLocal(firestoreProjects);
      return firestoreProjects;
    }
    
    // Si no hay en Firestore, cargar desde localStorage
    return loadProjectsFromLocal();
  }

  // FunciÃ³n principal para guardar proyectos (guarda en ambos lugares)
  async function saveProjects(projectsToSave) {
    // Si estamos sincronizando desde Firestore, no guardar para evitar bucles
    if (isSyncing) {
      return true;
    }
    
    // Guardar siempre en localStorage primero (mÃ¡s rÃ¡pido)
    const localResult = saveProjectsToLocal(projectsToSave);
    const localOk = !!localResult?.ok;
    
    // Intentar guardar en Firestore (puede fallar si no estÃ¡ configurado)
    const firestoreOk = await saveProjectsToFirestore(projectsToSave);
    
    if (!localOk) {
      if (!hasShownLocalStorageSaveError) {
        alert("No se pudo guardar en el navegador (localStorage). Si subiste una imagen grande, intenta una mÃ¡s liviana o usa una URL.");
        hasShownLocalStorageSaveError = true;
      }
      return !!firestoreOk;
    }

    hasShownLocalStorageSaveError = false;

    if (localResult.degraded) {
      if (!hasShownLocalStorageDegradedWarning) {
        alert("Se guardÃ³ una versiÃ³n reducida en localStorage (sin imÃ¡genes locales pesadas). Usa URL de imagen para conservar respaldo local completo.");
        hasShownLocalStorageDegradedWarning = true;
      }
    } else {
      hasShownLocalStorageDegradedWarning = false;
    }
    
    return true;
  }

  // FunciÃ³n para configurar sincronizaciÃ³n en tiempo real desde Firestore
  async function setupRealtimeSync() {
    if (!window.firebaseReady || !window.firestore) return;
    
    try {
      if (!window.firebaseDoc || !window.firebaseOnSnapshot) {
        console.warn("Funciones de Firestore no disponibles para sincronizaciÃ³n");
        return;
      }
      
      const docRef = window.firebaseDoc(window.firestore, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
      
      // Cancelar suscripciÃ³n anterior si existe
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
      
      // Escuchar cambios en tiempo real
      firestoreUnsubscribe = window.firebaseOnSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && !isSyncing) {
          const data = docSnap.data();
          const newProjects = sanitizeLegacyScrumArtifacts(data.projects || []).projects || [];
          
          // Actualizar solo si los datos son diferentes
          const currentProjectsStr = JSON.stringify(projects);
          const newProjectsStr = JSON.stringify(newProjects);
          
          if (currentProjectsStr !== newProjectsStr) {
            isSyncing = true;
            projects = newProjects;
            normalizeProjectsSchedule();
            clearHistoryStacks();
            
            // Actualizar UI
            renderBoard();
            buildIndicators();
            if (currentIndex >= projects.length) currentIndex = 0;
            updateCarousel(currentIndex);
            
            // Actualizar selector si estan en la pestaÃ±a de ediciÃ³n
            if (projects.length > 0) {
              const activeEditorId = Number(currentEditingProjectId);
              const hasActiveEditorProject = Number.isFinite(activeEditorId) && activeEditorId > 0;
              const stillExists = hasActiveEditorProject && projects.some((p) => Number(p.id) === activeEditorId);
              buildProjectOptions(stillExists ? activeEditorId : null);
              if (stillExists) {
                loadProjectIntoForm(activeEditorId);
              } else {
                currentEditingProjectId = null;
                editorLoadedProjectBaseline = null;
                if (editorSelect) editorSelect.selectedIndex = -1;
                updateEditorNavigationState();
              }
            } else {
              buildProjectOptions();
              clearEditorForm();
            }
            
            // Guardar tambiÃƒÂ©n en localStorage
            saveProjectsToLocal(projects);
            
            isSyncing = false;
          }
        }
      }, (error) => {
        console.error("Error en sincronizaciÃ³n en tiempo real:", error);
      });
      
      console.log("Ã¢Å“â€¦ SincronizaciÃ³n en tiempo real activada");
    } catch (e) {
      console.error("Error configurando sincronizaciÃ³n en tiempo real", e);
    }
  }

