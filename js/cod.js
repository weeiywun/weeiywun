// ── 貨到付款查帳 ──────────────────────────────────────

function calcExpectedDate(sendDate) {
  const d = new Date(sendDate);
  d.setDate(d.getDate() + 1);
  const dow = d.getDay();
  let daysToNextTue = (2 - dow + 7) % 7;
  if (daysToNextTue === 0) daysToNextTue = 7;
  if (dow === 5 || dow === 6 || dow === 0) daysToNextTue += 7;
  d.setDate(d.getDate() + daysToNextTue);
  return d.toISOString().slice(0, 10);
}

async function _codFetch(path, options) {
  const base = SUPABASE_URL + '/rest/v1/';
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': (options && options.prefer) || 'return=minimal'
  };
  const res = await fetch(base + path, Object.assign({}, options, { headers }));
  if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function _mapCod(r) {
  return {
    id: r.id,
    sendDate: r.send_date,
    recipient: r.recipient,
    tracking: r.tracking,
    amount: Number(r.amount),
    note: r.note || '',
    expectedDate: r.expected_date || '',
    collected: !!r.collected,
    collectedDate: r.collected_date || '',
    actualAmount: r.actual_amount != null ? Number(r.actual_amount) : null
  };
}

function initCodDate() {
  const el = document.getElementById('cod-send-date');
  if (el && !el.value) el.value = today();
}

