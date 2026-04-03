// ── 啟動 ──────────────────────────────────────────────
(async () => {
  await loadOrders();
  addOrderForm();
  renderSummary();
  setTimeout(() => window.scrollTo({ top: 0 }), 100);
  setTimeout(checkCodAlert, 1200);
})();
