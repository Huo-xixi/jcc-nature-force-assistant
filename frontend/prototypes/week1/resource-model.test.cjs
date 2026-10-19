const { test } = require('node:test');
const assert = require('node:assert/strict');
const { requestFromResources, mergeConfirmed } = require('./resource-model.js');
const catalog = { champions: [{ id: '1507' }, { id: '2512' }], items: [{ id: 'bf_sword' }] };

test('商店识别即使高置信度且已核对，也不能作为已拥有资源', () => {
  const input = { champion_ids: [], item_ids: [] };
  const rows = [{ kind: 'champion', id: '1507', confidence: 0.99, confirmed: true, ownership: 'shop' }];
  assert.deepEqual(mergeConfirmed(input, rows, catalog).champion_ids, []);
  assert.deepEqual(input, { champion_ids: [], item_ids: [] });
});

test('人工确认低置信度且确认购入后可导入；未确认候选被排除', () => {
  const rows = [
    { kind: 'champion', id: '1507', confidence: 0.61, confirmed: true, ownership: 'owned' },
    { kind: 'champion', id: '2512', confidence: 0.95, confirmed: false, ownership: 'owned' },
  ];
  assert.deepEqual(mergeConfirmed({ champion_ids: [], item_ids: [] }, rows, catalog).champion_ids, ['1507']);
});

test('API 输入英雄去重，但重复装备表示数量，必须保留', () => {
  const actual = requestFromResources({ champion_ids: ['1507', '1507'], item_ids: ['bf_sword', 'bf_sword'] }, 10, catalog);
  assert.deepEqual(actual, { champion_ids: ['1507'], item_ids: ['bf_sword', 'bf_sword'], top_k: 10 });
});

test('未知 ID、分数或越界 Top K 不能进入请求预览', () => {
  const empty = { champion_ids: [], item_ids: [] };
  for (const value of [0, 11, 1.5, NaN]) assert.throws(() => requestFromResources(empty, value, catalog));
  assert.throws(() => requestFromResources({ champion_ids: ['unknown'], item_ids: [] }, 3, catalog));
  assert.throws(() => requestFromResources({ champion_ids: [], item_ids: ['unknown'] }, 3, catalog));
  assert.doesNotThrow(() => requestFromResources(empty, 1, catalog));
});
