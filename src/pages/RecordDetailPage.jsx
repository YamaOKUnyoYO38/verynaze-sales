import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Pencil,
  Download,
  Save,
  X,
  FileText,
  MessageSquare,
  Star,
  Target,
  Layers,
  Clock3,
  Wrench,
  Coins,
  FileSignature,
  Trophy,
  Briefcase,
  Building2,
  AlertTriangle,
  ListChecks,
} from 'lucide-react';
import { db, RANK_OPTIONS } from '../db/db.js';
import SectionCard from '../components/SectionCard.jsx';
import TextAreaField from '../components/TextAreaField.jsx';
import SelectField from '../components/SelectField.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { rankColor } from '../utils/score.js';
import { formatDateTime } from '../utils/date.js';
import { downloadJson } from '../utils/exportJson.js';
import { useToast } from '../components/ToastProvider.jsx';

export default function RecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const row = await db.records.get(Number(id));
      setRecord(row || null);
      if (row) setForm({ ...row });
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="text-sm text-slate-500">読み込み中...</div>;
  }

  if (!record) {
    return (
      <div className="card p-6 text-center space-y-3">
        <p className="text-sm text-slate-600">記録が見つかりませんでした。</p>
        <Link to="/records" className="btn-outline inline-flex">
          <ArrowLeft size={14} /> 一覧へ戻る
        </Link>
      </div>
    );
  }

  const update = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    try {
      const scoreNum =
        form.score === '' || form.score === null || form.score === undefined
          ? null
          : Number.isNaN(Number(form.score))
          ? null
          : Number(form.score);
      const payload = {
        ...form,
        score: scoreNum,
        updatedAt: new Date().toISOString(),
      };
      await db.records.update(record.id, payload);
      setRecord(payload);
      setEditing(false);
      toast.success('変更を保存しました');
    } catch (e) {
      toast.error('保存に失敗しました');
    }
  };

  const handleDelete = async () => {
    setConfirmOpen(false);
    try {
      await db.records.delete(record.id);
      toast.success('記録を削除しました');
      navigate('/records');
    } catch (e) {
      toast.error('削除に失敗しました');
    }
  };

  const handleExport = () => {
    downloadJson(`record-${record.caseId}-${record.id}.json`, record);
    toast.success('JSONを書き出しました');
  };

  const r = editing ? form : record;

  return (
    <div className="space-y-4">
      <section className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-500">{r.caseId}</p>
          <h2 className="text-lg font-bold text-primaryDark truncate">
            {r.title}
          </h2>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="chip bg-primary-50 text-primary-700">{r.mode}</span>
            <span className="chip bg-slate-100 text-slate-700">{r.level}</span>
            <span className="chip bg-emerald-50 text-emerald-700">
              {r.industry}
            </span>
            <span className={['chip', rankColor(r.rank)].join(' ')}>
              ランク {r.rank || '-'}
            </span>
            <span className="chip bg-accent/30 text-primaryDark">
              スコア {r.score ?? '-'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            作成 {formatDateTime(r.createdAt)} / 更新{' '}
            {formatDateTime(r.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="btn-outline"
              >
                <Pencil size={14} /> 編集
              </button>
              <button onClick={handleExport} className="btn-ghost">
                <Download size={14} /> JSON
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="btn-danger"
              >
                <Trash2 size={14} /> 削除
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setForm({ ...record });
                  setEditing(false);
                }}
                className="btn-outline"
              >
                <X size={14} /> キャンセル
              </button>
              <button onClick={handleSave} className="btn-primary">
                <Save size={14} /> 保存
              </button>
            </>
          )}
        </div>
      </section>

      <SectionCard icon={Briefcase} title="お題">
        <Block label="クライアント属性" icon={Building2}>
          {r.clientProfile}
        </Block>
        <Block label="初回相談" icon={FileText}>
          {r.initialRequest}
        </Block>
        <Block label="制約" icon={AlertTriangle}>
          {Array.isArray(r.constraints)
            ? r.constraints.join(' / ')
            : r.constraints}
        </Block>
        <Block label="ミッション" icon={ListChecks}>
          {r.mission}
        </Block>
      </SectionCard>

      <SectionCard icon={FileText} title="自分の回答">
        {editing ? (
          <TextAreaField
            value={r.userAnswer}
            onChange={update('userAnswer')}
            rows={18}
            monospace
          />
        ) : (
          <Pre>{r.userAnswer}</Pre>
        )}
      </SectionCard>

      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard icon={MessageSquare} title="フィードバック">
          {editing ? (
            <TextAreaField
              value={r.feedback}
              onChange={update('feedback')}
              rows={8}
            />
          ) : (
            <Pre>{r.feedback}</Pre>
          )}
        </SectionCard>
        <SectionCard icon={Star} title="スコア・ランク" tone="accent">
          {editing ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">スコア (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input"
                    value={r.score ?? ''}
                    onChange={(e) => update('score')(e.target.value)}
                  />
                </div>
                <SelectField
                  label="ランク"
                  value={r.rank}
                  onChange={update('rank')}
                  options={RANK_OPTIONS}
                  placeholder="選択"
                />
              </div>
              <TextAreaField
                label="次回の重点課題"
                value={r.nextFocus}
                onChange={update('nextFocus')}
                rows={3}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primaryDark">
                {r.score ?? '-'}
                <span className="text-sm font-medium text-slate-500 ml-2">
                  / 100
                </span>
              </p>
              <span className={['chip', rankColor(r.rank)].join(' ')}>
                ランク {r.rank || '-'}
              </span>
              {r.nextFocus && (
                <div className="rounded-xl bg-accent/15 p-3 mt-2">
                  <p className="text-[11px] font-bold flex items-center gap-1 text-accent-dark">
                    <Target size={11} /> 次回の重点課題
                  </p>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                    {r.nextFocus}
                  </p>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        <ReviewBlock
          icon={Layers}
          title="技術スタックレビュー"
          field="techStackReview"
          editing={editing}
          value={r.techStackReview}
          onChange={update('techStackReview')}
        />
        <ReviewBlock
          icon={Wrench}
          title="使用ツールレビュー"
          field="toolsReview"
          editing={editing}
          value={r.toolsReview}
          onChange={update('toolsReview')}
        />
        <ReviewBlock
          icon={Clock3}
          title="納期・工数レビュー"
          field="scheduleReview"
          editing={editing}
          value={r.scheduleReview}
          onChange={update('scheduleReview')}
        />
        <ReviewBlock
          icon={Coins}
          title="費用感レビュー"
          field="costReview"
          editing={editing}
          value={r.costReview}
          onChange={update('costReview')}
        />
        <ReviewBlock
          icon={FileSignature}
          title="契約・責任範囲レビュー"
          field="contractReview"
          editing={editing}
          value={r.contractReview}
          onChange={update('contractReview')}
        />
        <ReviewBlock
          icon={Trophy}
          title="模範回答"
          field="modelAnswer"
          editing={editing}
          value={r.modelAnswer}
          onChange={update('modelAnswer')}
        />
      </div>

      <div className="card p-4 flex justify-between gap-2">
        <Link to="/records" className="btn-outline">
          <ArrowLeft size={14} /> 一覧へ戻る
        </Link>
        <button onClick={handleExport} className="btn-ghost">
          <Download size={14} /> このレコードをJSON書き出し
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="この記録を削除しますか？"
        description="削除した記録は元に戻せません。事前にJSONエクスポートをおすすめします。"
        confirmLabel="削除する"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function Block({ label, icon: Icon, children }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
        {Icon && <Icon size={11} />} {label}
      </p>
      <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
        {children || '-'}
      </p>
    </div>
  );
}

function Pre({ children }) {
  return (
    <pre className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed bg-slate-50 rounded-xl p-3 max-h-[28rem] overflow-auto font-mono">
      {children || '(未入力)'}
    </pre>
  );
}

function ReviewBlock({ icon, title, editing, value, onChange }) {
  return (
    <SectionCard icon={icon} title={title}>
      {editing ? (
        <TextAreaField value={value} onChange={onChange} rows={5} />
      ) : (
        <Pre>{value}</Pre>
      )}
    </SectionCard>
  );
}
