export function averageScore(records) {
  const valid = (records || []).filter(
    (r) => typeof r.score === 'number' && !Number.isNaN(r.score)
  );
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

const RANK_ORDER = ['S', 'A', 'B', 'C', 'D', 'E'];

export function bestRank(records) {
  if (!records || records.length === 0) return '-';
  let best = null;
  for (const r of records) {
    if (!r.rank) continue;
    if (best === null) best = r.rank;
    else if (RANK_ORDER.indexOf(r.rank) < RANK_ORDER.indexOf(best)) best = r.rank;
  }
  return best || '-';
}

export function rankColor(rank) {
  switch (rank) {
    case 'S':
      return 'bg-accent text-primaryDark';
    case 'A':
      return 'bg-primary-100 text-primary-800';
    case 'B':
      return 'bg-emerald-100 text-emerald-700';
    case 'C':
      return 'bg-slate-100 text-slate-700';
    case 'D':
      return 'bg-orange-100 text-orange-700';
    case 'E':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-500';
  }
}
