(function attachTaskModel(globalScope) {
  const scope = globalScope || window;
  const appModels = scope.AppModels || (scope.AppModels = {});

  function normalizeTaskKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } 

  class TareaModel {
    static normalizeKey(value) {
      return normalizeTaskKey(value);
    }

    static isDone(task) {
      if (!task || typeof task !== "object") return false;
      if (typeof task.done === "boolean") return task.done;
      if (typeof task.estado === "string") return task.estado === "terminado";
      return false;
    }

    static isCritical(task) {
      if (!task || typeof task !== "object") return false;
      return !!task.required;
    }
  }

  appModels.TareaModel = TareaModel;
})(window);
