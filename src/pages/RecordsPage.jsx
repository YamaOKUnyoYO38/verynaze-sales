import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Database, Play, Filter } from 'lucide-react';
import {
  db,
  MODE_OPTIONS,
  LEVEL_OPTIONS,
  INDUSTRY_OPTIONS,
  RANK_OPTIONS,
} from '../db/db.js';
import RecordCard from '../components/RecordCard.jsx';
import SelectField from '../components/SelectField.jsx';

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    mode: '',
    level: '',
    industry: '',
    rank: '',
  });

  useEffect(() => {
    (async () => {
      const rows = await db.records.orderBy('createdAt').reverse().toArray();
      setRecords(rows);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (filters.mode && r.mode !== filters.mode) return false;
      if (filters.level && r.level !== filters.level) return false;
      if (filters.industry && r.industry !== filters.industry) return false;
      if (filters.rank && r.rank !== filters.rank) return false;
      if (!q) return true;
      const hay = `${r.title || ''} ${r.caseId || ''} ${r.industry || ''} ${
        r.mode || ''
      } ${r.nextFocus || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [records, query, filters]);

  const updateFilter = (key) => (value) =>
    setFilters((p) => ({ ...p, [key]: value }));

  const resetFilters = () => {
    setQuery('');
    setFilters({ mode: '', level: '', industry: '', rank: '' });
  };

  return (
    <div className="space-y-4">
      <section className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 text-primary-700">
            <Filter size={16} />
          </span>
          <h2 className="text-sm font-bold text-primaryDark">絞り込み</h2>
          <span className="ml-auto text-xs text-slate-500">
            {filtered.length} / {records.length} 件
          </span>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル / 案件ID / メモを検索"
            className="input pl-9"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <SelectField
            label="モード"
            value={filters.mode}
            onChange={updateFilter('mode')}
            options={MODE_OPTIONS}
            placeholder="すべて"
          />
          <SelectField
            label="レベル"
            value={filters.level}
            onChange={updateFilter('level')}
            options={LEVEL_OPTIONS}
            placeholder="すべて"
          />
          <SelectField
            label="業界"
            value={filters.industry}
            onChange={updateFilter('industry')}
            options={INDUSTRY_OPTIONS}
            placeholder="すべて"
          />
          <SelectField
            label="ランク"
            value={filters.rank}
            onChange={updateFilter('rank')}
            options={RANK_OPTIONS}
            placeholder="すべて"
          />
        </div>

        <div className="flex justify-end">
          <button onClick={resetFilters} className="btn-ghost text-xs">
            条件をリセット
          </button>
        </div>
      </section>

      {loading ? (
        <div className="card p-6 text-center text-slate-400 text-sm">
          読み込み中...
        </div>
      ) : records.length === 0 ? (
        <div className="card p-8 text-center space-y-3">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-700">
            <Database size={24} />
          </span>
          <p className="text-sm text-slate-600">
            まだ記録がありません。今日の演習から始めましょう。
          </p>
          <Link to="/exercise" className="btn-primary inline-flex">
            <Play size={14} /> 演習を始める
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-6 text-center text-sm text-slate-500">
          条件に一致する記録がありません。
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <RecordCard key={r.id} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}
