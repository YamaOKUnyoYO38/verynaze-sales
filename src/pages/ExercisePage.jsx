import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Save,
  ArrowRight,
  FileText,
  Briefcase,
  Target,
  ListChecks,
  AlertTriangle,
  Building2,
  Tag,
} from 'lucide-react';
import { db, getOrCreateDraft, upsertDraft } from '../db/db.js';
import { getTodayCase, ANSWER_TEMPLATE } from '../data/sampleCases.js';
import SectionCard from '../components/SectionCard.jsx';
import TextAreaField from '../components/TextAreaField.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function ExercisePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const todayCase = getTodayCase();

  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const incoming = location.state?.userAnswer;
      if (incoming) {
        setAnswer(incoming);
      } else {
        const draft = await getOrCreateDraft(todayCase.caseId);
        setAnswer(draft?.draftAnswer || ANSWER_TEMPLATE);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await upsertDraft(todayCase.caseId, answer);
      toast.success('下書きを保存しました');
    } catch (e) {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleGoFeedback = async () => {
    await upsertDraft(todayCase.caseId, answer);
    navigate('/feedback', {
      state: { caseData: todayCase, userAnswer: answer },
    });
  };

  const handleQuickSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const id = await db.records.add({
        caseId: todayCase.caseId,
        title: todayCase.title,
        mode: todayCase.mode,
        level: todayCase.level,
        industry: todayCase.industry,
        clientProfile: todayCase.clientProfile,
        initialRequest: todayCase.initialRequest,
        constraints: todayCase.constraints,
        mission: todayCase.mission,
        userAnswer: answer,
        feedback: '',
        score: null,
        rank: '',
        nextFocus: '',
        techStackReview: '',
        toolsReview: '',
        scheduleReview: '',
        costReview: '',
        contractReview: '',
        modelAnswer: '',
        createdAt: now,
        updatedAt: now,
      });
      toast.success('回答を記録に保存しました');
      navigate(`/records/${id}`);
    } catch (e) {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <SectionCard icon={Briefcase} title="案件情報">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Field icon={Tag} label="案件ID" value={todayCase.caseId} />
          <Field icon={FileText} label="モード" value={todayCase.mode} />
          <Field icon={Target} label="レベル" value={todayCase.level} />
          <Field icon={Building2} label="業界" value={todayCase.industry} />
        </div>
        <div className="rounded-xl bg-primary-50 border border-primary-100 p-3">
          <p className="text-[11px] font-bold text-primary-700">案件タイトル</p>
          <p className="font-bold text-primaryDark">{todayCase.title}</p>
        </div>
      </SectionCard>

      <SectionCard icon={Building2} title="クライアント属性">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {todayCase.clientProfile}
        </p>
      </SectionCard>

      <SectionCard icon={FileText} title="初回相談">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {todayCase.initialRequest}
        </p>
      </SectionCard>

      <SectionCard icon={AlertTriangle} title="制約条件" tone="accent">
        <ul className="space-y-1.5">
          {todayCase.constraints.map((c) => (
            <li
              key={c}
              className="flex items-start gap-2 text-sm text-slate-700"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-dark shrink-0" />
              {c}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={ListChecks} title="ミッション">
        <p className="text-sm text-slate-700 leading-relaxed">
          {todayCase.mission}
        </p>
      </SectionCard>

      <SectionCard icon={FileText} title="あなたの回答">
        <TextAreaField
          value={answer}
          onChange={setAnswer}
          rows={20}
          monospace
          hint="テンプレートに沿って回答を書いてください。下書きはいつでも保存できます。"
        />
        <div className="grid gap-2 sm:grid-cols-3 pt-1">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="btn-outline justify-center"
          >
            <Save size={14} /> 下書き保存
          </button>
          <button
            type="button"
            onClick={handleQuickSave}
            disabled={saving}
            className="btn-ghost justify-center"
          >
            <Save size={14} /> 記録に保存
          </button>
          <button
            type="button"
            onClick={handleGoFeedback}
            disabled={saving}
            className="btn-primary justify-center"
          >
            フィードバック入力へ <ArrowRight size={14} />
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] text-slate-500 flex items-center gap-1">
        {Icon && <Icon size={10} />} {label}
      </p>
      <p className="font-semibold text-primaryDark text-sm truncate">{value}</p>
    </div>
  );
}
