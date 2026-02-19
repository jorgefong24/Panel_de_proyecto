(function attachUiRender(globalScope) {
  const scope = globalScope || window;
  const appUi = scope.AppUI || (scope.AppUI = {});
  const render = appUi.render || (appUi.render = {});

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderRiskBadge(level) {
    const safeLevel = ["low", "medium", "high"].includes(level) ? level : "low";
    const labels = { low: "Riesgo bajo", medium: "Riesgo medio", high: "Riesgo alto" };
    return `<span class="card-risk-badge ${safeLevel}">${labels[safeLevel]}</span>`;
  }

  function renderAlertList(alerts, maxItems) {
    const list = Array.isArray(alerts) ? alerts : [];
    if (!list.length) return "";
    const limit = Number.isFinite(maxItems) && maxItems > 0 ? Math.floor(maxItems) : 3;
    const items = list.slice(0, limit).map((message) => `
      <div class="card-alert-item">${escapeHtml(message)}</div>
    `).join("");
    return `<div class="card-alert-list">${items}</div>`;
  }

  render.escapeHtml = escapeHtml;
  render.renderRiskBadge = renderRiskBadge;
  render.renderAlertList = renderAlertList;
})(window);
