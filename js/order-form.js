// ── 新增訂單表單 ─────────────────────────────────────
function updateVendorList() {
  const vendors = [...new Set(orders.map(o => o.vendor))].sort();
  const dl = document.getElementById('vendor-list');
  if (dl) dl.innerHTML = vendors.map(v => `<option value="${v}">`).join('');
}

function buildVendorSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const known = VENDOR_CATEGORIES;
  const allCatVendors = new Set(Object.values(known).flat());
  const extraVendors = [...new Set(orders.map(o=>o.vendor))].filter(v=>!allCatVendors.has(v)).sort();

  let html = '<option value="">選擇廠商…</option>';
  for (const [cat, vendors] of Object.entries(known)) {
    html += `<optgroup label="── ${cat} ──">`;
    vendors.forEach(v => { html += `<option value="${v}">${v}</option>`; });
    html += '</optgroup>';
  }
  if (extraVendors.length) {
    html += '<optgroup label="── 其他 ──">';
    extraVendors.forEach(v => { html += `<option value="${v}">${v}</option>`; });
    html += '</optgroup>';
  }
  html += '<option value="__new__">＋ 新廠商（請手動填寫）</option>';
  sel.innerHTML = html;
}

// ── 多張訂單表單管理 ─────────────────────────────────────
let formCounter = 0;

