// ── 月底結算 ──────────────────────────────────────────
function renderMonthly() {
  const ym = document.getElementById('monthly-month').value;
  if (!ym) { document.getElementById('monthly-summary').innerHTML = '<div class="empty">請選擇月份</div>'; return; }
  const list = orders.filter(o => o.date.startsWith(ym));
  if (!list.length) {
    document.getElementById('monthly-summary').innerHTML = `<div class="empty">${ym} 尚無訂單</div>`;
    document.getElementById('monthly-table').innerHTML = '';
    return;
  }
  const total  = list.reduce((s,o) => s+o.total, 0);
  const paid   = list.filter(o=>o.status==='paid').reduce((s,o) => s+o.total, 0);
  const unpaid = total - paid;

  const vendorSet = new Set(list.map(o=>o.vendor));

  document.getElementById('monthly-summary').innerHTML = `
    <div class="metrics mb-5">
      <div class="metric"><div class="metric-label">廠商家數</div><div class="metric-value">${vendorSet.size}</div></div>
      <div class="metric"><div class="metric-label">月份總金額</div><div class="metric-value">$${total.toLocaleString()}</div></div>
      <div class="metric"><div class="metric-label">已付款</div><div class="metric-value ok">$${paid.toLocaleString()}</div></div>
      <div class="metric"><div class="metric-label">待付款</div><div class="metric-value warn">$${unpaid.toLocaleString()}</div></div>
    </div>`;

  const vendorMap = {};
  list.forEach(o => {
    if (!vendorMap[o.vendor]) vendorMap[o.vendor] = { orders:[], total:0, paid:0, unpaid:0 };
    vendorMap[o.vendor].orders.push(o);
    vendorMap[o.vendor].total += o.total;
    if (o.status==='paid') vendorMap[o.vendor].paid += o.total;
    else vendorMap[o.vendor].unpaid += o.total;
  });

  let vendorNames = Object.keys(vendorMap);
  const unpaidVendors = sortVendors(vendorNames.filter(v => vendorMap[v].unpaid > 0));
  const paidVendors   = sortVendors(vendorNames.filter(v => vendorMap[v].unpaid === 0));
  vendorNames = [...unpaidVendors, ...paidVendors];

  const vendorBlocks = vendorNames.map((v, idx) => {
    const vd = vendorMap[v];
    const isAllPaid = vd.unpaid === 0;
    const safeVendorJs = v.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const safeVendorAttr = escapeMonthlyAttr(v);
    const orderRows = vd.orders
      .sort((a,b) => a.date.localeCompare(b.date))
      .map(o => `
        <tr class="order-row cursor-pointer" onclick="showDetail('${o.id}')">
          <td class="no-print" onclick="event.stopPropagation();">${o.status==='pending'
            ? `<input type="checkbox" class="monthly-pay-check" data-vendor="${safeVendorAttr}" value="${o.id}" onchange="updateMonthlySelection('${safeVendorJs}')">`
            : ''}</td>
          <td>${o.date}</td>
          <td class="mono">${o.orderId||'—'}</td>
          <td class="text-xs text-txt-2">${o.items.map(i => {
            const isNeg = Math.round(i.qty * i.price) < 0;
            return isNeg ? `<span class="text-err">↩${i.name}</span>` : i.name;
          }).join('、')}</td>
          <td class="font-semibold">$${o.total.toLocaleString()}</td>
          <td><span class="badge ${o.status==='paid'?'badge-paid':'badge-pending'}">${o.status==='paid'?'已付款':'未付款'}</span></td>
          <td class="text-xs text-txt-3">${o.paidDate||'—'}</td>
          <td class="no-print">${o.status==='pending'
            ? `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();openModal('${o.id}');setTimeout(renderMonthly,600)">標記付款</button>`
            : ''}</td>
        </tr>`).join('');

    return `
      <div class="break-inside-avoid ${idx > 0 ? 'border-t-2 border-dashed border-border-2 mt-5 pt-5' : ''}">
        <div class="mb-2 border border-border rounded-card overflow-hidden shadow-card ${isAllPaid?'opacity-75':''}">
          <div class="flex justify-between items-center py-3.5 px-5 ${isAllPaid?'bg-surface-2':'bg-surface'} border-b border-border">
            <div class="flex items-center gap-2.5">
              <span class="text-[15px] font-semibold">${v}</span>
              <span class="text-xs text-txt-3">${vd.orders.length} 筆訂單</span>
              ${isAllPaid ? '<span class="badge badge-paid">全數付清</span>' : `<span class="badge badge-pending">待付 $${vd.unpaid.toLocaleString()}</span>`}
            </div>
            <div class="flex items-center gap-3">
              ${!isAllPaid ? `<button class="btn btn-sm btn-success no-print" id="monthly-pay-btn-${makeMonthlyVendorKey(v)}" onclick="markSelectedVendorOrdersPaid('${safeVendorJs}')" disabled>標記勾選付款</button>` : ''}
              <div class="text-right">
                <div class="text-[11px] text-txt-3">本月採購</div>
                <div class="text-lg font-semibold">$${vd.total.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table>
              <thead><tr>
                <th class="no-print">
                  ${!isAllPaid ? `<input type="checkbox" title="全選此廠商未付款訂單" onchange="toggleMonthlyVendorSelection('${safeVendorJs}', this.checked)">` : ''}
                </th>
                <th>日期</th><th>訂單編號</th><th>商品</th><th>金額</th><th>狀態</th><th>付款日期</th><th class="no-print">操作</th>
              </tr></thead>
              <tbody>${orderRows}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }).join('');

  const totalRow = `
    <div class="flex justify-end items-center gap-6 py-3 px-5 bg-surface-2 border border-border rounded-card mt-2">
      <span class="text-[13px] text-txt-2">本月合計</span>
      <span class="text-[22px] font-semibold">$${total.toLocaleString()}</span>
    </div>`;

  document.getElementById('monthly-table').innerHTML = vendorBlocks + totalRow;
}

function escapeMonthlyAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function makeMonthlyVendorKey(vendor) {
  return window.btoa(unescape(encodeURIComponent(vendor))).replace(/=+$/,'').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getMonthlyVendorChecks(vendor) {
  return [...document.querySelectorAll('.monthly-pay-check')]
    .filter(el => el.dataset.vendor === vendor);
}

function updateMonthlySelection(vendor) {
  const checks = getMonthlyVendorChecks(vendor);
  const selected = checks.filter(el => el.checked);
  const btn = document.getElementById('monthly-pay-btn-' + makeMonthlyVendorKey(vendor));
  if (!btn) return;
  btn.disabled = selected.length === 0;
  btn.textContent = selected.length ? `標記勾選付款（${selected.length}）` : '標記勾選付款';
}

function toggleMonthlyVendorSelection(vendor, checked) {
  getMonthlyVendorChecks(vendor).forEach(el => { el.checked = checked; });
  updateMonthlySelection(vendor);
}

async function markSelectedVendorOrdersPaid(vendor) {
  if (!supabaseReady) { showAlert('離線模式', '目前為離線模式，無法批次更新'); return; }
  const ids = getMonthlyVendorChecks(vendor).filter(el => el.checked).map(el => el.value);
  const selectedOrders = orders.filter(o => ids.includes(o.id) && o.status === 'pending');
  if (!selectedOrders.length) { toast('尚未勾選未付款訂單'); return; }

  const total = selectedOrders.reduce((s, o) => s + o.total, 0);
  const confirmed = await showConfirm(
    '標記勾選訂單付款',
    '廠商：' + vendor + '\n' +
    '勾選筆數：' + selectedOrders.length + ' 筆\n' +
    '勾選總額：$' + total.toLocaleString() + '\n\n' +
    '確定只將這些訂單標記為已付款嗎？'
  );
  if (!confirmed) return;

  const paidDate = await showPrompt('付款日期', '請輸入付款日期', today());
  if (!paidDate || !paidDate.trim()) return;

  const btn = document.getElementById('monthly-pay-btn-' + makeMonthlyVendorKey(vendor));
  if (btn) { btn.disabled = true; btn.textContent = '處理中…'; }

  let done = 0, failed = 0;
  for (const o of selectedOrders) {
    try {
      await updateOrderStatus(o.id, 'paid', paidDate.trim());
      o.status = 'paid';
      o.paidDate = paidDate.trim();
      done++;
    } catch (e) {
      console.error('PATCH error', o.id, e);
      failed++;
    }
  }

  renderOrders();
  renderMonthly();
  if (failed > 0) {
    showAlert('勾選付款結果', '完成：' + done + ' 筆成功，' + failed + ' 筆失敗\n請查看 F12 Console 了解詳情');
  } else {
    toast('✓ 已標記 ' + done + ' 筆訂單為已付款');
  }
}

async function printMonthly() {
  if (!document.getElementById('monthly-table').innerHTML.trim()) { showAlert('提示', '請先選擇月份並按查詢'); return; }
  const ym = document.getElementById('monthly-month').value;
  const [y, m] = ym.split('-');

  const printer = await showPrompt(
    '列印進貨報表',
    `確認列印【惟元門市 ${y} 年 ${parseInt(m)} 月 進貨報表】\n\n請確認資料無誤後，輸入列印人姓名：`,
    '', '請輸入姓名'
  );
  if (printer === null) return;
  if (!printer.trim()) { showAlert('提示', '請填寫列印人姓名'); return; }

  const now = new Date();
  const printTime = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}  ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  document.getElementById('print-title').innerHTML =
    `<div class="flex justify-between items-start">
      <span>惟元門市 ${y} 年 ${parseInt(m)} 月 進貨報表</span>
      <span class="text-xs font-normal text-txt-2 text-right leading-relaxed">
        列印人：${printer.trim()}<br>列印時間：${printTime}
      </span>
    </div>`;

  const list = orders.filter(o => o.date.startsWith(ym));
  const total  = list.reduce((s,o) => s+o.total, 0);
  const paid   = list.filter(o=>o.status==='paid').reduce((s,o) => s+o.total, 0);
  const unpaid = total - paid;

  const vendorMap = {};
  list.forEach(o => {
    if (!vendorMap[o.vendor]) vendorMap[o.vendor] = { orders:[], unpaid:0 };
    vendorMap[o.vendor].orders.push(o);
    if (o.status !== 'paid') vendorMap[o.vendor].unpaid += o.total;
  });

  const unpaidVendors = sortVendors(
    Object.keys(vendorMap).filter(v => vendorMap[v].unpaid > 0)
  );

  const catGroups = {};
  getVendorCategoryOptions().forEach(cat => { catGroups[cat] = []; });
  unpaidVendors.forEach(v => {
    catGroups[getVendorCategory(v)].push(v);
  });

  const unpaidOrderCount = list.filter(o=>o.status!=='paid').length;
  const vendorUnpaidCount = unpaidVendors.length;

  const summaryRows = [];
  for (const [cat, vendors] of Object.entries(catGroups)) {
    if (cat === '其他' && vendors.length === 0) continue;
    summaryRows.push({ type: 'category', category: cat });
    if (vendors.length === 0) {
      summaryRows.push({ type: 'empty' });
    } else {
      vendors.forEach(v => {
        const vd = vendorMap[v];
        const unpaidOrders = vd.orders.filter(o=>o.status!=='paid');
        summaryRows.push({
          type: 'vendor',
          vendor: v,
          count: unpaidOrders.length,
          unpaid: vd.unpaid
        });
      });
    }
  }
  const rowHeight = Math.max(14, Math.min(28, Math.floor(560 / Math.max(summaryRows.length, 1))));
  const tableFontSize = summaryRows.length > 34 ? 10.5 : 12;
  const tableStyle = `width:100%;border-collapse:collapse;font-size:${tableFontSize}px;table-layout:fixed;`;
  const colDefs = `<colgroup>
    <col style="width:16%;">
    <col style="width:14%;">
    <col style="width:18%;">
    <col style="width:20%;">
    <col style="width:16%;">
    <col style="width:16%;">
  </colgroup>`;
  const thStyle = `padding:5px 7px;border:1px solid #ddd;font-weight:600;background:#f5f5f5;`;
  const tdStyle = `padding:3px 7px;border:1px solid #ddd;height:${rowHeight}px;line-height:1.25;`;

  let summaryHTML = `
    <div class="print-unpaid-summary">
      <div class="text-xs font-semibold text-txt-2 mb-2 tracking-wide">未付款快速總覽</div>
      <div class="flex gap-8 mb-4 py-3 px-4 bg-surface-2 border border-border rounded-md">
        <div><div class="text-[11px] text-txt-3">未付款廠商</div><div class="text-[22px] font-bold">${vendorUnpaidCount} 家</div></div>
        <div><div class="text-[11px] text-txt-3">未付款訂單</div><div class="text-[22px] font-bold">${unpaidOrderCount} 筆</div></div>
        <div class="ml-auto text-right"><div class="text-[11px] text-txt-3">未付款總額</div><div class="text-[22px] font-bold">$${unpaid.toLocaleString()}</div></div>
      </div>`;

  if (unpaidVendors.length === 0) {
    summaryHTML += `<div class="p-6 text-center text-ok font-semibold text-[15px] border border-ok/30 rounded-md bg-ok-bg">✓ 本月所有廠商均已付清</div>`;
  } else {
    summaryHTML += `
      <table style="${tableStyle}" class="print-unpaid-table">
        ${colDefs}
        <thead>
          <tr>
            <th style="text-align:left;${thStyle}">廠商</th>
            <th style="text-align:center;${thStyle}">未付款訂單數</th>
            <th style="text-align:right;${thStyle}">未付款總額</th>
            <th style="text-align:center;${thStyle}">發票</th>
            <th style="text-align:center;${thStyle}">現金／匯款</th>
            <th style="text-align:center;${thStyle}">支票</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRows.map(row => {
            if (row.type === 'category') {
              return `<tr><td colspan="6" style="${tdStyle};height:18px;background:#f7f7f7;font-weight:600;">${row.category}</td></tr>`;
            }
            if (row.type === 'empty') {
              return `<tr><td colspan="6" style="text-align:center;${tdStyle}" class="text-txt-3">— 本月無未付款 —</td></tr>`;
            }
            return `<tr>
              <td style="${tdStyle}" class="font-medium">${row.vendor}</td>
              <td style="text-align:center;${tdStyle}">${row.count} 筆</td>
              <td style="text-align:right;${tdStyle}" class="font-semibold">$${row.unpaid.toLocaleString()}</td>
              <td style="text-align:center;${tdStyle}">☐ 附發票　☐ 無發票</td>
              <td style="${tdStyle}"></td>
              <td style="${tdStyle}"></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  summaryHTML += `</div>`;
  document.getElementById('print-summary-page').innerHTML = summaryHTML;
  window.print();
  setTimeout(() => {
    document.getElementById('print-summary-page').innerHTML = '';
    document.getElementById('print-title').innerHTML = '';
  }, 2000);
}

// ── 批次標記付款 ──────────────────────────────────────

async function batchMarkPaid() {
  const ym = document.getElementById('monthly-month').value;
  if (!ym) { showAlert('提示', '請先選擇月份並查詢'); return; }
  if (!supabaseReady) { showAlert('離線模式', '目前為離線模式，無法批次更新'); return; }

  const unpaidList = orders.filter(o => o.date.startsWith(ym) && o.status === 'pending');
  if (!unpaidList.length) { toast('本月已無未付款訂單'); return; }

  const total = unpaidList.reduce((s, o) => s + o.total, 0);
  const confirmed = await showConfirm('本月全數標記付款',
    '月份：' + ym + '\n' +
    '未付款筆數：' + unpaidList.length + ' 筆\n' +
    '未付款總額：$' + total.toLocaleString() + '\n\n' +
    '確定要標記為已付款嗎？'
  );
  if (!confirmed) return;

  const paidDate = await showPrompt('付款日期', '請輸入付款日期', today());
  if (!paidDate || !paidDate.trim()) return;

  const btn = document.querySelector('.btn-success.no-print');
  if (btn) { btn.disabled = true; btn.textContent = '處理中…'; }

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
        const errText = await res.text();
        console.error('PATCH failed', o.id, res.status, errText);
        failed++;
      }
    } catch (e) {
      console.error('PATCH error', o.id, e);
      failed++;
    }
  }

  if (btn) { btn.disabled = false; btn.textContent = '✓ 本月全數標記付款'; }
  renderOrders();
  renderMonthly();
  if (failed > 0) {
    showAlert('批次付款結果', '完成：' + done + ' 筆成功，' + failed + ' 筆失敗\n請查看 F12 Console 了解詳情');
  } else {
    toast('✓ 已標記 ' + done + ' 筆訂單為已付款');
  }
}
