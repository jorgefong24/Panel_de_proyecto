(function attachProjectModel(globalScope) {
  const scope = globalScope || window;
  const appModels = scope.AppModels || (scope.AppModels = {});

  class ProyectoModel {
    static ensureMetadata(project) {
      if (!project || typeof project !== "object") return false;
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

    static getDependencies(project) {
      if (!project || typeof project !== "object") return [];
      if (!Array.isArray(project.dependencies)) return [];
      return project.dependencies
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);
    }
  }

  appModels.ProyectoModel = ProyectoModel;
})(window);
