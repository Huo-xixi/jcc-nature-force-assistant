/* Single-screen course demo: image input, human correction, recommendation. */
(() => {
  const data = globalThis.Week1Fixtures;
  const VISION_API = 'http://127.0.0.1:8000/api/v1/vision/recognize-one-cost';
  const state = { imageUrl: '', fileName: '', status: '等待上传', candidates: [], recommendations: [] };
  const workspace = document.querySelector('#workspace');
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const championName = (id) => data.champions.find((row) => row.id === id)?.name ?? data.names[id] ?? id;
  let feedbackTimer;

  function notice(text) {
    clearTimeout(feedbackTimer);
    document.querySelector('#feedback').textContent = text;
    feedbackTimer = setTimeout(() => { document.querySelector('#feedback').textContent = ''; }, 3500);
  }

  function demoRecognitionRows() {
    return [
      { id: '1507', confidence: 0.96, included: true, source: '识别' },
      { id: '2512', confidence: 0.91, included: true, source: '识别' },
      { id: '2502', confidence: 0.84, included: true, source: '识别' },
      { id: '1502', confidence: 0.72, included: true, source: '识别' },
      { id: '1500', confidence: 0.58, included: false, source: '识别' },
    ];
  }

  async function startRecognition(file, dataUrl) {
    state.status = '正在分析图片…';
    state.candidates = [];
    state.recommendations = [];
    render();
    try {
      const response = await fetch(VISION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: dataUrl, filename: file.name }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `识别接口返回 ${response.status}`);
      state.candidates = payload.results.map((row) => ({
        id: row.id || '',
        confidence: row.confidence,
        included: row.accepted,
        source: row.accepted ? '一费卡识别' : '待人工修正',
      }));
      const accepted = state.candidates.filter((row) => row.included).length;
      state.status = `真实识别完成 · ${accepted}/5 个一费卡位`;
      render();
      notice(`识别到 ${accepted} 个一费英雄，其余卡位请人工修正。`);
    } catch (error) {
      state.status = '识别服务未启动';
      state.candidates = [];
      render();
      notice(`无法调用本地识别服务：${error.message}`);
    }
  }

  function selectedIds() {
    return [...new Set(state.candidates.filter((row) => row.included && row.id).map((row) => row.id))];
  }

  function rankRecommendations(ids) {
    return data.recommendations
      .map((recommendation) => {
        const lineup = data.lineups.find((row) => row.id === recommendation.lineup_id);
        const members = new Set(lineup?.champions.map((row) => row.champion_id) ?? []);
        const matches = ids.filter((id) => members.has(id));
        return { ...recommendation, matches, demoScore: Math.min(99, recommendation.score + matches.length * 8) };
      })
      .sort((a, b) => b.matches.length - a.matches.length || b.demoScore - a.demoScore);
  }

  function candidateCard(row, index) {
    const confidence = row.confidence == null ? '人工补录' : `${Math.round(row.confidence * 100)}%`;
    const confidenceClass = row.confidence != null && row.confidence < 0.8 ? 'confidence low' : 'confidence';
    return `<article class="candidate ${row.included ? '' : 'excluded'}">
      <label class="include"><input type="checkbox" data-include="${index}" ${row.included ? 'checked' : ''} /><span>纳入推荐</span></label>
      <div class="portrait" aria-hidden="true">${row.id ? escape(championName(row.id).slice(0, 1)) : '?'}</div>
      <label class="hero-select"><span>英雄 ${String(index + 1).padStart(2, '0')}</span><select data-candidate="${index}" aria-label="修正第 ${index + 1} 个英雄"><option value="" ${row.id ? '' : 'selected'}>未识别，请选择</option>${data.champions.map((champion) => `<option value="${champion.id}" ${champion.id === row.id ? 'selected' : ''}>${escape(champion.name)}</option>`).join('')}</select></label>
      <span class="${confidenceClass}">${confidence}</span>
      <button type="button" class="icon-button" data-action="delete" data-index="${index}" aria-label="删除${escape(championName(row.id))}">×</button>
    </article>`;
  }

  function recommendationCard(row, index) {
    return `<article class="recommendation">
      <div class="rank">0${index + 1}</div>
      <div class="recommendation-main"><p class="eyebrow">匹配 ${row.matches.length} 名已确认英雄</p><h3>${escape(row.lineup_name)}</h3><p>${row.matches.length ? `阵容中已有：${row.matches.map(championName).join('、')}` : '当前英雄直接匹配较少，可作为转型备选。'}</p><div class="tags">${row.craftable_recommended_items.map((item) => `<span>${escape(item)}</span>`).join('')}</div></div>
      <div class="score"><strong>${row.demoScore.toFixed(1)}</strong><span>演示评分</span></div>
    </article>`;
  }

  function render() {
    const confirmed = selectedIds();
    workspace.innerHTML = `<section class="workspace-grid">
      <article class="panel upload-panel">
        <div class="panel-heading"><span class="step-number">01</span><div><h2>上传游戏截图</h2><p>支持 PNG、JPG；推荐使用 1920 × 1092 的 MuMu 截图。</p></div></div>
        <label class="dropzone ${state.imageUrl ? 'has-image' : ''}">
          <input id="screenshot-input" type="file" accept="image/png,image/jpeg,image/webp" />
          ${state.imageUrl ? `<img src="${state.imageUrl}" alt="已上传的游戏截图" /><span class="replace-hint">点击更换截图</span>` : '<span class="upload-icon">＋</span><strong>选择游戏截图</strong><small>也可以将图片拖放到这里</small>'}
        </label>
        <div class="file-meta"><span>${escape(state.fileName || '尚未选择图片')}</span><span class="status-dot ${state.candidates.length ? 'done' : ''}">${escape(state.status)}</span></div>
        <button type="button" class="secondary full" data-action="demo">没有截图？使用演示图片流程</button>
      </article>
      <article class="panel correction-panel">
        <div class="panel-heading"><span class="step-number">02</span><div><h2>核对识别英雄</h2><p>名称识别错误时直接下拉修改，也可以删除或补录英雄。</p></div></div>
        <div class="candidate-list">${state.status.startsWith('正在') ? '<div class="recognizing"><span></span><p>正在定位并识别英雄角色…</p></div>' : state.candidates.map(candidateCard).join('') || '<div class="empty"><strong>等待图片</strong><p>上传截图后，识别候选会出现在这里。</p></div>'}</div>
        <div class="correction-actions"><button type="button" class="secondary" data-action="add" ${state.status.startsWith('正在') ? 'disabled' : ''}>＋ 人工补录英雄</button><span>已确认 ${confirmed.length} 名</span></div>
        <button type="button" class="primary full" data-action="recommend" ${confirmed.length ? '' : 'disabled'}>确认英雄并生成推荐 →</button>
      </article>
    </section>
    <section class="result-section ${state.recommendations.length ? 'visible' : ''}" id="recommendations">
      <div class="result-heading"><div><p class="eyebrow">RECOMMENDATION</p><h2>基于 ${confirmed.length} 名已确认英雄的阵容建议</h2></div><button type="button" class="text-button" data-action="clear-result">返回修改</button></div>
      <div class="confirmed-strip"><span>本次输入</span>${confirmed.map((id) => `<b>${escape(championName(id))}</b>`).join('')}</div>
      <div class="recommendation-list">${state.recommendations.map(recommendationCard).join('')}</div>
      <p class="disclaimer">推荐使用仓库中的 18.4 固定阵容数据进行演示；正式版将调用 FastAPI 推荐接口重新计算分数。</p>
    </section>`;
  }

  document.addEventListener('change', async (event) => {
    const target = event.target;
    if (target.id === 'screenshot-input') {
      const file = target.files?.[0];
      if (!file) return;
      state.imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      state.fileName = file.name;
      await startRecognition(file, state.imageUrl);
      return;
    }
    if (target.dataset.candidate !== undefined) {
      const row = state.candidates[Number(target.dataset.candidate)];
      row.id = target.value;
      row.source = '人工修正';
      row.confidence = null;
      row.included = true;
      state.recommendations = [];
      render();
    }
    if (target.dataset.include !== undefined) {
      state.candidates[Number(target.dataset.include)].included = target.checked;
      state.recommendations = [];
      render();
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, index } = target.dataset;
    if (action === 'demo') {
      state.imageUrl = '';
      state.fileName = 'MuMu-演示截图.png';
      state.candidates = demoRecognitionRows();
      state.status = '模拟识别完成 · 演示样例';
      state.recommendations = [];
      render();
      notice('已载入模拟候选，请人工核对后再生成推荐。');
    }
    if (action === 'add') {
      state.candidates.push({ id: data.champions.find((row) => row.cost === 1)?.id || '', confidence: null, included: true, source: '人工补录' });
      state.recommendations = [];
      render();
    }
    if (action === 'delete') {
      state.candidates.splice(Number(index), 1);
      state.recommendations = [];
      render();
    }
    if (action === 'recommend') {
      const ids = selectedIds();
      if (!ids.length) { notice('请至少确认一名英雄。'); return; }
      state.recommendations = rankRecommendations(ids).slice(0, 3);
      render();
      document.querySelector('#recommendations').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (action === 'clear-result') {
      state.recommendations = [];
      render();
      scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  render();
})();
