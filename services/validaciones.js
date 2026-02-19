(function attachValidationService(globalScope) {
  const scope = globalScope || window;
  const appServices = scope.AppServices || (scope.AppServices = {});
  const validaciones = appServices.validaciones || (appServices.validaciones = {});

  function normalizeKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getRequiredTasks(project, phase) {
    const phaseData = project?.workflow?.[phase];
    if (!phaseData || typeof phaseData !== "object") return [];
    return Array.isArray(phaseData.required) ? phaseData.required : [];
  }

  function getDependencyIds(project) {
    if (scope.AppModels?.ProyectoModel?.getDependencies) {
      return scope.AppModels.ProyectoModel.getDependencies(project);
    }
    if (!Array.isArray(project?.dependencies)) return [];
    return project.dependencies
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  function evaluateProjectRisk(project, context) {
    const safeContext = context || {};
    const projectList = Array.isArray(safeContext.projects) ? safeContext.projects : [];
    const parseISODate = safeContext.parseISODate;
    const dayDiff = safeContext.dayDiff;
    const todayISO = safeContext.todayISO;
    const workflowProgress = safeContext.workflowProgress;

    const pendingRequired = getRequiredTasks(project, "pendiente");
    const processRequired = getRequiredTasks(project, "proceso");

    const materialPending = pendingRequired.some((task) => {
      const key = normalizeKey(task?.nombre || task?.id || "");
      return key.includes("material") && !task?.done;
    });

    const openCriticalTasks = Number.isFinite(safeContext.openCriticalTasks)
      ? safeContext.openCriticalTasks
      : [...pendingRequired, ...processRequired].filter((task) => !task?.done).length;

    const progresoService = scope.AppServices?.progreso;
    const schedule = (typeof progresoService?.computeScheduleDelayPercent === "function")
      ? progresoService.computeScheduleDelayPercent(project, {
          parseISODate,
          dayDiff,
          todayISO,
          workflowProgress
        })
      : { delayPercent: 0 };
    const delayPercent = Number.isFinite(schedule.delayPercent) ? schedule.delayPercent : 0;
    const delayHigh = delayPercent > 20;

    const dependencyIds = getDependencyIds(project);
    const blockedByDependency = dependencyIds.some((dependencyId) => {
      const depProject = projectList.find((item) => Number(item?.id) === Number(dependencyId));
      return depProject && depProject.estado !== "terminado";
    });

    let inactivityDays = 0;
    if (typeof parseISODate === "function" && typeof dayDiff === "function") {
      const today = parseISODate(todayISO || "");
      const lastActivityDate = parseISODate(String(project?.lastActivityAt || "").slice(0, 10));
      if (today && lastActivityDate) {
        inactivityDays = Math.max(0, dayDiff(lastActivityDate, today));
      }
    }
    const inactiveTooLong = inactivityDays >= 3;

    const alerts = [];
    if (materialPending) alerts.push("Faltan materiales obligatorios");
    if (blockedByDependency) alerts.push("Proyecto bloqueado por dependencia");
    if (inactiveTooLong) alerts.push(`${inactivityDays} dias sin actividad`);
    if (delayHigh) alerts.push(`Retraso mayor al 20% (${Math.round(delayPercent)}%)`);
    if (openCriticalTasks >= 3) alerts.push(`Muchas tareas criticas abiertas (${openCriticalTasks})`);

    let score = 0;
    if (materialPending) score += 3;
    if (blockedByDependency) score += 3;
    if (delayHigh) score += 2;
    if (inactiveTooLong) score += 1;
    if (openCriticalTasks >= 3) score += 2;

    let level = "low";
    if (score >= 5 || alerts.length >= 3) {
      level = "high";
    } else if (score >= 2 || alerts.length >= 1) {
      level = "medium";
    }

    return {
      level,
      score,
      alerts,
      delayPercent,
      openCriticalTasks,
      materialPending,
      blockedByDependency,
      inactivityDays
    };
  }

  validaciones.evaluateProjectRisk = evaluateProjectRisk;
})(window);
