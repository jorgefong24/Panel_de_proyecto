(function attachWorkflowService(globalScope) {
  const scope = globalScope || window;
  const appServices = scope.AppServices || (scope.AppServices = {});
  const workflow = appServices.workflow || (appServices.workflow = {});

  class ProjectStateMachine {
    constructor(transitions) {
      this.transitions = transitions || {};
    }

    canTransition(fromStatus, toStatus) {
      if (fromStatus === toStatus) return true;
      const allowed = this.transitions[fromStatus] || [];
      return allowed.includes(toStatus);
    }
  }

  function createDefaultStateMachine() {
    return new ProjectStateMachine({
      pendiente: ["proceso"],
      proceso: ["pendiente", "terminado"],
      terminado: ["proceso", "pendiente"]
    });
  }

  workflow.ProjectStateMachine = ProjectStateMachine;
  workflow.createDefaultStateMachine = createDefaultStateMachine;
  workflow.projectStateMachine = createDefaultStateMachine();
})(window);
