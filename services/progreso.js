(function attachProgressService(globalScope) {
  const scope = globalScope || window;
  const appServices = scope.AppServices || (scope.AppServices = {});
  const progreso = appServices.progreso || (appServices.progreso = {});

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function statusProgressFallback(status) {
    if (status === "terminado") return 100;
    if (status === "proceso") return 60;
    return 20;
  }

  function computeScheduleDelayPercent(project, helpers) {
    const parseISODate = helpers?.parseISODate;
    const dayDiff = helpers?.dayDiff;
    const todayISO = helpers?.todayISO;
    const workflowProgress = helpers?.workflowProgress;

    if (typeof parseISODate !== "function" || typeof dayDiff !== "function") {
      return { expectedProgress: 0, actualProgress: 0, delayPercent: 0 };
    }

    const start = parseISODate(project?.fechaInicio || "");
    const end = parseISODate(project?.fechaFin || "");
    const today = parseISODate(todayISO || "");
    if (!start || !end || !today) {
      return { expectedProgress: 0, actualProgress: 0, delayPercent: 0 };
    }

    const totalDays = Math.max(1, dayDiff(start, end) + 1);
    const elapsedDaysRaw = dayDiff(start, today) + 1;
    const elapsedDays = clamp(elapsedDaysRaw, 0, totalDays);
    const expectedProgress = Math.round((elapsedDays / totalDays) * 100);

    const actualProgress = clamp(
      Number.isFinite(workflowProgress) ? workflowProgress : statusProgressFallback(project?.estado),
      0,
      100
    );

    return {
      expectedProgress,
      actualProgress,
      delayPercent: expectedProgress - actualProgress
    };
  }

  progreso.computeScheduleDelayPercent = computeScheduleDelayPercent;
})(window);
