// ── 自訂對話框（取代原生 alert/confirm/prompt）──────────
let _dialogResolve = null;

function _dialogShow(title, body, inputs, buttons) {
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-body').textContent = body;

  const inputWrap = document.getElementById('dialog-input-wrap');
  const inputEl = document.getElementById('dialog-input');
  if (inputs) {
    inputWrap.style.display = 'block';
    inputEl.type = inputs.type || 'text';
    inputEl.value = inputs.value || '';
    inputEl.placeholder = inputs.placeholder || '';
    setTimeout(() => { inputEl.focus(); inputEl.select(); }, 60);
  } else {
    inputWrap.style.display = 'none';
    inputEl.value = '';
  }

  document.getElementById('dialog-actions').innerHTML = buttons;
  document.getElementById('dialog-bg').style.display = 'flex';

  // Enter key support
  const handler = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); _dialogOk(); }
    if (e.key === 'Escape') { e.preventDefault(); _dialogCancel(); }
  };
  document.addEventListener('keydown', handler);
  document.getElementById('dialog-bg')._keyHandler = handler;
}

function _dialogHide() {
  const bg = document.getElementById('dialog-bg');
  bg.style.display = 'none';
  if (bg._keyHandler) {
    document.removeEventListener('keydown', bg._keyHandler);
    bg._keyHandler = null;
  }
}

function _dialogOk() {
  const inputWrap = document.getElementById('dialog-input-wrap');
  const val = inputWrap.style.display !== 'none'
    ? document.getElementById('dialog-input').value
    : true;
  _dialogHide();
  if (_dialogResolve) { _dialogResolve(val); _dialogResolve = null; }
}

function _dialogCancel() {
  _dialogHide();
  if (_dialogResolve) { _dialogResolve(null); _dialogResolve = null; }
}

/**
 * 取代 alert() — 顯示提示訊息
 * await showAlert('標題', '內容')
 */
function showAlert(title, body) {
  return new Promise(resolve => {
    _dialogResolve = resolve;
    _dialogShow(title, body || '', null,
      '<button class="btn btn-primary" onclick="_dialogOk()">確定</button>'
    );
  });
}

/**
 * 取代 confirm() — 確認對話框
 * const ok = await showConfirm('標題', '內容')
 * if (!ok) return;
 */
function showConfirm(title, body) {
  return new Promise(resolve => {
    _dialogResolve = resolve;
    _dialogShow(title, body || '', null,
      '<button class="btn" onclick="_dialogCancel()">取消</button>' +
      '<button class="btn btn-primary" onclick="_dialogOk()">確認</button>'
    );
  });
}

/**
 * 取代 confirm() 帶危險操作 — 紅色確認按鈕
 * const ok = await showDangerConfirm('標題', '內容')
 */
function showDangerConfirm(title, body) {
  return new Promise(resolve => {
    _dialogResolve = resolve;
    _dialogShow(title, body || '', null,
      '<button class="btn" onclick="_dialogCancel()">取消</button>' +
      '<button class="btn btn-danger" onclick="_dialogOk()">確認刪除</button>'
    );
  });
}

/**
 * 取代 prompt() — 輸入對話框
 * const val = await showPrompt('標題', '說明', '預設值')
 * if (val === null) return; // 使用者取消
 */
function showPrompt(title, body, defaultValue, placeholder) {
  return new Promise(resolve => {
    _dialogResolve = resolve;
    _dialogShow(title, body || '', {
      type: 'text', value: defaultValue || '', placeholder: placeholder || ''
    },
      '<button class="btn" onclick="_dialogCancel()">取消</button>' +
      '<button class="btn btn-primary" onclick="_dialogOk()">確認</button>'
    );
  });
}
