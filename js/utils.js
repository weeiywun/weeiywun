// ── 工具函式 ──────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function today() { return new Date().toISOString().slice(0, 10); }

function switchTab(t) {
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === t));
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.getElementById('sec-' + t).classList.add('active');
  if (t === 'orders') { renderOrders(); renderSummary(); }
  if (t === 'add') { if(document.querySelectorAll('.order-form-card').length===0) addOrderForm(); renderSummary(); }
  if (t === 'vendors') renderVendors();
  if (t === 'price') initPriceSearch();
  if (t === 'cod') { renderCodList(); initCodDate(); }
  setTimeout(() => window.scrollTo({ top: 0 }), 50);
}

// ── 匯出 & 備份 ───────────────────────────────────────
function exportCSV() {
  let csv = '\uFEFF日期,訂單編號,廠商,商品名,數量,單位,單價,小計,訂單總金額,狀態,付款日期,付款方式,付款備註,訂單備註\n';
  orders.sort((a,b)=>a.date.localeCompare(b.date)).forEach(o => {
    o.items.forEach((item,i) => {
      csv += [o.date, o.orderId, o.vendor, item.name, item.qty, item.unit||'斤', item.price,
        Math.round(item.qty*item.price), i===0?o.total:'',
        o.status==='paid'?'已付款':'未付款', o.paidDate||'',
        i===0?(o.payMethod||''):'' , i===0?(o.payNote||''):'',
        i===0?(o.note||''):''
      ].join(',') + '\n';
    });
  });
  dl(new Blob([csv],{type:'text/csv;charset=utf-8'}), '惟元進貨記錄_'+today()+'.csv');
  toast('✓ CSV 已匯出');
}

function backupData() {
  const blob = new Blob([JSON.stringify(orders,null,2)],{type:'application/json'});
  dl(blob, '惟元進貨備份_'+today()+'.json');
  toast('✓ 備份完成');
}

function dl(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
}

async function forceResync() {
  if (!supabaseReady) { toast('目前為離線模式，無法同步'); return; }
  setSyncStatus('syncing', '檢查資料完整性…');
  await importHistory();
  renderOrders();
  renderSummary();
  toast('✓ 同步完成');
}
