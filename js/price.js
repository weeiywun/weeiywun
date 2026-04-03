// ── 歷史價格查詢 ──────────────────────────────────────
function initPriceSearch() {
  const vendors = [...new Set(orders.map(o=>o.vendor))].sort();
  const sel = document.getElementById('price-vendor');
  sel.innerHTML = '<option value="">所有廠商</option>' + vendors.map(v=>`<option value="${v}">${v}</option>`).join('');
  document.getElementById('price-search').value = '';
  document.getElementById('price-results').innerHTML = '<div style="color:var(--text3);font-size:13px;padding:1rem 0;">輸入商品名稱開始查詢，例如：北耆王、天麻、枸杞、特炊芎…</div>';
}

function renderPriceSearch() {
  const q = document.getElementById('price-search').value.toLowerCase().trim();
  const fv = document.getElementById('price-vendor').value;
  if (!q) { document.getElementById('price-results').innerHTML = '<div style="color:var(--text3);font-size:13px;padding:1rem 0;">輸入商品名稱開始查詢…</div>'; return; }

  const hits = [];
  orders.forEach(o => {
    if (fv && o.vendor !== fv) return;
    o.items.forEach(i => {
      if (i.name.toLowerCase().includes(q)) {
        hits.push({ date: o.date, vendor: o.vendor, name: i.name, qty: i.qty, price: i.price, orderId: o.orderId });
      }
    });
  });
  hits.sort((a, b) => b.date.localeCompare(a.date));

  if (!hits.length) { document.getElementById('price-results').innerHTML = '<div class="empty">找不到相符的商品記錄</div>'; return; }

  const prices = hits.map(h => h.price).filter(p => p > 0);
  const minP = Math.min(...prices), maxP = Math.max(...prices), avgP = prices.reduce((s,p)=>s+p,0)/prices.length;

  document.getElementById('price-results').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:1rem;">
      <div class="metric"><div class="metric-label">查詢筆數</div><div class="metric-value">${hits.length}</div></div>
      <div class="metric"><div class="metric-label">價格範圍</div><div class="metric-value" style="font-size:16px;">$${minP.toLocaleString()} ~ $${maxP.toLocaleString()}</div></div>
      <div class="metric"><div class="metric-label">平均單價</div><div class="metric-value">$${Math.round(avgP).toLocaleString()}</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>日期</th><th>廠商</th><th>商品名稱</th><th>數量（斤）</th><th>單價</th><th>小計</th></tr></thead>
        <tbody>
          ${hits.map(h=>`<tr>
            <td>${h.date}</td>
            <td style="font-weight:500;">${h.vendor}</td>
            <td>${h.name}</td>
            <td style="color:var(--text2);">${h.qty}</td>
            <td style="font-weight:600;color:var(--blue);">$${h.price.toLocaleString()}</td>
            <td style="color:var(--text2);">$${Math.round(h.qty*h.price).toLocaleString()}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}
