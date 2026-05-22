import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Target } from 'lucide-react';
import { formatDate } from '../utils/date.js';
import { rankColor } from '../utils/score.js';

export default function RecordCard({ record }) {
  return (
    <article className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-500">{record.caseId}</p>
          <h3 className="text-base font-bold text-primaryDark truncate">
            {record.title}
          </h3>
        </div>
        <span className={['chip', rankColor(record.rank)].join(' ')}>
          {record.rank || '-'}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {record.mode && (
          <span className="chip bg-primary-50 text-primary-700">{record.mode}</span>
        )}
        {record.level && (
          <span className="chip bg-slate-100 text-slate-700">{record.level}</span>
        )}
        {record.industry && (
          <span className="chip bg-emerald-50 text-emerald-700">
            {record.industry}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(record.createdAt)}
        </span>
        <span className="font-semibold text-primaryDark">
          スコア{' '}
          <span className="text-primary-700 text-base">
            {record.score ?? '-'}
          </span>
        </span>
      </div>

      {record.nextFocus && (
        <p className="flex items-start gap-1.5 text-xs text-slate-600 bg-accent/15 rounded-lg px-2.5 py-1.5">
          <Target size={12} className="mt-0.5 shrink-0 text-accent-dark" />
          <span className="line-clamp-2">{record.nextFocus}</span>
        </p>
      )}

      <Link
        to={`/records/${record.id}`}
        className="btn-outline w-full justify-center"
      >
        詳細を見る <ArrowRight size={14} />
      </Link>
    </article>
  );
}
