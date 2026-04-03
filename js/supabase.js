// ── Supabase 設定 ─────────────────────────────────────
const SUPABASE_URL = 'https://lkryumerfbqfwfyxegve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrcnl1bWVyZmJxZndmeXhlZ3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjQxMDgsImV4cCI6MjA4OTIwMDEwOH0.AA0aqoYqln4e-uoMoqQpk_BfqexA6ncHOLi9SDOne34';

// ── 廠商排序 ─────────────────────────────────────────
const VENDOR_ORDER = ['利仁','廣生堂','和盛記','界順','明(坤贊)','三興','仁記','銓崧',
  '中冬金元','鴻龍','信惠虹','源山','集昌','漢良堂','德合記','河記','駿賀','養蜂場','港香蘭',
  '大新','豐甲','富田喬','原祥塑膠','捷可印','紙箱龍','南成','宏笙','尚景印刷',
  '新竹貨運','宅配通','新光保全','興承','崇友'];

function sortVendors(names) {
  return names.sort((a, b) => {
    const ia = VENDOR_ORDER.indexOf(a);
    const ib = VENDOR_ORDER.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b, 'zh-TW');
  });
}

// ── 狀態 ──────────────────────────────────────────────
let orders = [];
let pendingPaidId = null;
let supabaseReady = false;

// ── 廠商分類定義 ──────────────────────────────────────
const VENDOR_CATEGORIES = {
  '中藥材': ['利仁','廣生堂','和盛記','界順','明(坤贊)','三興','仁記','銓崧','中冬金元','鴻龍','信惠虹','源山','集昌','漢良堂','德合記','河記','駿賀','養蜂場','港香蘭'],
  '包裝材': ['大新','豐甲','富田喬','原祥塑膠','捷可印','紙箱龍','南成','宏笙','尚景印刷'],
  '物流':   ['新竹貨運','宅配通'],
  '大樓修繕': ['新光保全','興承','崇友'],
};

// ── Supabase fetch 封裝 ──────────────────────────────
async function sbFetch(path, options = {}) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
  if (options.prefer) { headers['Prefer'] = options.prefer; delete options.prefer; }
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Supabase error: HTTP ' + res.status + ' — ' + text);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── 載入訂單 ─────────────────────────────────────────
async function loadOrders() {
  setSyncStatus('syncing', '連線中…');
  try {
    const data = await sbFetch('orders?select=*,order_items(*)&order=date.desc');
    orders = data.map(r => ({
      id: r.id,
      date: r.date,
      orderId: r.order_id || '',
      vendor: r.vendor,
      items: (r.order_items || [])
        .sort((a,b) => (a.sort_order||0) - (b.sort_order||0))
        .map(i => ({ name: i.name, qty: i.qty, price: i.price, unit: i.unit || '斤' })),
      total: r.total,
      status: r.status,
      paidDate: r.paid_date || '',
      payMethod: r.pay_method || '',
      payNote: r.pay_note || '',
      note: r.note || '',
      type: r.type || '',
      refundOf: r.refund_of || ''
    }));
    supabaseReady = true;
    setSyncStatus('synced', `已同步 ${orders.length} 筆`);
    await importHistory();
  } catch(e) {
    console.warn('Supabase 連線失敗，改用本地離線模式', e);
    supabaseReady = false;
    const local = localStorage.getItem('weiyuan_orders_v1');
    orders = local ? JSON.parse(local) : HISTORY;
    setSyncStatus('error', '離線模式');
  }
}