function createOrderFormHTML(fid) {
  const today = new Date().toISOString().slice(0,10);
  return `
  <div class="card order-form-card" id="oform-${fid}" style="position:relative;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <div style="font-size:13px;font-weight:500;color:var(--text2);">訂單 #${fid}</div>
      <button onclick="removeOrderForm(${fid})" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px;padding:2px 6px;" title="移除此訂單">✕</button>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>日期 *</label>
        <input type="date" id="f-date-${fid}" value="${today}">
      </div>
      <div class="form-group">
        <label>訂單編號</label>
        <input type="text" id="f-orderid-${fid}" placeholder="例：No.054825">
      </div>
      <div class="form-group">
        <label>廠商名稱 *</label>
        <div style="display:flex;gap:6px;">
          <select id="f-vendor-sel-${fid}" onchange="onVendorSelChange(${fid})" style="flex:1;">
            <option value="">選擇廠商…</option>
          </select>
          <input type="text" id="f-vendor-txt-${fid}" placeholder="或輸入新廠商" style="flex:1;display:none;">
        </div>
      </div>
    </div>
    <div class="form-group" style="margin-top:10px;">
      <label>備註</label>
      <input type="text" id="f-note-${fid}" placeholder="選填">
    </div>

    <!-- 商品明細 -->
    <div style="margin-top:1rem;">
      <div class="items-header" style="display:grid;grid-template-columns:2.2fr 0.8fr 0.7fr 1fr 1fr 32px;gap:7px;padding:0 0 6px;border-bottom:1px solid var(--border);margin-bottom:8px;">
        <span style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.01em;">商品名稱</span>
        <span style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.01em;">數量</span>
        <span style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.01em;">單位</span>
        <span style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.01em;">單價（元）</span>
        <span style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.01em;">小計</span>
        <span></span>
      </div>
      <div id="items-container-${fid}"></div>
      <button class="btn btn-sm" onclick="addItemRowTo(${fid})" style="margin-top:8px;">+ 新增品項</button>
      <div style="text-align:right;margin-top:.75rem;">
        <div style="font-size:12px;color:var(--text2);">訂單總金額</div>
        <div class="order-total-amount" id="order-total-${fid}">$0</div>
      </div>
    </div>

    <!-- 付款 -->
    <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
      <div style="display:flex;flex-direction:column;gap:10px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="f-paid-${fid}" onchange="togglePaidFieldsFor(${fid})" style="width:16px;height:16px;cursor:pointer;">
          <span style="font-size:13px;font-weight:500;">此訂單已付款</span>
        </label>
        <div id="paid-fields-${fid}" style="display:none;flex-direction:column;gap:10px;">
          <div class="form-group">
            <label>付款日期</label>
            <input type="date" id="f-paid-date-${fid}" value="${today}">
          </div>
          <div class="form-group">
            <label>付款方式</label>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;">
              ${['現金','支票','匯款','月結','信用卡','貨到付款'].map(m=>`
              <label class="pay-chip" data-fid="${fid}"><input type="radio" name="paymethod-${fid}" value="${m}" style="display:none;">${m}</label>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>付款備註</label>
            <input type="text" id="f-pay-note-${fid}" placeholder="選填">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>訂單備註</label>
        <textarea id="f-order-note-${fid}" placeholder="退貨紀錄、折扣說明…" style="height:90px;resize:vertical;"></textarea>
      </div>
    </div>
  </div>`;
}

function addOrderForm() {
  formCounter++;
  const fid = formCounter;
  const prevVendor = formCounter > 1 ? getVendorForForm(formCounter - 1) : '';
  const container = document.getElementById('order-forms-container');
  container.insertAdjacentHTML('beforeend', createOrderFormHTML(fid));
  buildVendorSelect('f-vendor-sel-' + fid);
  if (prevVendor) {
    const sel = document.getElementById('f-vendor-sel-' + fid);
    if ([...sel.options].some(o => o.value === prevVendor)) {
      sel.value = prevVendor;
    }
  }
  for (let i = 0; i < 8; i++) addItemRowTo(fid, false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function removeOrderForm(fid) {
  const el = document.getElementById('oform-' + fid);
  if (el) el.remove();
}

function resetAllForms() {
  document.getElementById('order-forms-container').innerHTML = '';
  formCounter = 0;
  addOrderForm();
}

function onVendorSelChange(fid) {
  const sel = document.getElementById('f-vendor-sel-' + fid);
  const txt = document.getElementById('f-vendor-txt-' + fid);
  if (sel.value === '__new__') {
    txt.style.display = 'block';
    txt.focus();
  } else {
    txt.style.display = 'none';
  }
}

function getVendorForForm(fid) {
  const sel = document.getElementById('f-vendor-sel-' + fid);
  if (sel.value === '__new__') {
    return document.getElementById('f-vendor-txt-' + fid).value.trim();
  }
  return sel.value;
}

function togglePaidFieldsFor(fid) {
  const checked = document.getElementById('f-paid-' + fid).checked;
  document.getElementById('paid-fields-' + fid).style.display = checked ? 'flex' : 'none';
}

let itemCounters = {};
function addItemRowTo(fid, autoFocus = true) {
  if (!itemCounters[fid]) itemCounters[fid] = 0;
  itemCounters[fid]++;
  const id = fid + '_' + itemCounters[fid];
  const div = document.createElement('div');
  div.className = 'item-row'; div.id = 'item-' + id;
  div.innerHTML = `
    <div>
      <input type="text" lang="zh-TW" placeholder="商品名稱" id="iname-${id}" oninput="calcTotalFor(${fid});showPriceHintFor('${id}')" onblur="showPriceHintFor('${id}')">
      <div class="price-hint" id="phint-${id}"></div>
    </div>
    <input type="number" placeholder="1" id="iqty-${id}" min="0" step="0.01" value="1" oninput="calcTotalFor(${fid})">
    <select id="iunit-${id}">
      <option value="斤">斤</option><option value="公斤">公斤</option>
      <option value="兩">兩</option><option value="個">個</option>
      <option value="包">包</option><option value="罐">罐</option>
      <option value="盒">盒</option><option value="式">式</option><option value="項">項</option>
    </select>
    <input type="number" placeholder="0" id="iprice-${id}" min="0" oninput="calcTotalFor(${fid})">
    <input type="text" id="isub-${id}" readonly placeholder="—">
    <button class="remove-btn" onclick="document.getElementById('item-${id}').remove();calcTotalFor(${fid})">✕</button>`;
  document.getElementById('items-container-' + fid).appendChild(div);
  if (autoFocus) setTimeout(() => document.getElementById('iname-' + id)?.focus(), 50);
}

function showPriceHintFor(id) {
  const nameEl = document.getElementById('iname-'+id);
  const hintEl = document.getElementById('phint-'+id);
  const priceEl = document.getElementById('iprice-'+id);
  if (!nameEl || !hintEl) return;
  const q = nameEl.value.trim().toLowerCase();
  if (!q || q.length < 2) { hintEl.textContent = ''; return; }
  const hits = [];
  orders.forEach(o => {
    o.items.forEach(i => {
      if (i.name.toLowerCase().includes(q) && i.price > 0)
        hits.push({ date: o.date, name: i.name, price: i.price, vendor: o.vendor });
    });
  });
  if (!hits.length) { hintEl.textContent = ''; return; }
  hits.sort((a,b) => b.date.localeCompare(a.date));
  const last = hits[0];
  const curPrice = parseFloat(priceEl?.value) || 0;
  let cls = 'price-hint', arrow = '';
  if (curPrice > 0) {
    if (curPrice > last.price) { cls = 'price-hint up'; arrow = ' ▲'; }
    else if (curPrice < last.price) { cls = 'price-hint down'; arrow = ' ▼'; }
    else { cls = 'price-hint same'; arrow = ' ＝'; }
  }
  hintEl.className = cls;
  hintEl.textContent = `上次：$${last.price.toLocaleString()}／${last.date}（${last.vendor}）${arrow}`;
}

function calcTotalFor(fid) {
  let total = 0;
  const container = document.getElementById('items-container-' + fid);
  if (!container) return;
  container.querySelectorAll('.item-row').forEach(row => {
    const id = row.id.replace('item-','');
    const p = parseFloat(document.getElementById('iprice-'+id)?.value)||0;
    const q = parseFloat(document.getElementById('iqty-'+id)?.value)||0;
    const sub = p*q;
    const subEl = document.getElementById('isub-'+id);
    if (subEl) subEl.value = sub > 0 ? '$'+sub.toLocaleString() : '';
    total += sub;
  });
  const totalEl = document.getElementById('order-total-' + fid);
  if (totalEl) totalEl.textContent = '$' + Math.round(total).toLocaleString();
}

// 付款方式點擊（多表單版）
document.addEventListener('click', e => {
  const chip = e.target.closest('.pay-chip');
  if (!chip) return;
  const fid = chip.dataset.fid;
  if (fid) {
    document.querySelectorAll(`.pay-chip[data-fid="${fid}"]`).forEach(c => c.classList.remove('selected'));
  } else {
    document.querySelectorAll('.pay-chip:not([data-fid])').forEach(c => c.classList.remove('selected'));
  }
  chip.classList.add('selected');
  chip.querySelector('input').checked = true;
});

async function saveAllOrders() {
  const forms = document.querySelectorAll('.order-form-card');
  if (!forms.length) { showAlert('提示', '沒有訂單可儲存'); return; }

  const btn = document.getElementById('save-btn');
  btn.disabled = true; btn.textContent = '儲存中…';

  let savedCount = 0;
  let errors = [];

  for (const form of forms) {
    const fid = form.id.replace('oform-','');
    const date    = document.getElementById('f-date-' + fid)?.value;
    const orderId = document.getElementById('f-orderid-' + fid)?.value.trim() || '';
    const vendor  = getVendorForForm(fid);
    const note    = document.getElementById('f-note-' + fid)?.value.trim() || '';
    const orderNote = document.getElementById('f-order-note-' + fid)?.value.trim() || '';

    if (!date || !vendor) {
      errors.push(`訂單 #${fid}：請填寫日期與廠商`);
      continue;
    }

    const items = [];
    document.getElementById('items-container-' + fid)?.querySelectorAll('.item-row').forEach(row => {
      const id = row.id.replace('item-','');
      const name  = document.getElementById('iname-'+id)?.value.trim();
      const price = parseFloat(document.getElementById('iprice-'+id)?.value)||0;
      const qty   = parseFloat(document.getElementById('iqty-'+id)?.value)||0;
      const unit  = document.getElementById('iunit-'+id)?.value || '斤';
      if (name) items.push({name, price, qty, unit});
    });

    if (!items.length) {
      errors.push(`訂單 #${fid}（${vendor}）：請至少填一個品項`);
      continue;
    }

    const total    = Math.round(items.reduce((s,i) => s+i.price*i.qty, 0));
    const isPaid   = document.getElementById('f-paid-' + fid)?.checked;
    const paidDate = isPaid ? (document.getElementById('f-paid-date-' + fid)?.value || date) : '';
    const payMethod = document.querySelector(`input[name="paymethod-${fid}"]:checked`)?.value || '';
    const payNote  = document.getElementById('f-pay-note-' + fid)?.value.trim() || '';

    const newOrder = {
      id: (Date.now() + savedCount).toString(),
      date, orderId, vendor, items, total,
      status: isPaid ? 'paid' : 'pending',
      paidDate, payMethod, payNote,
      note: orderNote || note
    };

    try {
      orders.push(newOrder);
      await persist(newOrder, 'insert');
      savedCount++;
    } catch(e) {
      errors.push(`訂單 #${fid}（${vendor}）儲存失敗`);
    }
  }

  btn.disabled = false; btn.textContent = '儲存全部訂單';

  if (errors.length) {
    showAlert('部分儲存失敗', errors.join('\n'));
  }
  if (savedCount > 0) {
    toast(`✓ 已儲存 ${savedCount} 張訂單`);
    document.getElementById('save-msg').textContent = `✓ 已儲存 ${savedCount} 張訂單`;
    setTimeout(() => document.getElementById('save-msg').textContent = '', 4000);
    renderOrders(); renderSummary();
    resetAllForms();
  }
}

// 相容舊呼叫
function initForm() { resetAllForms(); }
function resetForm() { resetAllForms(); }
function addItemRow() { if(formCounter>0) addItemRowTo(formCounter); }
function calcTotal() { if(formCounter>0) calcTotalFor(formCounter); }
function updateVendorList() {}
async function saveOrder() { await saveAllOrders(); }
function togglePaidFields() { if(formCounter>0) togglePaidFieldsFor(formCounter); }
function showPriceHint(id) { showPriceHintFor(id); }