async function addCodRecord() {
  const sendDate  = document.getElementById('cod-send-date').value;
  const recipient = document.getElementById('cod-recipient').value.trim();
  const tracking  = document.getElementById('cod-tracking').value.trim();
  const amount    = parseFloat(document.getElementById('cod-amount').value) || 0;
  const note      = document.getElementById('cod-note').value.trim();

  if (!sendDate || !recipient || !tracking || !amount) {
    showAlert('欄位不完整', '請填寫寄件日期、收件人、物流編號與收款金額');
    return;
  }

  const expectedDate = calcExpectedDate(sendDate);
  const rec = {
    id: Date.now().toString(),
    send_date: sendDate,
    recipient,
    tracking,
    amount,
    note,
    expected_date: expectedDate,
    collected: false,
    collected_date: ''
  };

  const btn = document.querySelector('#sec-cod .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '儲存中…'; }

  try {
    await _codFetch('cod_records', {
      method: 'POST',
      body: JSON.stringify(rec)
    });
    document.getElementById('cod-recipient').value = '';
    document.getElementById('cod-tracking').value = '';
    document.getElementById('cod-amount').value = '';
    document.getElementById('cod-note').value = '';
    document.getElementById('cod-send-date').value = today();
    await renderCodList();
    toast('✓ 代收款記錄已新增，預計入帳日：' + expectedDate);
  } catch (e) {
    showAlert('儲存失敗', e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '新增記錄'; }
  }
}

async function confirmCodCollected(id) {
  const date = await showPrompt('確認到帳', '請輸入入帳日期', today());
  if (date === null) return;
  if (!date.trim()) { showAlert('提示', '請填寫入帳日期'); return; }

  const amtStr = await showPrompt('實際到帳金額', '請輸入實際到帳金額（留空表示與原金額相同）', '');
  if (amtStr === null) return;

  const patch = { collected: true, collected_date: date.trim() };
  if (amtStr.trim()) patch.actual_amount = parseFloat(amtStr) || 0;

  try {
    await _codFetch('cod_records?id=eq.' + id, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
    await renderCodList();
    toast('✓ 已確認到帳');
  } catch (e) {
    showAlert('更新失敗', e.message);
  }
}

async function deleteCodRecord(id) {
  if (!await showDangerConfirm('刪除記錄', '確定刪除這筆記錄？')) return;
  try {
    await _codFetch('cod_records?id=eq.' + id, { method: 'DELETE' });
    await renderCodList();
    toast('已刪除');
  } catch (e) {
    showAlert('刪除失敗', e.message);
  }
}

async function renderCodList() {
  const container = document.getElementById('cod-list');
  if (!container) return;
  container.innerHTML = '<div style="padding:1rem;color:var(--text3);font-size:13px;">載入中…</div>';

  try {
    const data = await _codFetch('cod_records?select=*&order=send_date.desc');

    if (!data || !Array.isArray(data)) {
      throw new Error('回傳資料格式錯誤或 cod_records 資料表不存在');
    }

    const all = data.map(_mapCod);

    if (all.length === 0) {
      container.innerHTML = '<div class="empty">尚無代收款記錄</div>';
      return;
    }

    const showUncollected = document.getElementById('cod-show-uncollected')?.checked;
    const records = showUncollected ? all.filter(r => !r.collected) : all;
    const todayStr = today();
    const overdue = all.filter(r => !r.collected && r.expectedDate && r.expectedDate <= todayStr);
    const totalUncollected = all.filter(r => !r.collected).reduce((s, r) => s + r.amount, 0);
    const uncollectedCount = all.filter(r => !r.collected).length;

    const overdueHTML = overdue.length > 0 ? `
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:.85rem 1rem;margin-bottom:1rem;font-size:13px;">
        <div style="font-weight:600;color:#856404;margin-bottom:.35rem;">⚠️ ${overdue.length} 筆款項已超過預計到帳日</div>
        ${overdue.map(r => `<div style="color:#856404;font-size:12px;margin-top:2px;">・${r.recipient}　$${r.amount.toLocaleString()}　預計 ${r.expectedDate}</div>`).join('')}
      </div>` : '';

    const statsHTML = `
      ${overdueHTML}
      <div style="display:flex;gap:1.5rem;padding:.75rem 1rem;background:var(--surface2);border-radius:8px;margin-bottom:1rem;font-size:13px;">
        <div><span style="color:var(--text3);">待到帳筆數　</span><span style="font-weight:600;color:var(--amber);">${uncollectedCount} 筆</span></div>
        <div><span style="color:var(--text3);">待到帳總額　</span><span style="font-weight:600;color:var(--amber);">$${totalUncollected.toLocaleString()}</span></div>
      </div>`;

    if (records.length === 0) {
      container.innerHTML = statsHTML + '<div class="empty">所有款項均已到帳 ✓</div>';
      return;
    }

    const rows = records.map(r => {
      const isOverdue = !r.collected && r.expectedDate && r.expectedDate <= todayStr;
      const actual = r.actualAmount != null ? r.actualAmount : null;
      const collectedLabel = r.collected
        ? (() => {
            const showAmt = actual != null ? actual : r.amount;
            const diff = actual != null ? actual - r.amount : 0;
            const diffStr = diff !== 0
              ? ` <span style="color:${diff<0?'#e53e3e':'var(--green)'};">(${diff>0?'+':''}$${diff.toLocaleString()})</span>`
              : '';
            return `<div style="font-size:11px;color:var(--green);margin-top:2px;">✓ 已到帳 $${showAmt.toLocaleString()}${diffStr}</div>
                    <div style="font-size:11px;color:var(--text3);">${r.collectedDate}</div>`;
          })()
        : `<div style="font-size:11px;color:${isOverdue?'#e53e3e':'var(--amber)'};margin-top:2px;">${isOverdue?'⚠️ 已逾期':'待到帳'}</div>`;

      return `
        <div style="display:grid;grid-template-columns:1fr 1fr 1.2fr 1fr auto;gap:10px;align-items:center;padding:.85rem 1rem;border-bottom:1px solid var(--border);${r.collected?'opacity:.5;':''}${isOverdue?'background:rgba(255,193,7,.06);':''}">
          <div>
            <div style="font-size:12px;color:var(--text3);">寄件日</div>
            <div style="font-size:13px;font-weight:500;">${r.sendDate}</div>
            ${r.expectedDate ? `<div style="font-size:11px;color:${isOverdue?'#e53e3e':'var(--text3)'};margin-top:2px;">預計入帳 ${r.expectedDate}</div>` : ''}
          </div>
          <div>
            <div style="font-size:12px;color:var(--text3);">收件人</div>
            <div style="font-size:13px;font-weight:500;">${r.recipient}</div>
            ${r.note ? `<div style="font-size:11px;color:var(--text3);margin-top:2px;">${r.note}</div>` : ''}
          </div>
          <div>
            <div style="font-size:12px;color:var(--text3);">物流編號</div>
            <div style="font-size:13px;font-family:monospace;">${r.tracking}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text3);">收款金額</div>
            <div style="font-size:15px;font-weight:600;">$${r.amount.toLocaleString()}</div>
            ${collectedLabel}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            ${!r.collected ? `<button class="btn btn-sm btn-success" onclick="confirmCodCollected('${r.id}')">確認到帳</button>` : ''}
            ${window.isEmployeeMode && window.isEmployeeMode() ? '' : `<button class="btn btn-sm" style="font-size:11px;color:var(--text3);" onclick="deleteCodRecord('${r.id}')">刪除</button>`}
          </div>
        </div>`;
    }).join('');

    container.innerHTML = statsHTML + `
      <div style="border:1px solid var(--border);border-radius:14px;overflow:hidden;">${rows}</div>`;

  } catch (e) {
    console.error('載入代收款紀錄失敗:', e);
    container.innerHTML = `<div style="color:#dc2626;background:#fef2f2;border:1px solid #fecaca;padding:1rem;border-radius:8px;">
      <strong>載入失敗：</strong><br>${e.message}<br>
      <span style="font-size:12px;color:#991b1b;">請確認 Supabase 中是否有 cod_records 資料表，以及 API 快取是否已刷新。</span>
    </div>`;
  }
}

async function checkCodAlert() {
  try {
    const data = await _codFetch('cod_records?select=id,recipient,amount,expected_date,collected&order=send_date.desc');
    const all = (data || []).map(_mapCod);
    const todayStr = today();
    const overdue = all.filter(r => !r.collected && r.expectedDate && r.expectedDate <= todayStr);
    if (overdue.length === 0) return;

    const totalAmt = overdue.reduce((s, r) => s + r.amount, 0);
    const div = document.createElement('div');
    div.id = 'cod-alert-modal';
    div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:8000;display:flex;align-items:center;justify-content:center;';
    div.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:2rem;width:400px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="font-size:18px;font-weight:700;margin-bottom:.5rem;">⚠️ 貨到付款到帳提醒</div>
        <div style="font-size:13px;color:#666;margin-bottom:1.25rem;">以下 ${overdue.length} 筆款項已超過預計入帳日，共 <strong>$${totalAmt.toLocaleString()}</strong></div>
        <div style="background:#fff8e1;border-radius:8px;padding:.85rem 1rem;margin-bottom:1.25rem;font-size:13px;line-height:2;">
          ${overdue.map(r => `<div>・<strong>${r.recipient}</strong>　$${r.amount.toLocaleString()}　<span style="color:#999;">預計 ${r.expectedDate}</span></div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button onclick="document.getElementById('cod-alert-modal').remove()" class="btn">稍後處理</button>
          <button onclick="document.getElementById('cod-alert-modal').remove();switchTab('cod')" class="btn btn-primary">前往查帳</button>
        </div>
      </div>`;
    document.body.appendChild(div);
  } catch (e) {
    // 靜默失敗
  }
}
