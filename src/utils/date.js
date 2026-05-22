export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const date = formatDate(value);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${date} ${h}:${min}`;
}

export function daysBetween(a, b) {
  const ms = 1000 * 60 * 60 * 24;
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return Math.round((db - da) / ms);
}

export function calcStreak(records) {
  if (!records || records.length === 0) return 0;
  const dates = new Set(
    records.map((r) => {
      const d = new Date(r.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const t = new Date(today);
    t.setDate(today.getDate() - i);
    if (dates.has(t.getTime())) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}
