// ── 摘要卡片 ──────────────────────────────────────────
function renderSummary() {
  const ym = new Date().toISOString().slice(0, 7);
  const mo = orders.filter(o => o.date.startsWith(ym));
  const mTotal = mo.reduce((s, o) => s + o.total, 0);
  const unpaid = orders.filter(o => o.status === 'pending').reduce((s, o) => s + o.total, 0);
  const html = `
    <div class="metric"><div class="metric-label">本月訂單數</div><div class="metric-value">${mo.length}</div></div>
    <div class="metric"><div class="metric-label">本月進貨金額</div><div class="metric-value">$${mTotal.toLocaleString()}</div></div>
    <div class="metric"><div class="metric-label">累計未付款</div><div class="metric-value warn">$${unpaid.toLocaleString()}</div></div>`;
  const sc = document.getElementById('summary-cards');
  const asc = document.getElementById('add-summary-cards');
  if (sc) sc.innerHTML = html;
  if (asc) asc.innerHTML = html;
}

// ── 訂單列表 ──────────────────────────────────────────
function renderOrders() {
  renderSummary();
  const fm = document.getElementById('filter-month').value;
  const fv = document.getElementById('filter-vendor').value.toLowerCase();
  const fo = document.getElementById('filter-orderid').value.toLowerCase();
  const fi = document.getElementById('filter-item').value.toLowerCase();
  const fs = document.getElementById('filter-status').value;
  let list = orders.filter(o => {
    if (fm && !o.date.startsWith(fm)) return false;
    if (fv && !o.vendor.toLowerCase().includes(fv)) return false;
    if (fo && !(o.orderId||'').toLowerCase().includes(fo)) return false;
    if (fi && !o.items.some(i => i.name.toLowerCase().includes(fi))) return false;
    if (fs && o.status !== fs) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));
  const tb = document.getElementById('orders-tbody');
  if (!list.length) { tb.innerHTML = '<tr><td colspan="7" class="empty">沒有符合的訂單</td></tr>'; return; }
  tb.innerHTML = list.map(o => {
    const itemSummary = o.items.length === 1
      ? `${o.items[0].name}　${o.items[0].qty} ${o.items[0].unit||'斤'}`
      : `${o.items[0].name} 等 ${o.items.length} 項`;
    return `<tr class="order-row" onclick="showDetail('${o.id}')" title="點擊查看詳情">
      <td>${o.date}</td>
      <td class="mono">${o.orderId||'—'}</td>
      <td style="font-weight:500;">${o.vendor}</td>
      <td>
        <span>${itemSummary}</span>
        ${o.items.length>1?`<span style="font-size:11px;color:var(--blue);margin-left:6px;">▶ ${o.items.length} 項</span>`:''}
        ${o.note?`<span style="font-size:11px;color:var(--text3);margin-left:6px;">📝</span>`:''}
      </td>
      <td style="font-weight:600;">$${o.total.toLocaleString()}</td>
      <td><span class="badge ${o.status==='paid'?'badge-paid':'badge-pending'}">${o.status==='paid'?'已付款':'未付款'}</span></td>
      <td style="color:var(--text3);font-size:12px;">${o.paidDate||'—'}</td>
    </tr>`;
  }).join('');
}