// ── 匯入歷史資料到 Supabase ──────────────────────────
async function importHistory() {
  const hist = [...orders];
  const dbIds = new Set(orders.map(o => o.id));
  const missing = HISTORY.filter(h => !dbIds.has(h.id));
  const total = missing.length;

  if (total === 0) {
    orders = hist;
    setSyncStatus('synced', `已同步 ${hist.length} 筆（無需補齊）`);
    return;
  }

  let done = 0;
  let failed = [];

  for (const o of missing) {
    try {
      await insertOrder(o);
      done++;
      if (done % 5 === 0 || done === total) {
        setSyncStatus('syncing', `匯入中 ${done}/${total}…`);
      }
    } catch(e) {
      console.warn('匯入失敗，稍後重試:', o.id, e.message);
      failed.push(o);
    }
  }

  if (failed.length > 0) {
    setSyncStatus('syncing', `重試 ${failed.length} 筆…`);
    for (const o of failed) {
      try {
        await insertOrder(o);
      } catch(e) {
        console.error('重試仍失敗:', o.id, e.message);
      }
    }
  }

  orders = hist;
  setSyncStatus('synced', `已匯入完成，共 ${hist.length} 筆`);
}

// ── 新增一筆訂單到 Supabase ───────────────────────────
async function insertOrder(o) {
  await sbFetch('orders', {
    method: 'POST',
    prefer: 'return=minimal',
    body: JSON.stringify({
      id: o.id,
      date: o.date,
      order_id: o.orderId || '',
      vendor: o.vendor,
      total: o.total,
      status: o.status,
      paid_date: o.paidDate || '',
      pay_method: o.payMethod || '',
      pay_note: o.payNote || '',
      note: o.note || '',
      type: o.type || '',
      refund_of: o.refundOf || ''
    })
  });
  if (o.items && o.items.length > 0) {
    await sbFetch('order_items', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify(o.items.map((item, idx) => ({
        order_id: o.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        unit: item.unit || '斤',
        sort_order: idx
      })))
    });
  }
}

// ── 更新一筆訂單（僅狀態，不重建品項）────────────────
async function updateOrderStatus(id, status, paidDate) {
  const url = SUPABASE_URL + '/rest/v1/orders?id=eq.' + id;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ status, paid_date: paidDate || '' })
  });
  if (!res.ok) throw new Error('PATCH 失敗 HTTP ' + res.status + ': ' + await res.text());
}

async function updateOrder(o) {
  await sbFetch('orders?id=eq.' + o.id, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: JSON.stringify({
      date: o.date,
      order_id: o.orderId || '',
      vendor: o.vendor,
      total: o.total,
      status: o.status,
      paid_date: o.paidDate || '',
      pay_method: o.payMethod || '',
      pay_note: o.payNote || '',
      note: o.note || '',
      type: o.type || '',
      refund_of: o.refundOf || ''
    })
  });
  await sbFetch('order_items?order_id=eq.' + o.id, { method: 'DELETE', prefer: 'return=minimal' });
  if (o.items && o.items.length > 0) {
    await sbFetch('order_items', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify(o.items.map((item, idx) => ({
        order_id: o.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        unit: item.unit || '斤',
        sort_order: idx
      })))
    });
  }
}

// ── 刪除一筆訂單 ──────────────────────────────────────
async function deleteFromDB(id) {
  await sbFetch('order_items?order_id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' });
  await sbFetch('orders?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' });
}

// ── persist（寫入 Supabase 或降級 localStorage）────────
async function persist(changedOrder, action) {
  if (!supabaseReady) {
    localStorage.setItem('weiyuan_orders_v1', JSON.stringify(orders));
    return;
  }
  setSyncStatus('syncing', '儲存中…');
  try {
    if (action === 'insert') await insertOrder(changedOrder);
    else if (action === 'update') await updateOrder(changedOrder);
    else if (action === 'delete') await deleteFromDB(changedOrder);
    setSyncStatus('synced', `已同步`);
  } catch(e) {
    setSyncStatus('error', '同步失敗，請重試');
    console.error(e);
    throw e;
  }
}

// ── 同步狀態指示 ──────────────────────────────────────
function setSyncStatus(state, text) {
  const dot = document.getElementById('sync-dot');
  const label = document.getElementById('sync-text');
  if (!dot) return;
  dot.className = 'sync-dot ' + state;
  label.textContent = text;
}

function allOrders() { return orders; }
