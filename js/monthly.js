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
    <div class="metrics" style="margin-bottom:1.25rem;">
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
    const orderRows = vd.orders
      .sort((a,b) => a.date.localeCompare(b.date))
      .map(o => `
        <tr class="order-row" onclick="showDetail('${o.id}')" style="cursor:pointer;">
          <td>${o.date}</td>
          <td class="mono">${o.orderId||'—'}</td>
          <td style="font-size:12px;color:var(--text2);">${o.items.map(i => {
            const isNeg = Math.round(i.qty * i.price) < 0;
            return isNeg ? `<span style="color:#e53e3e;">↩${i.name}</span>` : i.name;
          }).join('、')}</td>
          <td style="font-weight:600;">$${o.total.toLocaleString()}</td>
          <td><span class="badge ${o.status==='paid'?'badge-paid':'badge-pending'}">${o.status==='paid'?'已付款':'未付款'}</span></td>
          <td style="font-size:12px;color:var(--text3);">${o.paidDate||'—'}</td>
          <td class="no-print">${o.status==='pending'
            ? `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();openModal('${o.id}');setTimeout(renderMonthly,600)">標記付款</button>`
            : ''}</td>
        </tr>`).join('');

    const dashedTop = idx > 0
      ? `border-top:2px dashed #bbb;margin-top:1.25rem;padding-top:1.25rem;`
      : '';

    return `
      <div style="${dashedTop}break-inside:avoid;page-break-inside:avoid;">
        <div style="margin-bottom:.5rem;border:1px solid var(--border);border-radius:10px;overflow:hidden;box-shadow:var(--shadow);${isAllPaid?'opacity:.75':''}">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:.9rem 1.25rem;background:${isAllPaid?'var(--surface2)':'var(--surface)'};border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:15px;font-weight:600;">${v}</span>
              <span style="font-size:12px;color:var(--text3);">${vd.orders.length} 筆訂單</span>
              ${isAllPaid ? '<span class="badge badge-paid">全數付清</span>' : `<span class="badge badge-pending">待付 $${vd.unpaid.toLocaleString()}</span>`}
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px;color:var(--text3);">本月採購</div>
              <div style="font-size:18px;font-weight:600;">$${vd.total.toLocaleString()}</div>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table>
              <thead><tr>
                <th>日期</th><th>訂單編號</th><th>商品</th><th>金額</th><th>狀態</th><th>付款日期</th><th class="no-print">操作</th>
              </tr></thead>
              <tbody>${orderRows}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }).join('');

  const totalRow = `
    <div style="display:flex;justify-content:flex-end;align-items:center;gap:1.5rem;padding:.75rem 1.25rem;background:var(--surface2);border:1px solid var(--border);border-radius:10px;margin-top:.5rem;">
      <span style="font-size:13px;color:var(--text2);">本月合計</span>
      <span style="font-size:22px;font-weight:600;">$${total.toLocaleString()}</span>
    </div>`;

  document.getElementById('monthly-table').innerHTML = vendorBlocks + totalRow;
}

function printMonthly() {
  if (!document.getElementById('monthly-table').innerHTML.trim()) { alert('請先選擇月份並按查詢'); return; }
  const ym = document.getElementById('monthly-month').value;
  const [y, m] = ym.split('-');

  const printer = prompt(
    `確認列印【惟元門市 ${y} 年 ${parseInt(m)} 月 進貨報表】\n\n請確認資料無誤後，輸入列印人姓名：`,
    ''
  );
  if (printer === null) return;
  if (!printer.trim()) { alert('請填寫列印人姓名'); return; }

  const now = new Date();
  const printTime = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}  ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  document.getElementById('print-title').innerHTML =
    `<div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <span>惟元門市 ${y} 年 ${parseInt(m)} 月 進貨報表</span>
      <span style="font-size:12px;font-weight:400;color:#555;text-align:right;line-height:1.6;">
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
  ['中藥材','包裝材','其他','物流','大樓修繕'].forEach(cat => { catGroups[cat] = []; });
  unpaidVendors.forEach(v => {
    let cat = '其他';
    for (const [c, vlist] of Object.entries(VENDOR_CATEGORIES)) {
      if (vlist.includes(v)) { cat = c; break; }
    }
    catGroups[cat].push(v);
  });

  const unpaidOrderCount = list.filter(o=>o.status!=='paid').length;
  const vendorUnpaidCount = unpaidVendors.length;

  const tableStyle = `width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;`;
  const colDefs = `<colgroup>
    <col style="width:18%;">
    <col style="width:18%;">
    <col style="width:32%;">
    <col style="width:16%;">
    <col style="width:16%;">
  </colgroup>`;
  const thStyle = `padding:6px 8px;border:1px solid #ddd;font-weight:600;background:#f5f5f5;`;
  const tdStyle = `padding:5px 8px;border:1px solid #ddd;`;

  let summaryHTML = `
    <div style="margin-bottom:1rem;">
      <div style="font-size:12px;font-weight:600;color:#666;margin-bottom:.5rem;letter-spacing:.05em;">未付款快速總覽</div>
      <div style="display:flex;gap:2rem;margin-bottom:1rem;padding:.75rem 1rem;background:#f8f8f8;border:1px solid #ddd;border-radius:6px;">
        <div><div style="font-size:11px;color:#888;">未付款廠商</div><div style="font-size:22px;font-weight:700;">${vendorUnpaidCount} 家</div></div>
        <div><div style="font-size:11px;color:#888;">未付款訂單</div><div style="font-size:22px;font-weight:700;">${unpaidOrderCount} 筆</div></div>
        <div style="margin-left:auto;text-align:right;"><div style="font-size:11px;color:#888;">未付款總額</div><div style="font-size:22px;font-weight:700;">$${unpaid.toLocaleString()}</div></div>
      </div>`;

  if (unpaidVendors.length === 0) {
    summaryHTML += `<div style="padding:1.5rem;text-align:center;color:#4caf50;font-weight:600;font-size:15px;border:1px solid #c8e6c9;border-radius:6px;background:#f1f8e9;">✓ 本月所有廠商均已付清</div>`;
  } else {
    for (const [cat, vendors] of Object.entries(catGroups)) {
      if (cat === '其他' && vendors.length === 0) continue;
      summaryHTML += `
        <div style="margin-bottom:.75rem;">
          <div style="font-size:12px;font-weight:600;color:#555;letter-spacing:.01em;margin-bottom:.35rem;padding-bottom:.2rem;border-bottom:1px solid #ddd;">${cat}</div>
          <table style="${tableStyle}">
            ${colDefs}
            <thead>
              <tr>
                <th style="text-align:left;${thStyle}">廠商</th>
                <th style="text-align:center;${thStyle}">未付款訂單數</th>
                <th style="text-align:right;${thStyle}">未付款總額</th>
                <th style="text-align:center;${thStyle}">現金／匯款</th>
                <th style="text-align:center;${thStyle}">支票</th>
              </tr>
            </thead>
            <tbody>
              ${vendors.length === 0
                ? `<tr><td colspan="5" style="text-align:center;${tdStyle}color:#aaa;">— 本月無未付款 —</td></tr>`
                : vendors.map(v => {
                    const vd = vendorMap[v];
                    const unpaidOrders = vd.orders.filter(o=>o.status!=='paid');
                    return `<tr>
                      <td style="${tdStyle}font-weight:500;">${v}</td>
                      <td style="text-align:center;${tdStyle}">${unpaidOrders.length} 筆</td>
                      <td style="text-align:right;${tdStyle}font-weight:600;">$${vd.unpaid.toLocaleString()}</td>
                      <td style="${tdStyle}"></td>
                      <td style="${tdStyle}"></td>
                    </tr>`;
                  }).join('')
              }
            </tbody>
          </table>
        </div>`;
    }
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
  if (!ym) { alert('請先選擇月份並查詢'); return; }
  if (!supabaseReady) { alert('目前為離線模式，無法批次更新'); return; }

  const unpaidList = orders.filter(o => o.date.startsWith(ym) && o.status === 'pending');
  if (!unpaidList.length) { toast('本月已無未付款訂單'); return; }

  const total = unpaidList.reduce((s, o) => s + o.total, 0);
  const confirmed = confirm(
    '【本月全數標記付款】\n\n' +
    '月份：' + ym + '\n' +
    '未付款筆數：' + unpaidList.length + ' 筆\n' +
    '未付款總額：$' + total.toLocaleString() + '\n\n' +
    '確定要標記為已付款嗎？'
  );
  if (!confirmed) return;

  const paidDate = prompt('請輸入付款日期：', today());
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
    alert('完成：' + done + ' 筆成功，' + failed + ' 筆失敗，請查看 F12 Console 了解詳情');
  } else {
    toast('✓ 已標記 ' + done + ' 筆訂單為已付款');
  }
}