function clearFilters() {
  ['filter-month','filter-vendor','filter-orderid','filter-item'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('filter-status').value = '';
  renderOrders();
}

// ── 付款 Modal ────────────────────────────────────────
function openModal(id) {
  pendingPaidId = id;
  document.getElementById('modal-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('modal-bg').style.display = 'flex';
}
function closeModal() { document.getElementById('modal-bg').style.display = 'none'; pendingPaidId = null; }
async function confirmPaid() {
  const d = document.getElementById('modal-date').value;
  if (!d) { alert('請選擇付款日期'); return; }
  const o = orders.find(x => x.id === pendingPaidId);
  if (o) { o.status = 'paid'; o.paidDate = d; await persist(o, 'update'); renderOrders(); toast('✓ 已標記為付款'); }
  closeModal();
}
document.getElementById('modal-bg').addEventListener('click', e => { if (e.target === document.getElementById('modal-bg')) closeModal(); });

// ── 訂單詳情 ──────────────────────────────────────────
let currentDetailId = null;

function showDetail(id) {
  currentDetailId = id;
  renderDetail(id, false);
  document.getElementById('detail-modal-bg').style.display = 'flex';
}

function closeDetail() {
  document.getElementById('detail-modal-bg').style.display = 'none';
  currentDetailId = null;
}

function renderDetail(id, editMode) {
  const o = orders.find(x => x.id === id);
  if (!o) return;

  if (editMode) {
    renderEditDetail(o);
    return;
  }

  const isRefund = o.type === 'refund';
  const itemRows = o.items.map(i => {
    const sub = Math.round(i.qty * i.price);
    const isNeg = sub < 0;
    const color = isNeg ? 'color:#e53e3e;' : '';
    return `
    <tr style="${isNeg ? 'background:rgba(229,62,62,.04);' : ''}">
      <td style="font-weight:500;${color}">${i.name}</td>
      <td style="text-align:right;${color}">${i.qty} ${i.unit||'斤'}</td>
      <td style="text-align:right;${color}">$${i.price.toLocaleString()}</td>
      <td style="text-align:right;font-weight:600;${color}">
        $${sub.toLocaleString()}
      </td>
    </tr>`;
  }).join('');

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-header">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <h3>${o.vendor}</h3>
          ${isRefund?'<span class="refund-badge">↩ 退換貨</span>':''}
        </div>
        <div style="font-size:13px;color:var(--text2);">${o.date}　<span class="mono" style="font-size:12px;">${o.orderId||'—'}</span></div>
      </div>
      <div class="kebab-wrap">
        <button class="kebab-btn" onclick="toggleKebab(event)">···</button>
        <div class="kebab-menu" id="kebab-menu">
          <button class="kebab-item" onclick="renderDetail('${id}', true);closeKebab()">✏️　編輯訂單</button>
          <div class="kebab-sep"></div>
          <button class="kebab-item" onclick="createRefund('${id}');closeKebab()">↩　建立退換貨</button>
          <div class="kebab-sep"></div>
          <button class="kebab-item danger" onclick="deleteOrderFromDetail('${id}')">🗑　刪除此訂單</button>
        </div>
      </div>
    </div>
    <div class="detail-meta">
      <div class="detail-meta-item"><div class="detail-meta-label">付款狀態</div><div class="detail-meta-value"><span class="badge ${o.status==='paid'?'badge-paid':'badge-pending'}">${o.status==='paid'?'已付款':'未付款'}</span></div></div>
      ${o.paidDate?`<div class="detail-meta-item"><div class="detail-meta-label">付款日期</div><div class="detail-meta-value">${o.paidDate}</div></div>`:''}
      ${o.payMethod?`<div class="detail-meta-item"><div class="detail-meta-label">付款方式</div><div class="detail-meta-value">${o.payMethod}</div></div>`:''}
      ${o.payNote?`<div class="detail-meta-item"><div class="detail-meta-label">付款備註</div><div class="detail-meta-value">${o.payNote}</div></div>`:''}
      ${o.note?`<div class="detail-meta-item" style="grid-column:1/-1;"><div class="detail-meta-label">訂單備註</div><div class="detail-meta-value">${o.note}</div></div>`:''}
    </div>
    <table class="detail-items-table">
      <thead><tr><th>商品名稱</th><th style="text-align:right;">數量</th><th style="text-align:right;">單價</th><th style="text-align:right;">小計</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="detail-total">
      <span style="font-size:13px;color:var(--text2);">${isRefund?'退款金額':'訂單總金額'}</span>
      <span style="font-size:22px;font-weight:600;letter-spacing:-.02em;${isRefund?'color:var(--red);':''}">
        ${isRefund?'－':''}$${o.total.toLocaleString()}
      </span>
    </div>`;

  document.getElementById('detail-actions').innerHTML = `
    <button class="btn" onclick="closeDetail()">關閉</button>
    ${o.status==='pending'?`<button class="btn btn-success" onclick="closeDetail();openModal('${id}')">標記付款</button>`:''}`;
}

function renderEditDetail(o) {
  const itemsHtml = o.items.map((item, idx) => `
    <div class="edit-item-row" id="edit-item-${idx}">
      <input type="text" value="${item.name}" id="ename-${idx}" oninput="recalcEdit()">
      <input type="number" value="${item.price}" id="eprice-${idx}" min="0" oninput="recalcEdit()">
      <input type="number" value="${item.qty}" id="eqty-${idx}" min="0" step="0.01" oninput="recalcEdit()">
      <select id="eunit-${idx}">${['斤','公斤','兩','個','包','罐','盒'].map(u=>`<option ${(item.unit||'斤')===u?'selected':''}>${u}</option>`).join('')}</select>
      <input type="text" id="esub-${idx}" readonly value="$${Math.round(item.qty*item.price).toLocaleString()}" style="background:var(--surface2);color:var(--text2);">
      <button class="remove-btn" onclick="removeEditItem(${idx})">✕</button>
    </div>`).join('');

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-header" style="margin-bottom:1rem;">
      <h3 style="font-size:15px;">編輯訂單</h3>
      <button class="btn btn-sm btn-ghost" onclick="renderDetail('${o.id}',false)">✕ 取消</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:1rem;">
      <div class="form-group"><label>日期</label><input type="date" id="e-date" value="${o.date}"></div>
      <div class="form-group"><label>訂單編號</label><input type="text" id="e-orderid" value="${o.orderId||''}"></div>
      <div class="form-group"><label>廠商</label><input type="text" id="e-vendor" value="${o.vendor}" list="vendor-list"></div>
    </div>
    <div style="font-size:12px;font-weight:600;color:var(--text2);letter-spacing:.01em;margin-bottom:6px;">商品明細</div>
    <div style="display:grid;grid-template-columns:2fr 1fr 0.8fr 0.7fr 1fr 28px;gap:6px;margin-bottom:5px;">
      ${['商品名稱','單價','數量','單位','小計',''].map(h=>`<span style="font-size:11px;color:var(--text3);">${h}</span>`).join('')}
    </div>
    <div id="edit-items-container">${itemsHtml}</div>
    <button class="btn btn-sm" onclick="addEditItemRow()" style="margin:6px 0 1rem;">+ 新增品項</button>
    <div style="height:1px;background:var(--border);margin-bottom:1rem;"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1rem;">
      <div class="form-group"><label>付款狀態</label>
        <select id="e-status">
          <option value="pending" ${o.status==='pending'?'selected':''}>未付款</option>
          <option value="paid" ${o.status==='paid'?'selected':''}>已付款</option>
        </select>
      </div>
      <div class="form-group"><label>付款日期</label><input type="date" id="e-paiddate" value="${o.paidDate||''}"></div>
      <div class="form-group"><label>付款方式</label>
        <select id="e-paymethod">
          <option value="">—</option>
          ${['現金','支票','匯款','月結','信用卡','貨到付款'].map(m=>`<option ${o.payMethod===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>付款備註</label><input type="text" id="e-paynote" value="${o.payNote||''}"></div>
    </div>
    <div class="form-group" style="margin-bottom:1rem;"><label>訂單備註</label>
      <textarea id="e-note" style="height:70px;resize:vertical;">${o.note||''}</textarea>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:13px;color:var(--text2);">訂單總金額：<strong id="edit-total">$${o.total.toLocaleString()}</strong></div>
    </div>`;

  document.getElementById('detail-actions').innerHTML = `
    <button class="btn" onclick="renderDetail('${o.id}',false)">取消</button>
    <button class="btn btn-primary" onclick="saveEdit('${o.id}')">儲存變更</button>`;

  window._editItems = JSON.parse(JSON.stringify(o.items));
}

let editItemCount = 0;
function addEditItemRow() {
  editItemCount++;
  const idx = 'new' + editItemCount;
  const div = document.createElement('div');
  div.className = 'edit-item-row'; div.id = 'edit-item-' + idx;
  div.innerHTML = `
    <input type="text" placeholder="商品名稱" id="ename-${idx}" oninput="recalcEdit()">
    <input type="number" placeholder="0" id="eprice-${idx}" min="0" oninput="recalcEdit()">
    <input type="number" placeholder="1" id="eqty-${idx}" min="0" step="0.01" value="1" oninput="recalcEdit()">
    <select id="eunit-${idx}">${['斤','公斤','兩','個','包','罐','盒'].map(u=>`<option>${u}</option>`).join('')}</select>
    <input type="text" id="esub-${idx}" readonly placeholder="—" style="background:var(--surface2);color:var(--text2);">
    <button class="remove-btn" onclick="removeEditItem('${idx}')">✕</button>`;
  document.getElementById('edit-items-container').appendChild(div);
}

function removeEditItem(idx) {
  const el = document.getElementById('edit-item-' + idx);
  if (el) el.remove();
  recalcEdit();
}

function recalcEdit() {
  let total = 0;
  document.querySelectorAll('#edit-items-container .edit-item-row').forEach(row => {
    const idx = row.id.replace('edit-item-','');
    const p = parseFloat(document.getElementById('eprice-'+idx)?.value)||0;
    const q = parseFloat(document.getElementById('eqty-'+idx)?.value)||0;
    const sub = p * q;
    const subEl = document.getElementById('esub-'+idx);
    if (subEl) subEl.value = sub > 0 ? '$'+Math.round(sub).toLocaleString() : '';
    total += sub;
  });
  const el = document.getElementById('edit-total');
  if (el) el.textContent = '$' + Math.round(total).toLocaleString();
}

async function saveEdit(id) {
  const o = orders.find(x => x.id === id);
  if (!o) return;
  const items = [];
  document.querySelectorAll('#edit-items-container .edit-item-row').forEach(row => {
    const idx = row.id.replace('edit-item-','');
    const name = document.getElementById('ename-'+idx)?.value.trim();
    const price = parseFloat(document.getElementById('eprice-'+idx)?.value)||0;
    const qty = parseFloat(document.getElementById('eqty-'+idx)?.value)||0;
    const unit = document.getElementById('eunit-'+idx)?.value||'斤';
    if (name) items.push({name, price, qty, unit});
  });
  if (!items.length) { alert('請至少保留一個品項'); return; }
  o.date = document.getElementById('e-date').value;
  o.orderId = document.getElementById('e-orderid').value.trim();
  o.vendor = document.getElementById('e-vendor').value.trim();
  o.items = items;
  o.total = Math.round(items.reduce((s,i) => s+i.price*i.qty, 0));
  o.status = document.getElementById('e-status').value;
  o.paidDate = document.getElementById('e-paiddate').value;
  o.payMethod = document.getElementById('e-paymethod').value;
  o.payNote = document.getElementById('e-paynote').value;
  o.note = document.getElementById('e-note').value;
  await persist(o, 'update');
  renderOrders();
  toast('✓ 訂單已更新');
  renderDetail(id, false);
}

async function createRefund(id) {
  const o = orders.find(x => x.id === id);
  if (!o) return;
  if (!confirm(`要為「${o.vendor}／${o.orderId||o.date}」建立退換貨記錄嗎？\n\n系統會複製此訂單並標記為退換貨，您可以在編輯模式修改退貨品項與數量。`)) return;
  const refund = {
    ...JSON.parse(JSON.stringify(o)),
    id: Date.now().toString(),
    type: 'refund',
    refundOf: id,
    status: 'paid',
    paidDate: new Date().toISOString().slice(0,10),
    note: `退換貨（原訂單：${o.orderId||o.date}）${o.note?'　'+o.note:''}`,
  };
  orders.push(refund);
  await persist(refund, 'insert');
  closeDetail();
  renderOrders();
  toast('↩ 退換貨記錄已建立，請點擊查看並修改品項');
  setTimeout(() => showDetail(refund.id), 300);
}

async function deleteOrderFromDetail(id) {
  if (!confirm('確定刪除此訂單？此動作無法復原。')) return;
  orders = orders.filter(x => x.id !== id);
  await persist(id, 'delete');
  closeDetail();
  renderOrders();
  toast('訂單已刪除');
}

function toggleKebab(e) {
  e.stopPropagation();
  document.getElementById('kebab-menu').classList.toggle('open');
}
function closeKebab() {
  const m = document.getElementById('kebab-menu');
  if (m) m.classList.remove('open');
}
document.addEventListener('click', () => closeKebab());

async function deleteOrder(id) {
  if (!confirm('確定刪除此訂單？此動作無法復原。')) return;
  orders = orders.filter(x => x.id !== id);
  await persist(id, 'delete'); renderOrders(); toast('訂單已刪除');
}
