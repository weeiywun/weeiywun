// ── 安全渲染輔助函式 ──────────────────────────────────

/**
 * 安全地渲染訂單列表行
 */
function renderOrderRow(order, onClick) {
  const { escapeHtml } = window.securityUtils;
  const itemSummary = order.items.length === 1
    ? `${escapeHtml(order.items[0].name)}　${order.items[0].qty} ${order.items[0].unit||'斤'}`
    : `${escapeHtml(order.items[0].name)} 等 ${order.items.length} 項`;
  
  return `<tr class="order-row" onclick="${escapeHtml(onClick)}" title="點擊查看詳情">
    <td>${escapeHtml(order.date)}</td>
    <td class="mono">${escapeHtml(order.orderId||'—')}</td>
    <td class="font-medium">${escapeHtml(order.vendor)}</td>
    <td>
      <span>${itemSummary}</span>
      ${order.items.length>1?`<span class="text-[11px] text-info ml-1.5">▶ ${order.items.length} 項</span>`:''}
      ${order.note?`<span class="text-[11px] text-txt-3 ml-1.5">📝</span>`:''}
    </td>
    <td class="font-semibold">$${order.total.toLocaleString()}</td>
    <td><span class="badge ${order.status==='paid'?'badge-paid':'badge-pending'}">${order.status==='paid'?'已付款':'未付款'}</span></td>
    <td class="text-txt-3 text-xs">${escapeHtml(order.paidDate||'—')}</td>
  </tr>`;
}

/**
 * 安全地渲染摘要卡片
 */
function renderSummaryCards(monthOrders, monthTotal, unpaidTotal) {
  return `
    <div class="metric"><div class="metric-label">本月訂單數</div><div class="metric-value">${monthOrders}</div></div>
    <div class="metric"><div class="metric-label">本月進貨金額</div><div class="metric-value">$${monthTotal.toLocaleString()}</div></div>
    <div class="metric"><div class="metric-label">累計未付款</div><div class="metric-value warn">$${unpaidTotal.toLocaleString()}</div></div>`;
}

/**
 * 安全地渲染廠商選項
 */
function renderVendorOptions(vendors) {
  const { escapeHtml } = window.securityUtils;
  return vendors.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
}

/**
 * 安全地渲染品項明細
 */
function renderItemDetails(items) {
  const { escapeHtml } = window.securityUtils;
  
  return items.map(item => {
    const sub = Math.round(item.qty * item.price);
    const isNeg = sub < 0;
    const negCls = isNeg ? 'text-err' : '';
    
    return `
    <tr class="${isNeg ? 'bg-err/5' : ''}">
      <td class="font-medium ${negCls}">${escapeHtml(item.name)}</td>
      <td class="text-right ${negCls}">${item.qty} ${escapeHtml(item.unit||'斤')}</td>
      <td class="text-right ${negCls}">$${item.price.toLocaleString()}</td>
      <td class="text-right font-semibold ${negCls}">
        $${sub.toLocaleString()}
      </td>
    </tr>`;
  }).join('');
}

/**
 * 安全地顯示提示訊息（空狀態）
 */
function renderEmptyState(message) {
  const { escapeHtml } = window.securityUtils;
  return `<div class="empty">${escapeHtml(message)}</div>`;
}

/**
 * 安全地渲染價格提示
 */
function renderPriceHint(lastPrice) {
  const { escapeHtml } = window.securityUtils;
  return `上次：$${lastPrice.price.toLocaleString()}／${escapeHtml(lastPrice.date)}（${escapeHtml(lastPrice.vendor)}）`;
}

// 匯出到全局
window.safeRender = {
  renderOrderRow,
  renderSummaryCards,
  renderVendorOptions,
  renderItemDetails,
  renderEmptyState,
  renderPriceHint
};
