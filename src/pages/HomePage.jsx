import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  BookOpen,
  TrendingUp,
  Trophy,
  Flame,
  Target,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { db } from '../db/db.js';
import { getTodayCase } from '../data/sampleCases.js';
import { calcStreak, formatDate } from '../utils/date.js';
import { averageScore, bestRank } from '../utils/score.js';
import StatCard from '../components/StatCard.jsx';
import RecordCard from '../components/RecordCard.jsx';

export default function HomePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const todayCase = getTodayCase();

  useEffect(() => {
    (async () => {
      const rows = await db.records.orderBy('createdAt').reverse().toArray();
      setRecords(rows);
      setLoading(false);
    })();
  }, []);

  const recent = records.slice(0, 3);
  const latestNextFocus = records.find((r) => r.nextFocus)?.nextFocus;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl p-5 bg-gradient-to-br from-primaryDark via-primary-800 to-primary text-white shadow-card">
        <p className="text-[11px] tracking-widest text-accent font-semibold">
          REQUIREMENT QUEST
        </p>
        <h2 className="mt-1 text-xl font-bold leading-snug">
          要件定義クエスト
        </h2>
        <p className="mt-1 text-xs text-slate-200">
          プロ現場準拠のSE要件定義トレーニング
        </p>

        <div className="mt-4 rounded-xl bg-white/10 border border-white/15 p-3 backdrop-blur">
          <p className="text-[11px] text-accent font-bold flex items-center gap-1">
            <Sparkles size={12} /> 今日のお題
          </p>
          <p className="mt-1 font-bold">{todayCase.title}</p>
          <p className="mt-1 text-[11px] text-slate-200">
            {todayCase.caseId} / {todayCase.mode} / {todayCase.level} /{' '}
            {todayCase.industry}
          </p>
        </div>

        <Link to="/exercise" className="btn-accent w-full mt-4 justify-center">
          <Play size={16} /> 今日の演習を始める
        </Link>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={BookOpen}
          label="総演習数"
          value={records.length}
          unit="件"
        />
        <StatCard
          icon={TrendingUp}
          label="平均スコア"
          value={averageScore(records)}
        />
        <StatCard
          icon={Trophy}
          label="最高ランク"
          value={bestRank(records)}
          accent
        />
        <StatCard
          icon={Flame}
          label="継続日数"
          value={calcStreak(records)}
          unit="日"
        />
      </section>

      {latestNextFocus && (
        <section className="card p-4 border-l-4 border-accent">
          <div className="flex items-start gap-2">
            <Target size={18} className="text-accent-dark mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-slate-500">
                次回の重点課題
              </p>
              <p className="text-sm text-primaryDark mt-0.5 leading-relaxed">
                {latestNextFocus}
              </p>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-primaryDark">最近の記録</h3>
          <Link
            to="/records"
            className="text-xs text-primary-700 font-semibold flex items-center gap-1"
          >
            すべて見る <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="card p-6 text-center text-slate-400 text-sm">
            読み込み中...
          </div>
        ) : recent.length === 0 ? (
          <div className="card p-6 text-center space-y-2">
            <p className="text-sm text-slate-500">まだ記録がありません</p>
            <Link to="/exercise" className="btn-primary inline-flex">
              <Play size={14} /> 最初の演習を始める
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map((r) => (
              <RecordCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </section>

      {records.length > 0 && (
        <p className="text-center text-[11px] text-slate-400">
          最終更新: {formatDate(records[0]?.updatedAt || records[0]?.createdAt)}
        </p>
      )}
    </div>
  );
}
