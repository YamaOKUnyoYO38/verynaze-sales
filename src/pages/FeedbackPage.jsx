import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Database,
  MessageSquare,
  Star,
  Trophy,
  Target,
  Layers,
  Wrench,
  Clock3,
  Coins,
  FileSignature,
  CheckCircle2,
} from 'lucide-react';
import SectionCard from '../components/SectionCard.jsx';
import TextAreaField from '../components/TextAreaField.jsx';
import SelectField from '../components/SelectField.jsx';
import { db, deleteDraft, RANK_OPTIONS } from '../db/db.js';
import { getTodayCase } from '../data/sampleCases.js';
import { useToast } from '../components/ToastProvider.jsx';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const passedCase = location.state?.caseData || getTodayCase();
  const passedAnswer = location.state?.userAnswer || '';

  const [form, setForm] = useState({
    feedback: '',
    score: '',
    rank: '',
    nextFocus: '',
    techStackReview: '',
    toolsReview: '',
    scheduleReview: '',
    costReview: '',
    contractReview: '',
    modelAnswer: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!location.state?.userAnswer) {
      // ユーザーが直接フィードバック画面に来た場合、Exerciseに誘導
      // ただし強制ではなく、空状態のままでも入力できるよう許容する
    }
  }, [location.state]);

  const update = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));

  const persist = async () => {
    const now = new Date().toISOString();
    const scoreNum =
      form.score === '' || form.score === null
        ? null
        : Number.isNaN(Number(form.score))
        ? null
        : Number(form.score);
    const payload = {
      caseId: passedCase.caseId,
      title: passedCase.title,
      mode: passedCase.mode,
      level: passedCase.level,
      industry: passedCase.industry,
      clientProfile: passedCase.clientProfile,
      initialRequest: passedCase.initialRequest,
      constraints: passedCase.constraints,
      mission: passedCase.mission,
      userAnswer: passedAnswer,
      feedback: form.feedback,
      score: scoreNum,
      rank: form.rank,
      nextFocus: form.nextFocus,
      techStackReview: form.techStackReview,
      toolsReview: form.toolsReview,
      scheduleReview: form.scheduleReview,
      costReview: form.costReview,
      contractReview: form.contractReview,
      modelAnswer: form.modelAnswer,
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.records.add(payload);
    await deleteDraft(passedCase.caseId);
    return id;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persist();
      toast.success('記録に保存しました');
    } catch (e) {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndList = async () => {
    setSaving(true);
    try {
      await persist();
      toast.success('記録に保存しました');
      navigate('/records');
    } catch (e) {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard icon={Star} title="お題概要">
        <p className="text-[11px] text-slate-500">{passedCase.caseId}</p>
        <p className="font-bold text-primaryDark">{passedCase.title}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="chip bg-primary-50 text-primary-700">
            {passedCase.mode}
          </span>
          <span className="chip bg-slate-100 text-slate-700">
            {passedCase.level}
          </span>
          <span className="chip bg-emerald-50 text-emerald-700">
            {passedCase.industry}
          </span>
        </div>
      </SectionCard>

      <SectionCard icon={MessageSquare} title="あなたの回答">
        {passedAnswer ? (
          <pre className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed bg-slate-50 rounded-xl p-3 max-h-72 overflow-auto">
{passedAnswer}
          </pre>
        ) : (
          <p className="text-sm text-slate-500">
            演習画面から遷移してください。回答が読み込まれていません。
          </p>
        )}
      </SectionCard>

      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard icon={MessageSquare} title="クライアント視点の反応">
          <TextAreaField
            value={form.feedback}
            onChange={update('feedback')}
            rows={6}
            placeholder="AIが返したクライアント視点 / レジェンドSE総評 / 改善点などを貼り付け"
          />
        </SectionCard>
        <SectionCard icon={Star} title="採点表 / レビュー">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">スコア (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.score}
                onChange={(e) => update('score')(e.target.value)}
                className="input"
                placeholder="例: 78"
              />
            </div>
            <SelectField
              label="ランク"
              value={form.rank}
              onChange={update('rank')}
              options={RANK_OPTIONS}
              placeholder="選択"
            />
          </div>
          <TextAreaField
            label="次回の重点課題"
            value={form.nextFocus}
            onChange={update('nextFocus')}
            rows={3}
            placeholder="次回までに伸ばすポイント"
          />
        </SectionCard>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard icon={Layers} title="技術スタックレビュー">
          <TextAreaField
            value={form.techStackReview}
            onChange={update('techStackReview')}
            rows={5}
          />
        </SectionCard>
        <SectionCard icon={Wrench} title="使用ツールレビュー">
          <TextAreaField
            value={form.toolsReview}
            onChange={update('toolsReview')}
            rows={5}
          />
        </SectionCard>
        <SectionCard icon={Clock3} title="納期・工数レビュー">
          <TextAreaField
            value={form.scheduleReview}
            onChange={update('scheduleReview')}
            rows={5}
          />
        </SectionCard>
        <SectionCard icon={Coins} title="費用感レビュー">
          <TextAreaField
            value={form.costReview}
            onChange={update('costReview')}
            rows={5}
          />
        </SectionCard>
        <SectionCard icon={FileSignature} title="契約・責任範囲レビュー">
          <TextAreaField
            value={form.contractReview}
            onChange={update('contractReview')}
            rows={5}
          />
        </SectionCard>
        <SectionCard icon={Trophy} title="模範回答">
          <TextAreaField
            value={form.modelAnswer}
            onChange={update('modelAnswer')}
            rows={5}
          />
        </SectionCard>
      </div>

      <div className="card p-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() =>
            navigate('/exercise', {
              state: { userAnswer: passedAnswer },
            })
          }
          className="btn-outline justify-center"
        >
          <ArrowLeft size={14} /> 編集に戻る
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-ghost justify-center"
        >
          <Save size={14} /> 保存
        </button>
        <button
          type="button"
          onClick={handleSaveAndList}
          disabled={saving}
          className="btn-primary justify-center"
        >
          <CheckCircle2 size={14} /> 保存して記録一覧へ
          <Database size={14} />
        </button>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        <Target size={11} className="inline mr-1" />
        AIに採点してもらった結果をそのまま貼り付けると効率的です。
      </p>
    </div>
  );
}
