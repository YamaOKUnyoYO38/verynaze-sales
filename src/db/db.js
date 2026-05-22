import Dexie from 'dexie';

export const db = new Dexie('requirementQuestDB');

db.version(1).stores({
  records:
    '++id, caseId, title, mode, level, industry, score, rank, createdAt, updatedAt',
  drafts: '++id, caseId, updatedAt',
  productIdeas: '++id, productName, createdAt, updatedAt',
});

export const RANK_OPTIONS = ['S', 'A', 'B', 'C', 'D', 'E'];
export const MODE_OPTIONS = [
  'プロ現場モード',
  'スピード見積モード',
  '要件壁打ちモード',
  '炎上案件モード',
];
export const LEVEL_OPTIONS = ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5'];
export const INDUSTRY_OPTIONS = [
  '美容サロン',
  '飲食店',
  '小売',
  '物流',
  '医療',
  '介護',
  '不動産',
  '製造業',
  '士業',
  '教育',
  'BtoB SaaS',
  'その他',
];

export async function getOrCreateDraft(caseId) {
  const existing = await db.drafts.where('caseId').equals(caseId).first();
  return existing || null;
}

export async function upsertDraft(caseId, draftAnswer) {
  const now = new Date().toISOString();
  const existing = await db.drafts.where('caseId').equals(caseId).first();
  if (existing) {
    await db.drafts.update(existing.id, { draftAnswer, updatedAt: now });
    return existing.id;
  }
  return await db.drafts.add({ caseId, draftAnswer, updatedAt: now });
}

export async function deleteDraft(caseId) {
  const existing = await db.drafts.where('caseId').equals(caseId).first();
  if (existing) await db.drafts.delete(existing.id);
}
