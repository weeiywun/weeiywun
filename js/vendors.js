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
    <div class="card flex justify-between items-center py-3.5 px-5">
      <span class="text-[13px] font-semibold text-txt">${currentVendor}</span>
      <span class="text-[13px] text-txt-2">累計 <b>${d.orders.length}</b> 筆</span>
      <span class="text-base font-semibold">$${d.total.toLocaleString()}</span>
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
    <div class="card p-4 px-5 mb-4">
      <div class="text-xs text-txt-2 font-medium tracking-tight mb-3">
        ${rangeText}　共 ${names.length} 家廠商
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div><div class="text-[11px] text-txt-3 mb-0.5">未付款筆數</div><div class="text-[22px] font-semibold text-warn">${unpaidOrderCount} 筆</div></div>
        <div><div class="text-[11px] text-txt-3 mb-0.5">未付款廠商</div><div class="text-[22px] font-semibold text-warn">${unpaidVendorCount} 家</div></div>
        <div><div class="text-[11px] text-txt-3 mb-0.5">未付款總額</div><div class="text-[22px] font-semibold text-warn">$${unpaidTotal.toLocaleString()}</div></div>
      </div>
    </div>`;

  const unpaidOrders = d.orders.filter(o => o.status === 'pending').sort((a,b) => b.date.localeCompare(a.date));
  const paidOrders   = d.orders.filter(o => o.status === 'paid').sort((a,b) => b.date.localeCompare(a.date));

  function makeRows(list) {
    return list.map(o => `
      <tr class="order-row" onclick="showDetail('${o.id}')">
        <td>${o.date}</td>
        <td class="mono">${o.orderId||'—'}</td>
        <td class="text-txt-2 text-xs">${o.items.map(i => {
            const isNeg = Math.round(i.qty * i.price) < 0;
            return isNeg ? `<span class="text-err">↩${i.name}</span>` : i.name;
          }).join('、')}</td>
        <td class="font-semibold">$${o.total.toLocaleString()}</td>
        <td><span class="badge ${o.status==='paid'?'badge-paid':'badge-pending'}">${o.status==='paid'?'已付款':'未付款'}</span></td>
        <td class="text-xs text-txt-3">${o.paidDate||'—'}</td>
      </tr>`).join('');
  }

  const unpaidCard = unpaidOrders.length > 0 ? `
    <div class="vendor-card border-warn mb-4">
      <div class="vendor-header bg-warn/5">
        <div>
          <div class="vendor-name">${currentVendor}</div>
          <div class="vendor-meta text-warn">未付款　${unpaidOrders.length} 筆</div>
        </div>
        <div class="text-right">
          <div class="text-[11px] text-warn mb-1">未付款總額</div>
          <div class="text-[22px] font-semibold text-warn mb-2">$${d.unpaid.toLocaleString()}</div>
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
    <div class="py-3.5 px-5 mb-4 bg-ok/5 border border-ok rounded-card text-[13px] text-ok font-medium">
      ✓ ${currentVendor} 無未付款訂單
    </div>`;

  const paidCard = paidOrders.length > 0 ? `
    <div class="vendor-card opacity-85">
      <div class="vendor-header">
        <div>
          <div class="vendor-name text-txt-2">${currentVendor}</div>
          <div class="vendor-meta">已付款　${paidOrders.length} 筆</div>
        </div>
        <div class="text-right">
          <div class="text-[11px] text-txt-3 mb-0.5">已付款總額</div>
          <div class="text-xl font-semibold text-ok">$${d.paid.toLocaleString()}</div>
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
