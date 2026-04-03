// ── 廠商彙總 ──────────────────────────────────────────
let currentCategory = '中藥材';
let currentVendor = null;

function selectVendorCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.vendor-cat-tab').forEach(el =>
    el.classList.toggle('active', el.dataset.cat === cat)
  );
  currentVendor = null;
  renderVendorTabs();
}

function clearVendorFilters() {
  document.getElementById('vendor-search').value = '';
  document.getElementById('vendor-date-from').value = '';
  document.getElementById('vendor-date-to').value = '';
  renderVendorTabs();
}

function getVendorMap() {
  const dateFrom = document.getElementById('vendor-date-from').value;
  const dateTo   = document.getElementById('vendor-date-to').value;
  const map = {};
  orders.forEach(o => {
    if (dateFrom && o.date < dateFrom) return;
    if (dateTo   && o.date > dateTo)   return;
    if (!map[o.vendor]) map[o.vendor] = { orders:[], total:0, paid:0, unpaid:0 };
    map[o.vendor].orders.push(o);
    map[o.vendor].total += o.total;
    if (o.status === 'paid') map[o.vendor].paid += o.total;
    else map[o.vendor].unpaid += o.total;
  });
  return map;
}

function renderVendors() { renderVendorTabs(); }

function renderVendorTabs() {
  const search = document.getElementById('vendor-search').value.toLowerCase();
  const map = getVendorMap();
  const allCatVendors = new Set(Object.values(VENDOR_CATEGORIES).flat());

  let names;
  if (currentCategory === '其他') {
    names = Object.keys(map)
      .filter(v => !allCatVendors.has(v) && (!search || v.toLowerCase().includes(search)))
      .sort((a,b) => a.localeCompare(b, 'zh-TW'));
  } else {
    const catVendors = VENDOR_CATEGORIES[currentCategory] || [];
    names = catVendors.filter(v =>
      map[v] && (!search || v.toLowerCase().includes(search))
    );
    if (search) {
      Object.keys(map).forEach(v => {
        if (!allCatVendors.has(v) && v.toLowerCase().includes(search) && !names.includes(v))
          names.push(v);
      });
    }
  }

  if (!names.length) {
    document.getElementById('vendor-tabs').innerHTML = '';
    document.getElementById('vendor-summary-bar').innerHTML = '';
    document.getElementById('vendor-content').innerHTML = '<div class="empty">此分類沒有廠商資料</div>';
    document.getElementById('vendor-total-card').innerHTML = '';
    return;
  }

  if (!currentVendor || !names.includes(currentVendor)) {
    currentVendor = names[0];
  }

  document.getElementById('vendor-tabs').innerHTML = names.map(v => {
    const safeV = v.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const hasUnpaid = map[v] && map[v].unpaid > 0;
    return `<button class="vendor-tab ${v===currentVendor?'active':''}" onclick="selectVendorTab('${safeV}')">${v}${hasUnpaid?'<span class="unpaid-dot"></span>':''}</button>`;
  }).join('');

  renderVendorContent();
  renderVendorTotalCard();
}

