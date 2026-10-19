/* Shared by the dependency-free browser sketch and Node's built-in test runner. */
(function (root) {
  function requestFromResources(resources, topK, catalog) {
    if (!Number.isInteger(topK) || topK < 1 || topK > 10) {
      throw new Error('Top K 必须是 1–10 的整数。');
    }
    const championIds = new Set(catalog.champions.map((row) => row.id));
    const itemIds = new Set(catalog.items.map((row) => row.id));
    if (resources.champion_ids.some((id) => !championIds.has(id)) ||
        resources.item_ids.some((id) => !itemIds.has(id))) {
      throw new Error('存在当前演示数据中未知的 ID，请检查输入。');
    }
    return {
      champion_ids: [...new Set(resources.champion_ids)],
      item_ids: [...resources.item_ids],
      top_k: topK,
    };
  }

  function mergeConfirmed(resources, candidates, catalog) {
    const next = {
      champion_ids: [...resources.champion_ids],
      item_ids: [...resources.item_ids],
    };
    for (const row of candidates) {
      // A shop observation is never proof of ownership, even at high confidence.
      if (!row.confirmed || row.ownership !== 'owned') continue;
      if (row.kind === 'champion') next.champion_ids.push(row.id);
      else if (row.kind === 'item') next.item_ids.push(row.id);
      else throw new Error('未知识别对象类型。');
    }
    return requestFromResources(next, 3, catalog);
  }

  const model = { requestFromResources, mergeConfirmed };
  root.ResourceModel = model;
  if (typeof module !== 'undefined') module.exports = model;
})(globalThis);
