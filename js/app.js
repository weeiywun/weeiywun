// ── 啟動與初始化 ─────────────────────────────────────
(async () => {
  // 載入資料
  await loadOrders();
  addOrderForm();
  renderSummary();
  setTimeout(() => window.scrollTo({ top: 0 }), 100);
  setTimeout(checkCodAlert, 1200);
  
  // 設置 debounce 搜尋
  initDebouncedSearch();
})();

// ── 初始化 Debounced 搜尋 ──────────────────────────────
function initDebouncedSearch() {
  const debouncedRenderOrders = debounce(renderOrders, 300);
  const debouncedPriceSearch = debounce(renderPriceSearch, 300);
  const debouncedVendorTabs = debounce(renderVendorTabs, 300);
  
  // 訂單搜尋
  const vendorFilter = document.getElementById('filter-vendor');
  const orderidFilter = document.getElementById('filter-orderid');
  const itemFilter = document.getElementById('filter-item');
  
  if (vendorFilter) {
    vendorFilter.removeAttribute('oninput');
    vendorFilter.addEventListener('input', debouncedRenderOrders);
  }
  if (orderidFilter) {
    orderidFilter.removeAttribute('oninput');
    orderidFilter.addEventListener('input', debouncedRenderOrders);
  }
  if (itemFilter) {
    itemFilter.removeAttribute('oninput');
    itemFilter.addEventListener('input', debouncedRenderOrders);
  }
  
  // 價格查詢搜尋
  const priceSearch = document.getElementById('price-search');
  if (priceSearch) {
    priceSearch.removeAttribute('oninput');
    priceSearch.addEventListener('input', debouncedPriceSearch);
  }
  
  // 廠商搜尋
  const vendorSearch = document.getElementById('vendor-search');
  if (vendorSearch) {
    vendorSearch.removeAttribute('oninput');
    vendorSearch.addEventListener('input', debouncedVendorTabs);
  }
}