function renderVendorTotalCard() {
  const map = getVendorMap();
  if (!currentVendor || !map[currentVendor]) {
    document.getElementById('vendor-total-card').innerHTML = '';
    return;
  }
  const d = map[currentVendor];
  document.getElementById('vendor-total-card').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1.25rem;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);">
      <span style="font-size:13px;font-weight:600;color:var(--text);">${currentVendor}</span>
      <span style="font-size:13px;color:var(--text2);">累計 <b>${d.orders.length}</b> 筆</span>
      <span style="font-size:16px;font-weight:600;">$${d.total.toLocaleString()}</span>
    </div>`;
}

function selectVendorTab(v) {
  currentVendor = v;
  document.querySelectorAll('.vendor-tab').forEach(el => {
    const label = el.childNodes[0].textContent.trim();
    el.classList.toggle('active', label === v);
  });
  renderVendorContent();
  renderVendorTotalCard();
}

function renderVendorContent() {
  const map = getVendorMap();
  const dateFrom = document.getElementById('vendor-date-from').value;
  const dateTo   = document.getElementById('vendor-date-to').value;
  const hasRange = dateFrom || dateTo;

  if (!currentVendor || !map[currentVendor]) {
    document.getElementById('vendor-content').innerHTML = '<div class="empty">請選擇廠商</div>';
    document.getElementById('vendor-summary-bar').innerHTML = '';
    return;
  }

  const d = map[currentVendor];
  const names = Object.keys(map);
  const rangeText = hasRange ? `${dateFrom||'最早'} ～ ${dateTo||'最新'}` : '全部期間';

  const unpaidVendorCount = names.filter(v => map[v].unpaid > 0).length;
  const unpaidOrderCount  = names.reduce((s,v) => s + map[v].orders.filter(o=>o.status==='pending').length, 0);
  const unpaidTotal       = names.reduce((s,v) => s + map[v].unpaid, 0);

  document.getElementById('vendor-summary-bar').innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1rem 1.25rem;box-shadow:var(--shadow);margin-bottom:1rem;">
      <div style="font-size:12px;color:var(--text2);font-weight:500;letter-spacing:.01em;margin-bottom:.75rem;">
        ${rangeText}　共 ${names.length} 家廠商
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <div><div style="font-size:11px;color:var(--text3);margin-bottom:3px;">未付款筆數</div><div style="font-size:22px;font-weight:600;color:var(--amber);">${unpaidOrderCount} 筆</div></div>
        <div><div style="font-size:11px;color:var(--text3);margin-bottom:3px;">未付款廠商</div><div style="font-size:22px;font-weight:600;color:var(--amber);">${unpaidVendorCount} 家</div></div>
        <div><div style="font-size:11px;color:var(--text3);margin-bottom:3px;">未付款總額</div><div style="font-size:22px;font-weight:600;color:var(--amber);">$${unpaidTotal.toLocaleString()}</div></div>
      </div>
    </div>`;

  const unpaidOrders = d.orders.filter(o => o.status === 'pending').sort((a,b) => b.date.localeCompare(a.date));
  const paidOrders   = d.orders.filter(o => o.status === 'paid').sort((a,b) => b.date.localeCompare(a.date));

  function makeRows(list) {
    return list.map(o => `
      <tr class="order-row" onclick="showDetail('${o.id}')">
        <td>${o.date}</td>
        <td class="mono">${o.orderId||'—'}</td>
        <td style="color:var(--text2);font-size:12px;">${o.items.map(i => {
            const isNeg = Math.round(i.qty * i.price) < 0;
            return isNeg ? `<span style="color:#e53e3e;">↩${i.name}</span>` : i.name;
          }).join('、')}</td>
        <td style="font-weight:600;">$${o.total.toLocaleString()}</td>
        <td><span class="badge ${o.status==='paid'?'badge-paid':'badge-pending'}">${o.status==='paid'?'已付款':'未付款'}</span></td>
        <td style="font-size:12px;color:var(--text3);">${o.paidDate||'—'}</td>
      </tr>`).join('');
  }

  const unpaidCard = unpaidOrders.length > 0 ? `
    <div class="vendor-card" style="border-color:var(--amber);margin-bottom:1rem;">
      <div class="vendor-header" style="background:rgba(245,158,11,.06);">
        <div>
          <div class="vendor-name">${currentVendor}</div>
          <div class="vendor-meta" style="color:var(--amber);">未付款　${unpaidOrders.length} 筆</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:var(--amber);margin-bottom:4px;">未付款總額</div>
          <div style="font-size:22px;font-weight:600;color:var(--amber);margin-bottom:8px;">$${d.unpaid.toLocaleString()}</div>
          <button class="btn btn-sm btn-success" onclick="batchMarkVendorPaid('${currentVendor.replace(/'/g,"\\'")}')">✓ 標記此廠商全部付清</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>日期</th><th>訂單編號</th><th>商品</th><th>金額</th><th>狀態</th><th>付款日</th></tr></thead>
          <tbody>${makeRows(unpaidOrders)}</tbody>
        </table>
      </div>
    </div>` : `
    <div style="padding:.85rem 1.25rem;margin-bottom:1rem;background:rgba(34,197,94,.06);border:1px solid var(--green);border-radius:14px;font-size:13px;color:var(--green);font-weight:500;">
      ✓ ${currentVendor} 無未付款訂單
    </div>`;

  const paidCard = paidOrders.length > 0 ? `
    <div class="vendor-card" style="opacity:.85;">
      <div class="vendor-header">
        <div>
          <div class="vendor-name" style="color:var(--text2);">${currentVendor}</div>
          <div class="vendor-meta">已付款　${paidOrders.length} 筆</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px;">已付款總額</div>
          <div style="font-size:20px;font-weight:600;color:var(--green);">$${d.paid.toLocaleString()}</div>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>日期</th><th>訂單編號</th><th>商品</th><th>金額</th><th>狀態</th><th>付款日</th></tr></thead>
          <tbody>${makeRows(paidOrders)}</tbody>
        </table>
      </div>
    </div>` : '';

  document.getElementById('vendor-content').innerHTML = unpaidCard + paidCard;
}

async function batchMarkVendorPaid(vendor) {
  const unpaidList = orders.filter(o => o.vendor === vendor && o.status === 'pending');
  if (!unpaidList.length) { toast('此廠商已無未付款訂單'); return; }

  const total = unpaidList.reduce((s, o) => s + o.total, 0);
  const confirmed = await showConfirm('標記廠商全部付清',
    '廠商：' + vendor + '\n' +
    '未付款筆數：' + unpaidList.length + ' 筆\n' +
    '未付款總額：$' + total.toLocaleString() + '\n\n' +
    '確定要標記為已付款嗎？'
  );
  if (!confirmed) return;

  const paidDate = await showPrompt('付款日期', '請輸入付款日期', today());
  if (!paidDate || !paidDate.trim()) return;

  let done = 0, failed = 0;
  for (const o of unpaidList) {
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/orders?id=eq.' + o.id,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ status: 'paid', paid_date: paidDate.trim() })
        }
      );
      if (res.ok) {
        o.status = 'paid';
        o.paidDate = paidDate.trim();
        done++;
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
    }
  }

  renderOrders();
  renderVendorContent();
  renderVendorTotalCard();
  renderVendorTabs();
  if (failed > 0) {
    showAlert('批次付款結果', '完成：' + done + ' 筆成功，' + failed + ' 筆失敗');
  } else {
    toast('✓ ' + vendor + ' 共 ' + done + ' 筆已標記付清');
  }
}
