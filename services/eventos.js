(function attachEventService(globalScope) {
  const scope = globalScope || window;
  const appServices = scope.AppServices || (scope.AppServices = {});
  const eventos = appServices.eventos || (appServices.eventos = {});

  class EventBus {
    constructor() {
      this.listeners = new Map();
    }

    on(eventName, handler) {
      if (typeof handler !== "function") {
        return function noop() {};
      }
      const safeEventName = String(eventName || "").trim();
      if (!safeEventName) {
        return function noop() {};
      }

      if (!this.listeners.has(safeEventName)) {
        this.listeners.set(safeEventName, new Set());
      }
      const handlers = this.listeners.get(safeEventName);
      handlers.add(handler);

      return () => {
        handlers.delete(handler);
        if (!handlers.size) {
          this.listeners.delete(safeEventName);
        }
      };
    }

    emit(eventName, payload) {
      const safeEventName = String(eventName || "").trim();
      if (!safeEventName) return;
      const handlers = this.listeners.get(safeEventName);
      if (!handlers || !handlers.size) return;

      const eventPacket = {
        name: safeEventName,
        payload: payload || {},
        timestamp: new Date().toISOString()
      };

      handlers.forEach((handler) => {
        try {
          handler(eventPacket);
        } catch (error) {
          console.error(`Error manejando evento "${safeEventName}"`, error);
        }
      });
    }
  }

  const EVENTS = Object.freeze({
    WORKFLOW_TASK_TOGGLED: "tareaActualizada",
    WORKFLOW_TASK_COMPLETED: "tareaCompletada",
    WORKFLOW_TASK_REOPENED: "tareaReabierta",
    WORKFLOW_TASK_ADDED: "tareaAgregada",
    WORKFLOW_TASK_UPDATED: "tareaEditada",
    WORKFLOW_TASK_REMOVED: "tareaEliminada",
    PROJECT_STATUS_CHANGED: "estadoProyectoCambiado",
    PROJECT_CHANGED: "proyectoActualizado",
    UI_VIEW_MODE_CHANGED: "modoVistaCambiado"
  });

  const bus = new EventBus();

  eventos.EventBus = EventBus;
  eventos.EVENTS = EVENTS;
  eventos.bus = bus;
  eventos.on = function on(eventName, handler) {
    return bus.on(eventName, handler);
  };
  eventos.emit = function emit(eventName, payload) {
    bus.emit(eventName, payload);
  };
})(window);
