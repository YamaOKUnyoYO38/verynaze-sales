import { db } from '../db/db.js';

export async function exportAllAsJson() {
  const [records, drafts, productIdeas] = await Promise.all([
    db.records.toArray(),
    db.drafts.toArray(),
    db.productIdeas.toArray(),
  ]);
  return {
    app: 'requirement-quest',
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    drafts,
    productIdeas,
  };
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importFromJson(payload, { replace = false } = {}) {
  if (!payload || typeof payload !== 'object') throw new Error('不正なファイルです');
  if (replace) {
    await Promise.all([db.records.clear(), db.drafts.clear(), db.productIdeas.clear()]);
  }
  const stripId = (row) => {
    const { id, ...rest } = row;
    return rest;
  };
  if (Array.isArray(payload.records)) {
    await db.records.bulkAdd(payload.records.map(stripId));
  }
  if (Array.isArray(payload.drafts)) {
    await db.drafts.bulkAdd(payload.drafts.map(stripId));
  }
  if (Array.isArray(payload.productIdeas)) {
    await db.productIdeas.bulkAdd(payload.productIdeas.map(stripId));
  }
}
