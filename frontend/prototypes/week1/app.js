/* Week-one flow sketch. No network requests, capture, inference or scoring. */
(() => {
  const data = globalThis.Week1Fixtures;
  const model = globalThis.ResourceModel;
  const state = {
    resources: { champion_ids: [], item_ids: [] }, topK: 3,
    search: '', selectedLineup: data.recommendations[0].lineup_id,
    capture: '未启动（演示）', candidates: [], preview: null,
  };
  const page = document.querySelector('#page');
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const findName = (id, kind) => (kind === 'champion' ? data.champions : data.items).find((row) => row.id === id)?.name ?? id;
  let feedbackTimer;
  const notice = (text) => {
    clearTimeout(feedbackTimer);
    document.querySelector('#feedback').textContent = text;
    feedbackTimer = setTimeout(() => { document.querySelector('#feedback').textContent = ''; }, 4000);
  };
  const tag = (text) => `<span class="tag">${escape(text)}</span>`;
  const button = (text, action, extra = '', classes = '') => `<button type="button" class="${classes}" data-action="${action}" ${extra}>${text}</button>`;
  const heading = (eyebrow, title, subtitle) => `<div class="page-heading"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${subtitle}</p></div>`;
  const empty = (text) => `<p class="empty">${text}</p>`;

  function home() {
    return `<section class="hero"><p class="eyebrow">NATURE FORCE / 01</p><h1>从手中资源出发，<br />找到下一步方向。</h1><p>选择已有英雄与装备，查看阵容建议、资源缺口与推荐依据。<br />也可以先识别商店候选，再人工确认是否已经购入。</p><div class="actions"><a class="button primary" href="#input">开始手动选择 →</a><a class="button" href="#vision">预览识别确认</a></div><div class="hero-decoration" aria-hidden="true">✧</div></section>
      <div class="steps"><article><span>01 / 录入</span><h2>手动选择或视觉辅助</h2><p>已有资源和商店候选分别记录。</p></article><article><span>02 / 确认</span><h2>修正后再进入推荐</h2><p>候选可修改、删除或确认已购入。</p></article><article><span>03 / 理解</span><h2>看懂分数与资源缺口</h2><p>四项评分与解释对应 API V1。</p></article></div>
      <section class="panel inline-panel"><div><h2>一组固定案例，评审完整流程</h2><p>韦鲁斯、凯尔、瑟庄妮 + 暴风大剑、女神之泪、反曲之弓。</p></div>${button('载入案例并查看推荐', 'demo', '', 'primary')}</section>`;
  }

  function input() {
    const filtered = data.champions.filter((row) => row.name.includes(state.search) || row.id.includes(state.search));
    const selectedChampions = state.resources.champion_ids.map((id) => `<span class="selection">${escape(findName(id, 'champion'))}${button('×', 'remove-champion', `data-id="${id}" aria-label="删除${escape(findName(id, 'champion'))}"`)}</span>`).join('');
    const counts = state.resources.item_ids.reduce((acc, id) => ({ ...acc, [id]: (acc[id] ?? 0) + 1 }), {});
    return heading('RESOURCE INPUT / 02', '先整理你已拥有的资源', '英雄按种类去重；同种装备可以重复添加。商店候选需要明确确认已购入。') +
      `<div class="two-columns"><section class="panel"><div class="section-heading"><h2>英雄</h2><span>本原型收录 ${data.champions.length} 个示例</span></div><label class="search">搜索英雄或 ID<input id="champion-search" value="${escape(state.search)}" placeholder="例如：韦鲁斯" /></label><div class="card-grid">${filtered.map((row) => `<button class="entity ${state.resources.champion_ids.includes(row.id) ? 'selected' : ''}" data-action="add-champion" data-id="${row.id}" ${state.resources.champion_ids.includes(row.id) ? 'disabled' : ''}><span class="avatar">${escape(row.name.slice(0, 1))}</span><strong>${escape(row.name)}</strong><small>${row.cost} 费 · ${row.id}</small><span>${state.resources.champion_ids.includes(row.id) ? '已选择' : '+ 添加'}</span></button>`).join('') || empty('没有匹配的示例英雄。')}</div><h2 class="section-gap">装备</h2><div class="item-grid">${data.items.map((row) => button(`${escape(row.name)} <span>＋</span>`, 'add-item', `data-id="${row.id}"`, 'item-button')).join('')}</div></section>
      <aside class="panel resource-panel"><h2>当前输入</h2><h3>已拥有英雄</h3><div class="selections">${selectedChampions || empty('尚未选择英雄')}</div><h3>已拥有装备</h3><div class="selections">${Object.entries(counts).map(([id, count]) => `<span class="selection">${escape(findName(id, 'item'))} ×${count}${button('−', 'remove-item', `data-id="${id}" aria-label="减少一个${escape(findName(id, 'item'))}"`)}</span>`).join('') || empty('尚未选择装备')}</div><label class="top-k">Top K<select id="top-k">${Array.from({ length: 10 }, (_, i) => `<option ${state.topK === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></label><div class="stack">${button('预览当前推荐请求', 'preview', '', 'primary')}${button('载入固定案例并看结果', 'demo')}${button('清空当前资源', 'clear', '', 'text-button')}</div><p class="muted">原型不会计算当前输入的推荐。固定结果只对应演示案例。</p></aside></div>
      ${state.preview ? `<section class="panel request"><h2>API V1 请求预览</h2><p>POST /api/v1/recommendations · 仅预览，未发起请求</p><pre>${escape(JSON.stringify(state.preview, null, 2))}</pre></section>` : ''}`;
  }

  function results() {
    const labels = { champion_match: ['英雄匹配', 45], item_fit: ['装备适配', 25], trait_coverage: ['羁绊覆盖', 20], meta_strength: ['公开强度', 10] };
    return heading('RECOMMENDATIONS / 03', '比较你的阵容方向', '以下为成员 A 后端在固定案例下的输出快照；修改输入不会重新计算本页。') +
      `<div class="context-bar"><span>固定案例 · 3 名英雄 / 3 件散件 / Top 3</span><a href="#input">修改输入 →</a></div>` +
      data.recommendations.map((row, i) => `<article class="panel recommendation"><div class="recommendation-title"><div><p class="eyebrow">候选 ${String(i + 1).padStart(2, '0')}</p><h2>${escape(row.lineup_name)}</h2></div><div class="score">${row.score.toFixed(2)}<small>综合分 / 100</small></div></div><div class="score-grid">${Object.entries(row.breakdown).map(([key, value]) => `<div><div class="score-label"><span>${labels[key][0]}</span><span>${value} / ${labels[key][1]}</span></div><progress value="${value}" max="${labels[key][1]}" aria-label="${labels[key][0]}"></progress></div>`).join('')}</div><div class="resource-gap"><p>缺少核心：${row.missing_core_champions.map(tag).join(' ') || '无'}</p><p>可满足或合成：${row.craftable_recommended_items.map(tag).join(' ') || '暂无'}</p></div><ul class="reasons">${row.explanation.map((text) => `<li>${escape(text)}</li>`).join('')}</ul>${button('查看阵容详情 →', 'detail', `data-id="${row.lineup_id}"`)}</article>`).join('');
  }

  function detail() {
    const lineup = data.lineups.find((row) => row.id === state.selectedLineup) ?? data.lineups[0];
    const nameById = (id) => data.names[id] ?? id;
    return heading('LINEUP DETAIL / 04', escape(lineup.name), '布局草图 · 站位、装备和统计来自仓库静态快照，不代表实时对局判断。') +
      `<div class="two-columns"><section class="panel"><h2>三行站位示意</h2><div class="board">${[['front', '前排'], ['middle', '中排'], ['back', '后排']].map(([position, label]) => `<div class="board-row"><span>${label}</span><div>${lineup.champions.filter((row) => row.position === position).map((row) => `<span class="unit">${escape(nameById(row.champion_id))}${row.is_core ? '<small>核心</small>' : ''}</span>`).join('')}</div></div>`).join('')}</div><p class="muted">站位仅为阵容模板示意；没有针对对手进行优化。</p></section><section class="panel"><h2>核心装备分配</h2>${lineup.champions.filter((row) => row.recommended_item_ids.length).map((row) => `<div class="equipment-row"><strong>${escape(nameById(row.champion_id))}</strong><p>${row.recommended_item_ids.map((id) => tag(nameById(id))).join(' ')}</p></div>`).join('')}</section></div><section class="panel section-gap"><h2>数据快照</h2><div class="stats"><div><strong>${lineup.meta_stats.avg_placement}</strong><span>平均排名</span></div><div><strong>${(lineup.meta_stats.top4_rate * 100).toFixed(1)}%</strong><span>前四率</span></div><div><strong>${lineup.meta_stats.sample_count.toLocaleString()}</strong><span>样本量</span></div></div><p>采集日期 ${escape(lineup.collected_at)} · <a href="${escape(lineup.source_url)}" target="_blank" rel="noreferrer">查看数据来源 ↗</a></p><p class="muted">阵容详情查询接口尚未实现；本页使用显式导出的本地演示素材，不读取后端目录。</p><a class="button" href="#results">← 返回推荐列表</a></section>`;
  }

  function vision() {
    return heading('VISION CONFIRMATION / 05', '识别是候选，确认才是输入', '首个场景：Windows 安卓模拟器的商店卡牌图像。不识别商店文字、金币或人口。') +
      `<div class="context-bar"><span>采集状态：${state.capture}</span><div>${button('载入模拟识别结果', 'mock-vision')}${button(state.capture.startsWith('暂停') ? '继续（模拟）' : '暂停（模拟）', 'pause')}</div></div><div class="two-columns"><section class="panel"><h2>商店区域示意</h2><div class="screen-placeholder"><span>游戏客户区 / 示意图，非真实截图</span><div class="shop-slots">${Array.from({ length: 5 }, (_, i) => `<div><span>卡牌 ${i + 1}</span><small>图像区域</small></div>`).join('')}</div></div><p class="muted">分辨率、窗口尺寸、缩放比例和精确裁剪坐标待真实截图校准。不会据此示意图生成生产坐标。</p><a href="#input">识别不可用？切换手动输入 →</a></section><section class="panel"><h2>商店候选</h2><p class="muted">以下置信度均为模拟值。高分也不代表已经拥有。</p>${state.candidates.map((row, i) => `<article class="candidate"><div class="candidate-header"><strong>卡位 ${i + 1}</strong><span class="tag ${row.confidence < 0.85 ? 'warning' : ''}">${Math.round(row.confidence * 100)}% · 模拟</span></div><label>修正英雄<select data-candidate="${i}">${data.champions.map((champion) => `<option value="${champion.id}" ${champion.id === row.id ? 'selected' : ''}>${escape(champion.name)}</option>`).join('')}</select></label><label class="checkbox"><input type="checkbox" data-confirm="${i}" ${row.confirmed ? 'checked' : ''} />我已核对英雄并确认已在游戏中购入</label>${button('删除此候选', 'delete-candidate', `data-index="${i}"`, 'text-button')}</article>`).join('') || empty('尚未载入候选。点击“载入模拟识别结果”预览人工确认流程。')}<div class="stack section-gap">${button('将已确认购入的英雄合并到输入', 'merge-vision', '', 'primary')}${button('删除全部候选', 'clear-candidates', '', 'text-button')}</div><p class="muted">这里只更新辅助系统中的输入，不会购买游戏中的英雄。合并后候选被消费，避免重复导入。</p></section></div>`;
  }

  function render() {
    const route = location.hash.slice(1) || 'home';
    const views = { home, input, results, detail, vision };
    page.innerHTML = (views[route] ?? home)();
    document.querySelectorAll('nav a').forEach((link) => {
      if (link.hash === `#${route}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, id, index } = target.dataset;
    try {
      if (action === 'add-champion' && !state.resources.champion_ids.includes(id)) state.resources.champion_ids.push(id);
      if (action === 'remove-champion') state.resources.champion_ids = state.resources.champion_ids.filter((value) => value !== id);
      if (action === 'add-item') state.resources.item_ids.push(id);
      if (action === 'remove-item') { const i = state.resources.item_ids.indexOf(id); if (i >= 0) state.resources.item_ids.splice(i, 1); }
      if (['add-champion', 'remove-champion', 'add-item', 'remove-item'].includes(action)) state.preview = null;
      if (action === 'clear') { state.resources = { champion_ids: [], item_ids: [] }; state.preview = null; notice('资源已清空。'); }
      if (action === 'preview') state.preview = model.requestFromResources(state.resources, state.topK, data);
      if (action === 'demo') { state.resources = structuredClone(data.preset); state.topK = 3; state.preview = null; location.hash = 'results'; notice('已载入固定案例；推荐来自后端输出快照。'); }
      if (action === 'detail') { state.selectedLineup = id; location.hash = 'detail'; }
      if (action === 'mock-vision') { state.candidates = structuredClone(data.candidates); state.capture = '暂停，等待确认（演示）'; }
      if (action === 'pause') state.capture = state.capture.startsWith('暂停') ? '正在捕获（模拟，无真实采集）' : '暂停（演示）';
      if (action === 'delete-candidate') state.candidates.splice(Number(index), 1);
      if (action === 'clear-candidates') state.candidates = [];
      if (action === 'merge-vision') {
        const confirmed = state.candidates.filter((row) => row.confirmed && row.ownership === 'owned');
        if (!confirmed.length) { notice('请先核对并勾选至少一个已购入英雄。'); return; }
        const request = model.mergeConfirmed(state.resources, state.candidates, data);
        state.resources = { champion_ids: request.champion_ids, item_ids: request.item_ids };
        state.candidates = state.candidates.filter((row) => !confirmed.includes(row));
        state.preview = null; location.hash = 'input'; notice('已将确认购入的英雄合并到输入。');
      }
      render();
    } catch (error) { notice(error.message); }
  });
  document.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'top-k') { state.topK = Number(target.value); state.preview = null; render(); }
    if (target.dataset.candidate !== undefined) {
      const row = state.candidates[Number(target.dataset.candidate)]; row.id = target.value;
      row.confirmed = false; row.ownership = 'shop'; render();
    }
    if (target.dataset.confirm !== undefined) {
      const row = state.candidates[Number(target.dataset.confirm)]; row.confirmed = target.checked;
      row.ownership = target.checked ? 'owned' : 'shop';
    }
  });
  document.addEventListener('input', (event) => {
    if (event.target.id !== 'champion-search') return;
    state.search = event.target.value;
    const position = event.target.selectionStart; render();
    const input = document.querySelector('#champion-search'); input.focus(); input.setSelectionRange(position, position);
  });
  window.addEventListener('hashchange', render);
  render();
})();
