# X自動運用OS 実行計画書（Claude Code実装前提）

- 作成日: 2026-07-03
- 対象: Xアカウントの半自動運用システム（市場調査 → 投稿案生成 → 人間承認 → 投稿 → 分析）
- 実装者: Claude Code
- 方針: **完全自動化はしない。品質最優先。X規約・API制限を遵守。低コストで開始し段階拡張。**

---

## 1. 結論

### 1-1. 最初に作るべきX運用OSの全体像

「予約投稿Bot」ではなく、**「毎日リサーチして投稿案を提案してくる編集部AI」** を作る。

```
[定時実行: GitHub Actions]
        │
        ▼
① 収集モジュール（RSS / Reddit / Zenn / Qiita / YouTube / Google News）
        │  生データを SQLite + JSONL に保存
        ▼
② 調査モジュール（Claude API）
        │  伸びテーマ・未言語化の切り口・海外未翻訳情報を抽出 → research_notes
        ▼
③ 生成モジュール（Claude API）
        │  投稿型テンプレに沿って下書きを複数生成 → drafts/*.md
        ▼
④ 品質評価モジュール（Claude API・別プロンプト）
        │  新規性/実用性/根拠/炎上リスクをスコアリング。閾値未満は破棄
        ▼
⑤ 通知モジュール（Discord Webhook）
        │  下書きカードを人間に送付
        ▼
⑥ 人間承認（下書きファイルの status を approved に変更 / 修正して approve）
        │
        ▼
⑦ 投稿モジュール（X API v2 write）承認済みのみ投稿
        │
        ▼
⑧ 分析モジュール（投稿メトリクス記録 → 投稿型ごとの勝ちパターン学習 → ②③のプロンプトへ反映）
```

- **人間が触るのは⑥だけ**。1日5〜10分で「承認/修正/却下」する。
- 全データはGitリポジトリに残る（下書き・却下理由・メトリクス）。Claude Codeが後から読める＝改善ループが回る。

### 1-2. 半自動から始めるべき理由

1. **X規約**: Xの自動化ルールは「スパム的・大量・重複投稿」「自動エンゲージメント（いいね/フォロー/リプ連打）」を明確に禁止している。「人間が承認した投稿の自動送信」は予約投稿と同等で規約上安全側。
2. **品質**: LLMの生成品質は分散が大きい。承認ゲートがないと「凡庸な投稿」が流れてアカウントの信頼が毀損する。フォロワー0〜1000の初期は1投稿の重みが大きい。
3. **学習データ**: 人間の承認/却下/修正ログこそが最良の教師データ。完全自動化は「何が良い投稿か」をシステムが学んだ後（早くて3ヶ月後）に検討すべき。
4. **API制限**: X API無料枠のwrite上限は少ない（枠は変動するため実装時に要確認）。承認制なら投稿数が自然に絞られ、制限内に収まる。

### 1-3. 最初に選ぶべきアカウントコンセプト

**候補1「AI活用・Claude Code・自動化の実践ログ系」を主軸に、候補3の「失敗ログ共有」を差別化フォーマットとして取り込む。**

理由は §2 の比較表参照。一言で言うと:
- このシステム自体が最強のネタ供給源になる（「X運用OSを作る過程」を投稿できる＝ドッグフーディング）
- 市場調査モジュールとの相性が全候補中で最高（英語圏の一次情報が豊富、RSS/Redditで機械収集しやすい）
- 「動いたこと」より「ハマったこと・失敗したこと」を出すことで、レビュー記事系アカウントと差別化できる

---

## 2. アカウント設計

### 2-1. コンセプト候補の比較

評価: ◎=強い / ○=普通 / △=弱い

| 観点 | 1. AI活用・Claude Code実践ログ | 2. note/ブログ市場調査研究ログ | 3. AI画像生成・失敗ログ | 4. 地方・小規模事業者向けAI | 5. 萌え・創作×AI実験 |
|---|---|---|---|---|---|
| 伸びやすさ | ◎ 検索・回遊需要が最大 | ○ 副業層に需要大だが飽和気味 | ○ ビジュアルで伸びるが単発 | △ 母数が少ない | ○ 二次拡散は強いが不安定 |
| 差別化しやすさ | ○ 競合多いが「失敗ログ×自動化」の切り口は空いている | △ 「稼げる系」に埋もれやすい | ○ 失敗共有は珍しい | ◎ ほぼ空白地帯 | △ 規約・権利で攻めにくい |
| ネタの継続性 | ◎ 毎週新ツール・新モデルが出る | ○ 調査すれば無限だが手間大 | △ 画像生成の話題は波がある | ○ 事例が細く長く続く | △ 権利面で使える題材が限られる |
| 収益化しやすさ | ◎ note教材・受託開発・案件直結 | ◎ 有料note文化と直結 | ○ 素材販売・講座 | ◎ 単価の高い受託に直結（ただし件数少） | △ 収益導線が細い |
| 炎上リスク | 低（誇張しなければ） | 中（「稼げる」と言うと荒れる） | **高**（AI絵の権利論争に巻き込まれる） | 低 | **高**（絵師界隈との摩擦） |
| 実装しやすさ | ◎ テキスト中心 | ◎ テキスト中心 | △ 画像パイプラインが必要 | ○ | △ 画像必須 |
| 市場調査との相性 | ◎ RSS/Reddit/HN/Zennで機械収集可能 | ○ note/ブログはスクレイピング規約に注意 | ○ | △ 一次情報がWebに少ない | △ |
| 投稿例 | 「Claude CodeにX運用Botを作らせて3日目。承認フローで詰まった点3つ」 | 「note有料記事タイトル100本を分類したら売れてる型は4つだった」 | 「広告画像のAI修正、この指示だと破綻する（比較画像）」 | 「実家の酒屋の在庫表をAIで自動化した記録」 | 「キャラ設定シートをLLMに渡して一貫性を保つ実験」 |

### 2-2. 推奨コンセプト（候補1＋失敗ログ軸）

**「AI自動化を実際に作って、失敗込みで検証ログを公開するアカウント」**

- ポジション: レビュアーでもインフルエンサーでもなく「実験台」
- 一次情報 = 自分の実装ログ。市場調査は「何を実験するか」の選定に使う
- 候補2（note市場調査）は3ヶ月後のサブテーマとして温存（このシステムの調査モジュールを流用できる）

### 2-3. アカウント設計詳細

| 項目 | 内容 |
|---|---|
| アカウント名案 | 「ナゼ｜AI自動化の実験ログ」「○○｜Claude Codeで作って壊す人」「AI検証ログ（毎日1実験）」※本名不要。覚えやすい2〜4文字のハンドル＋役割の説明 |
| プロフィール文案 | 「Claude Code / LLM APIで業務自動化を毎日実験。うまくいった手順と、失敗した原因をそのまま公開します。現在: X運用の半自動化OSを開発中（過程は全部ポスト）。詳細な手順はnoteに → リンク」 |
| 固定ポスト案 | スレッド:「AI自動化を100日実験するアカウントです。①何をやるか ②なぜ失敗込みで公開するか ③これまでのベスト3実験（リンク） ④noteで手順を全公開」※実績が溜まるまでは「宣言＋実験リスト」でよい。30日ごとに更新 |
| 投稿ジャンル | 検証ログ / 失敗ログ / 手順のチェックリスト / 海外情報の翻訳＋自分の検証 / ツール比較（実測ベース） / 開発中システムの進捗 |
| 投稿しないジャンル | 「AIで月○万円」系の煽り / 未検証の伝聞レビュー / トレンド便乗だけの投稿 / 政治・宗教・炎上中の話題 / 他人の失敗を晒す内容 / AI生成画像の権利論争への参戦 |
| 想定読者 | ①非エンジニアだがAI自動化を試したい副業層 ②駆け出しエンジニア・情シス ③note/ブログ運営者で作業を自動化したい人 |
| フォロワーが増える導線 | 検証ログ単発 →「続きが気になる」→ 固定ポストのスレッド → フォロー。プロフィールに「毎日1実験」と頻度を明記し、フォローする理由（=定期的な実用情報）を作る |
| 収益導線 | ①無料検証ログ（X）→ ②手順の完全版（無料note）→ ③テンプレ・コード付き有料note → ④「同じ仕組みを作ってほしい」個別相談・受託。**最初の60日は売らない**（信頼残高を先に作る） |

---

## 3. 市場調査設計

### 3-1. 情報源と頻度

| 頻度 | 情報源 | 取得方法 | 目的 |
|---|---|---|---|
| 毎日 | Zenn（AI/LLMトピックfeed）、Qiitaタグfeed、はてなブックマーク テクノロジー、Google News RSS（キーワード指定）、Reddit r/ClaudeAI, r/LocalLLaMA, r/ChatGPT（公開JSON）、Hacker News（Algolia API） | RSS / 公開API | 今日動いた話題の把握、海外初出情報の検知 |
| 毎日 | 自分のX通知・リプ（手動5分） | 手動 | 読者の疑問=次のネタ |
| 週1 | 競合アカウント10件の直近投稿（手動閲覧＋所感をメモ化）、YouTube該当チャンネルRSS、Anthropic/OpenAI/Google公式ブログ | RSS＋手動 | 投稿型・切り口のトレンド分析 |
| 週1 | note人気記事（AI・自動化タグ）※閲覧は手動、所感を`research/`にメモ | 手動 | 有料化されているテーマ=需要の証明 |
| 月1 | X APIの料金・規約ページ、各LLMの料金表、GitHub Trending（月間） | 手動＋WebFetch | 前提条件の変化検知、システム自体の見直し |

> スクレイピング方針: **RSS・公式API・公開JSONエンドポイントのみ使う**。robots.txtやサービス規約で禁止されているクロールはしない。noteやXのWebページの機械的スクレイピングは行わず、手動閲覧＋メモで代替する。

### 3-2. 調査キーワード例

- 日本語: `Claude Code 活用`, `LLM 業務自動化`, `AIエージェント 事例`, `プロンプト 失敗`, `GPTs 作り方`, `RAG 精度`, `X運用 自動化`, `note AI 書き方`
- 英語（海外先行情報の発掘）:
  - `site:reddit.com claude code workflow`
  - `"claude code" tips OR pitfalls after:2026-06-01`
  - `LLM agent production lessons learned`
  - `"I automated" twitter OR X posting site:news.ycombinator.com`
  - `prompt engineering deprecated OR outdated 2026`
- 判定用の観点キーワード: `失敗`, `ハマった`, `やめた`, `比較してみた`, `結局`, `注意点` （←体験談シグナル。これが付く記事は一次情報率が高い）

### 3-3. 競合アカウント分析の観点

1. 投稿頻度と時間帯
2. 伸びている投稿の**型**（スレッド/箇条書き/画像付き/断言型…）
3. 伸びている投稿の**テーマ**（ツール紹介/手順/意見…）
4. 扱って**いない**テーマ（=空白地帯）
5. リプ欄の質問（=満たされていない需要）
6. 収益導線の作り方（固定ポスト・プロフィールリンク）

### 3-4. 「一般情報」と「希少情報」の判定基準

| 判定 | 基準 | 例 |
|---|---|---|
| 一般情報（不採用） | 公式ドキュメントの言い換え / 「〜がすごい」だけ / 検索1ページ目に同内容が3件以上 | 「Claude Codeとは？使い方まとめ」 |
| 準希少（要加工） | 海外では既出だが日本語圏で未言及 / 複数ソースの比較で初めて見える差分 | Redditで議論されている運用Tipsの翻訳＋自分の検証 |
| 希少情報（採用） | ①自分で実行した結果（数値・スクショ・失敗込み） ②複数ソースを突き合わせて初めて言えること ③「みんなやってるが誰も言語化していない」観察 | 「投稿承認フローを3方式で作って比較したら、Discordボタンは通知疲れで破綻した」 |

**運用ルール: 「未公開情報・内部情報・真偽不明の噂」は希少情報ではなく排除対象。** 出典が2つ未満の伝聞は投稿しない（自分の実測は出典1つで可）。

---

## 4. 投稿生成ロジック

### 4-1. 投稿ネタの分類（type フィールドとしてDBに持つ）

| type | 内容 | 頻度目安 |
|---|---|---|
| `experiment_log` | 検証ログ（やった→結果→学び） | 週3〜4 |
| `failure_log` | 失敗談（症状→原因→回避策） | 週2 |
| `checklist` | チェックリスト・手順 | 週1〜2 |
| `comparison` | 実測ベースの比較 | 週1 |
| `translation_insight` | 海外情報＋自分の見解・検証 | 週1〜2 |
| `thread` | スレッド（上記の深掘り版） | 週1 |
| `contrarian` | 逆張り（根拠必須。乱発禁止） | 月2まで |
| `progress` | 開発進捗・所感 | 随時 |

### 4-2. 投稿テンプレート

**検証ログ型（experiment_log）**
```
【検証】{やったこと}を試した

やり方: {1行}
結果: {数値 or 事実}
意外だった点: {1つ}
結論: {誰に有効か / どこまで信用できるか}

{条件・環境の注記}
```

**失敗ログ型（failure_log）**
```
{やろうとしたこと}で{時間}溶かした話

症状: {何が起きたか}
原因: {調べて分かったこと}
回避策: {次からどうするか}

同じことする人は{一言の注意}だけ覚えておくと安全です
```

**チェックリスト型（checklist）**
```
{作業}を始める前に確認する{N}項目

1. {項目}
2. {項目}
...

{N+1}個目は「{意外な一項目}」。これで一度失敗しました
```

**スレッド構成テンプレート（thread）**
```
1投目: 結論＋数字＋「詳細は下に」（フックだが誇張しない）
2投目: 前提条件・環境（信頼性の担保）
3〜5投目: 本体（1投=1論点。スクショや数値を添える）
6投目: 失敗した点・限界（ここが差別化）
7投目: まとめ＋「試す人向けの最初の一歩」＋（あれば）note誘導
```

### 4-3. 炎上しにくい言い回し / 避けるべき表現

| 避ける | 言い換える |
|---|---|
| 「〜は終わった」「〜はオワコン」 | 「〜の用途では選ばなくなった。理由は…」 |
| 「絶対」「100%」「誰でも」 | 「自分の環境では」「この条件なら」 |
| 「エンジニア不要」「〜な人はヤバい」 | （職業・属性への断定は書かない） |
| 「稼げる」「月○万円」 | 「〜の作業が○時間短縮できた」 |
| 出典なしの「らしい」「という噂」 | 出典リンク明記 or 投稿しない |
| 他人の失敗事例の引用 | 自分の失敗に置き換える |

**機械チェック（品質評価モジュールで自動検出する語）**: `絶対`, `100%`, `誰でも`, `オワコン`, `終わった`, `不要になる`, `稼げる`, `らしい（出典なし）`, `神`, `最強`

---

## 5. システム構成

### 5-1. 技術スタック比較と決定

**言語**

| | Python | TypeScript |
|---|---|---|
| RSS/API処理 | ◎ feedparser等が枯れている | ○ |
| LLM SDK | ◎ anthropic SDK | ◎ |
| Claude Codeの実装しやすさ | ◎ 短く書ける | ○ |
| 判定 | **採用** | Workers移行時に検討 |

**実行環境**

| | GitHub Actions | Cloudflare Workers | Render/Railway | VPS | ローカルPC |
|---|---|---|---|---|---|
| 費用 | プライベートリポでも無料枠2,000分/月で十分 | 無料枠あり | 有料寄り | 有料 | 無料 |
| cron | ◎ schedule trigger | ◎ | ○ | ○ | △ PC起動依存 |
| 秘密情報管理 | ◎ Secrets | ○ | ○ | △ 自前 | △ |
| データ永続化 | ○ リポジトリにコミット | △ KV/D1が必要 | ○ | ◎ | ◎ |
| Claude Codeとの親和性 | ◎ **リポジトリ=DB=作業場が一体** | △ | ○ | ○ | ○ |
| 判定 | **採用** | 拡張期 | — | — | 開発時のみ |

**DB**

| | SQLite | Supabase | PostgreSQL | Google Sheets |
|---|---|---|---|---|
| 費用 | 0円 | 無料枠あり | 有料寄り | 0円 |
| GitHub Actionsとの相性 | ◎ ファイルをコミットするだけ | ○ | △ | ○ |
| Claude Codeが読み書きしやすいか | ◎ | ○ | ○ | △ API経由 |
| 判定 | **採用**（メトリクス・調査データ）＋**下書きはMarkdown+YAML frontmatter**（人間が読める形式） | 拡張期 | — | — |

**承認画面**

| | Discord | Slack | Notion | Google Sheets | 簡易Web |
|---|---|---|---|---|---|
| 構築コスト | ◎ Webhook1本で通知可 | ○ | ○ | ○ | △ 開発必要 |
| 承認操作 | ボタン化はBot常駐が必要（MVPでは重い） | 同左 | DB更新をポーリング | セル編集 | ◎ だが工数大 |
| 判定 | **通知=Discord Webhook採用**。**承認操作=リポジトリ内の下書きファイルの `status` を編集**（GitHubのWeb/スマホUIで編集→コミット）。Botボタン承認はPhase 6以降 | | | | |

**LLM**

| | Claude API | OpenAI API | Gemini API | ローカルLLM |
|---|---|---|---|---|
| 日本語の投稿文品質 | ◎ | ○ | ○ | △ |
| Claude Codeとの一貫性 | ◎ 同じプロンプト資産を流用可 | △ | △ | △ |
| コスト設計 | 収集要約=Haiku 4.5（安価）/ 生成・評価=Sonnet 5 | | 無料枠は魅力だが分散管理コスト | 運用が本業化する |
| 判定 | **採用**（`claude-haiku-4-5-20251001` で要約・分類、`claude-sonnet-5` で生成・評価） | — | — | — |

**画像・図解生成（後から追加する場合）**: `renderers/` モジュールとして分離。まずは matplotlib/Pillow でテキスト図解カード（比較表・チェックリストのPNG化）→ 需要が出たら画像生成APIを検討。生成AIイラストはコンセプト上不要（炎上リスク回避）。

**→ 初期版の推奨構成（1つに絞る）**

> **Python 3.12 + GitHub Actions (cron) + SQLite（メトリクス）+ Markdown下書き（承認対象）+ Discord Webhook（通知）+ Claude API（Haiku/Sonnet併用）+ X API v2（writeのみ）**
>
> 月額コスト目安: Claude API 数百円〜1,500円程度（1日3回実行・下書き5本想定）。それ以外は0円。

### 5-2. ディレクトリ構成

```
x-ops/
├── README.md
├── pyproject.toml            # uv管理。依存: anthropic, feedparser, httpx, tweepy, pyyaml, python-frontmatter
├── .env.example
├── .github/
│   └── workflows/
│       ├── morning_research.yml   # 毎朝 07:00 JST
│       ├── noon_drafting.yml      # 昼 11:30 JST
│       ├── publish.yml            # 承認コミットを検知して投稿（push trigger + 定時）
│       └── nightly_analytics.yml  # 夜 22:00 JST
├── config/
│   ├── sources.yaml          # RSS/APIソース定義（url, category, lang, weight）
│   ├── account.yaml          # アカウント設計（コンセプト・NGジャンル・想定読者）→ プロンプトに注入
│   ├── templates.yaml        # §4の投稿テンプレート
│   └── quality_rules.yaml    # NGワード・スコア閾値・1日の最大下書き数
├── src/xops/
│   ├── __init__.py
│   ├── cli.py                # `xops collect|research|draft|review|notify|publish|analyze`
│   ├── collect/
│   │   ├── rss.py            # feedparserでRSS収集
│   │   ├── reddit.py         # 公開JSON（.json付きURL, User-Agent明示, rate limit遵守）
│   │   ├── hackernews.py     # Algolia API
│   │   └── dedupe.py         # URL正規化＋タイトル類似で重複排除
│   ├── research/
│   │   ├── summarize.py      # Haikuで各記事を要約・分類・希少度仮判定
│   │   └── analyze.py        # Sonnetで横断分析 → research_notes生成
│   ├── generate/
│   │   ├── drafter.py        # research_notes + templates → 下書きMarkdown生成
│   │   └── scorer.py         # 品質評価（別プロンプト・別呼び出しで自己採点バイアス低減）
│   ├── approve/
│   │   ├── notifier.py       # Discord Webhookへ下書きカード送信
│   │   └── queue.py          # drafts/ の status 遷移管理
│   ├── publish/
│   │   ├── x_client.py       # tweepy薄ラッパ。dry-runモード必須
│   │   └── poster.py         # approved → 投稿 → posted へ遷移、tweet_id記録
│   ├── analytics/
│   │   ├── fetch_metrics.py  # 自分の投稿のメトリクス取得（API枠内）or 手動CSV取込
│   │   └── report.py         # 型別集計 → insights生成 → Discord送信
│   └── common/
│       ├── db.py             # SQLite接続・マイグレーション
│       ├── llm.py            # Claude API呼び出し（リトライ・コスト記録）
│       └── logging.py
├── prompts/
│   ├── summarize.md
│   ├── research.md
│   ├── draft.md
│   ├── score.md
│   └── improve.md            # 分析結果からプロンプト改善案を出す
├── data/
│   ├── xops.db               # SQLite（コミット対象）
│   └── raw/2026-07-03.jsonl  # 収集生データ（日別）
├── research/
│   └── 2026-07-03.md         # その日のresearch_notes（人間も読む）
├── drafts/
│   ├── 2026-07-03-a1.md      # 下書き（YAML frontmatter + 本文）
│   └── ...
├── posted/                    # 投稿済みアーカイブ（drafts から移動）
├── rejected/                  # 却下アーカイブ（却下理由付き）
└── tests/
    ├── test_dedupe.py
    ├── test_scorer_rules.py   # NGワード検出のユニットテスト
    └── test_publish_dryrun.py
```

### 5-3. 下書きファイル形式（承認の単位）

```markdown
---
id: 2026-07-03-a1
created_at: 2026-07-03T11:30:00+09:00
type: failure_log            # §4-1の分類
status: pending              # pending → approved / rejected / posted / failed
scores: {novelty: 4, utility: 5, specificity: 4, risk: 1, evidence: 5, total: 18}
sources:
  - https://example.com/source1
  - https://example.com/source2
target_reader: 非エンジニアの自動化入門者
intent: 承認フロー設計の落とし穴を共有し、開発ログ系読者のフォローを獲得
cta: none                    # none / fixed_post / note_link
note_candidate: true         # note記事に展開できるか
reject_reason: null          # 却下時に人間が記入（改善ループの教師データ）
tweet_id: null
---
GitHub ActionsでX投稿の承認フローを作ったら、最初の設計を2回捨てた話

症状: Discordのボタン承認は常駐Botが必要で、無料枠設計が崩壊
原因: Webhookは「送る」だけで「受ける」ができない
回避策: 承認はGit上のファイル編集に寄せて、通知だけDiscordにした

サーバーレスで承認フローを作る人は「双方向が必要か」を最初に確認すると安全です
```

### 5-4. DBテーブル設計（SQLite）

```sql
-- 収集した記事・投稿
CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  source TEXT NOT NULL,          -- sources.yaml のキー
  lang TEXT,                     -- ja / en
  published_at TEXT,
  collected_at TEXT NOT NULL,
  summary TEXT,                  -- Haiku要約
  category TEXT,                 -- ai_tools / llm_ops / sns_growth / ...
  rarity_hint INTEGER,           -- 1-5 希少度仮判定
  raw_path TEXT                  -- data/raw/ 内の位置
);

-- 日次リサーチノート
CREATE TABLE research_notes (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  theme TEXT NOT NULL,           -- 抽出テーマ
  angle TEXT,                    -- 切り口
  rarity INTEGER,                -- 1-5
  evidence_urls TEXT,            -- JSON配列
  note TEXT,                     -- 本文（Markdown）
  used_in_draft TEXT             -- 採用された下書きid
);

-- 下書き（frontmatterのインデックス。実体はMarkdown）
CREATE TABLE drafts (
  id TEXT PRIMARY KEY,           -- 2026-07-03-a1
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  score_total INTEGER,
  created_at TEXT NOT NULL,
  decided_at TEXT,
  reject_reason TEXT,
  tweet_id TEXT
);

-- 投稿メトリクス（時系列で複数回記録）
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY,
  tweet_id TEXT NOT NULL,
  draft_id TEXT,
  captured_at TEXT NOT NULL,
  impressions INTEGER, likes INTEGER, reposts INTEGER,
  bookmarks INTEGER, replies INTEGER, profile_clicks INTEGER,
  follows_delta INTEGER          -- 取得できる範囲で
);

-- 分析から得た知見（プロンプトへ反映する運用資産）
CREATE TABLE insights (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  finding TEXT NOT NULL,         -- 例: failure_log型はimpあたりbookmark率が2.3倍
  action TEXT,                   -- 例: failure_logの生成比率を上げる
  applied INTEGER DEFAULT 0
);

-- API利用・コスト記録
CREATE TABLE api_usage (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  provider TEXT NOT NULL,        -- anthropic / x
  endpoint TEXT,
  tokens_in INTEGER, tokens_out INTEGER,
  cost_usd REAL,
  status TEXT                    -- ok / rate_limited / error
);
```

### 5-5. 環境変数一覧（GitHub Secrets）

| 変数 | 用途 | 備考 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API | |
| `X_API_KEY` / `X_API_SECRET` | X API アプリ認証 | |
| `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` | 投稿ユーザー認証（OAuth 1.0a） | writeに必要 |
| `DISCORD_WEBHOOK_URL` | 下書き通知・分析レポート | |
| `XOPS_DRY_RUN` | `1`なら投稿せずログのみ | **デフォルト1** |
| `XOPS_MAX_POSTS_PER_DAY` | 投稿上限（デフォルト3） | 暴走防止 |

### 5-6. 外部API一覧と制限対策

| API | 用途 | 制限・注意 |
|---|---|---|
| X API v2 `POST /2/tweets` | 投稿 | 無料枠のwrite上限は少なく変動するため、実装時に開発者ポータルで確認。`XOPS_MAX_POSTS_PER_DAY`で自衛 |
| X API v2 メトリクス取得 | 分析 | 無料枠ではread不可の可能性が高い。**MVPはXアナリティクスの手動CSVエクスポート取込で代替** |
| Claude API | 要約・分析・生成・評価 | api_usageにコスト記録。日次上限（例: $1/日）超過で当日の生成をスキップ |
| RSS各種 | 収集 | User-Agent明示。取得間隔を空ける |
| Reddit 公開JSON | 収集 | 60req/min以下・UA明示。ダメなら公式API(OAuth)へ |
| HN Algolia API | 収集 | 制限緩い |

### 5-7. エラーハンドリング / ログ方針

- **原則: 1モジュールの失敗で全体を止めない。** 収集ソースの1つが死んでいても残りで続行し、Discordに警告を1行送る。
- X API 429/403: 投稿を中止し、下書きは `approved` のまま保持（次回実行で再試行）。**指数バックオフでの連打はしない**（規約リスク）。1回リトライして駄目なら人間に通知。
- Claude API 429/overloaded: 3回まで指数バックオフ、以後スキップして翌回へ。
- 投稿失敗: `status: failed` + エラー内容をfrontmatterに記録 → Discord通知 → 人間が判断。
- ログ: 構造化ログ（JSONL）を `data/logs/YYYY-MM-DD.jsonl` にコミット。**APIキー・トークンは絶対にログへ出さない**（llm.py/x_client.pyでマスク処理）。
- リポジトリは **private必須**（下書き・戦略・コストが入るため）。

---

## 6. 定時実行フロー

| 時刻(JST) | ワークフロー | 処理 |
|---|---|---|
| 07:00 | morning_research | ①収集（RSS/Reddit/HN）→ ②重複排除 → ③Haiku要約・分類 → ④Sonnet横断分析 → `research/YYYY-MM-DD.md` 生成・コミット → Discordに「今日の注目3テーマ」を送信 |
| 11:30 | noon_drafting | research_notes上位テーマ＋insights（過去の勝ちパターン）→ 下書き3〜5本生成 → 品質評価 → 閾値以上のみ `drafts/` にコミット → Discordに下書きカード送信 |
| 人間（随時） | — | Discordで下書きを見る → GitHub上でfrontmatterの `status` を `approved` に編集（修正もこの時に直接編集）/ 却下なら `rejected` + `reject_reason` 記入 → コミット |
| pushトリガ＋12:00/18:00/21:00 | publish | `status: approved` の下書きを検出 → 投稿時間帯チェック（7:00-22:00のみ）→ 1回の実行で最大1本投稿（分散）→ `posted/` へ移動、tweet_id記録 |
| 22:00 | nightly_analytics | メトリクス取込（手動CSVがあれば）→ 型別集計 → insights更新 → 日次レポートをDiscordへ →（週次日曜のみ）週間振り返り＋プロンプト改善提案を生成 |

**人間承認の流れ（所要5分/日）**: Discord通知を見る → 良ければGitHubモバイル/WebでMarkdownを開き `status: pending` → `approved` に変更してコミット → publishが自動投稿。文面修正もその場で編集してからapprove。

**投稿失敗時**: §5-7の通り。連続2回失敗した下書きは自動で `failed` 固定にして人間の判断待ち。

**API制限時**: 当日の投稿を停止し翌日枠へ繰越。制限検知はapi_usageテーブルに記録し、月間write数が枠の80%に達したらDiscordに警告。

---

## 7. Claude Code実装計画（フェーズ別）

各Phaseは独立してテスト可能。**前Phaseの完了条件を満たすまで次に進まない。**

### Phase 0: 骨格（半日）
- **目的**: リポジトリ雛形とCI土台
- **実装**: ディレクトリ構成（§5-2）、pyproject.toml、config/*.yaml の雛形、`xops` CLIのスケルトン、SQLiteマイグレーション（§5-4）
- **完了条件**: `uv run xops --help` が通る。`pytest` が空テストで緑
- **テスト**: CLIサブコマンドの存在テスト、DBスキーマ作成テスト
- **Claude Codeへの指示文**:
  > 「§5-2のディレクトリ構成でPythonプロジェクトを作成。uv管理、CLIはargparseで `collect/research/draft/notify/publish/analyze` のサブコマンドをスタブ実装。§5-4のSQLiteスキーマを `common/db.py` にマイグレーションとして実装し、pytestで検証して」

### Phase 1: 市場調査ログをローカル生成（2〜3日）
- **目的**: 収集→要約→リサーチノートまでをローカルで動かす
- **実装**: `collect/`（RSS・Reddit JSON・HN）、`dedupe.py`、`research/summarize.py`（Haiku）、`research/analyze.py`（Sonnet）、prompts/summarize.md・research.md
- **完了条件**: `uv run xops collect && uv run xops research` で `research/YYYY-MM-DD.md` に「テーマ3件＋希少度＋根拠URL」が出力される。3日連続実行して重複テーマが排除される
- **テスト**: dedupeのユニットテスト、モックfeedでの結合テスト、実フィード1本での手動確認
- **指示文**:
  > 「config/sources.yaml のRSS 5本とr/ClaudeAIの公開JSONを収集し、itemsテーブルに保存。Haiku(claude-haiku-4-5-20251001)で要約・分類・希少度1-5を付与し、Sonnetで横断分析して research_notes を生成。prompts/research.md には§3-4の希少情報判定基準を埋め込むこと。全API呼び出しをapi_usageに記録」

### Phase 2: 投稿案の生成と品質評価（2〜3日）
- **目的**: research_notes → 下書きMarkdown（§5-3形式）
- **実装**: `generate/drafter.py`、`generate/scorer.py`、prompts/draft.md・score.md、quality_rules.yaml（NGワード§4-3、閾値: total 15/25未満は破棄）
- **完了条件**: `uv run xops draft` で下書き3〜5本が `drafts/` に生成され、スコアと出典URLがfrontmatterに入る。NGワード入り下書きが機械的に落ちる
- **テスト**: NGワード検出ユニットテスト、テンプレ型ごとの生成スナップショット確認（人間の目視）
- **指示文**:
  > 「research_notesの上位テーマから§4-2テンプレートに沿って下書きを生成。生成と評価は別のClaude呼び出しに分離（score.mdは『このアカウントが投稿すべきでない理由を先に探せ』という減点方式で書く）。280字制限・URL字数・NGワードをPython側でも機械検証」

### Phase 3: Discord通知（1日）
- **目的**: 人間が毎日見る場所に下書きを届ける
- **実装**: `approve/notifier.py`（Webhook埋め込みカード: 本文プレビュー・スコア・出典・GitHub編集直リンク）、morning/noonのGitHub Actions化
- **完了条件**: 定時実行でDiscordに調査サマリと下書きカードが届く。カード内リンクから該当Markdownの編集画面へ1タップで飛べる
- **テスト**: Webhookのdry-run（ローカル→テスト用チャンネル）、Actionsのworkflow_dispatch手動実行
- **指示文**:
  > 「drafts/のpending下書きをDiscord Webhookで送信。1下書き=1 embed。GitHubの編集URL（https://github.com/{repo}/edit/main/drafts/{id}.md）をボタン風リンクで付ける。morning_research.yml と noon_drafting.yml を作成し、実行結果（生成数・スキップ数・コスト）を末尾に1行サマリで送る」

### Phase 4: 承認済み投稿のX API投稿（2日）
- **目的**: approved → 実投稿。**dry-runを既定に**
- **実装**: `publish/x_client.py`（tweepy、dry-run分岐）、`publish/poster.py`（状態遷移・1実行1本上限・時間帯ガード）、publish.yml（push + cron）
- **完了条件**: dry-runで投稿内容がログに出る → 手動で `XOPS_DRY_RUN=0` にして1本だけ実投稿成功 → tweet_idがfrontmatterとDBに記録され、ファイルが `posted/` へ移動
- **テスト**: dry-runの結合テスト、失敗時に `failed` へ遷移するテスト、`XOPS_MAX_POSTS_PER_DAY` 超過時にスキップするテスト
- **指示文**:
  > 「approvedの下書きをtweepyでX API v2に投稿。スレッドはin_reply_to連結で実装。XOPS_DRY_RUN=1が既定。投稿は1実行最大1本・日次上限XOPS_MAX_POSTS_PER_DAY・投稿可能時間帯7-22時JST。429/403では再試行せず通知して停止。posted/への移動・tweet_id記録・Discord完了通知まで」

### Phase 5: 投稿結果の取得と分析（2日）
- **目的**: 型別の勝ちパターンを数値で持つ
- **実装**: `analytics/fetch_metrics.py`（**MVPはXアナリティクスCSVの手動取込 `xops analyze --import csv`**。API枠があればAPI取得も実装）、`analytics/report.py`、nightly_analytics.yml
- **完了条件**: CSVを置いて実行するとmetricsに入り、「型別の中央値インプレッション・ブックマーク率」がDiscordに届く
- **テスト**: サンプルCSVでの取込テスト、集計ロジックのユニットテスト
- **指示文**:
  > 「XアナリティクスのエクスポートCSVをパースしてmetricsテーブルへ。draft_idとの紐付けはtweet_id。型別（frontmatterのtype）にインプレッション・ブックマーク率・プロフィールクリック率を集計し、日次レポートと週次レポート（日曜）をDiscordへ送信」

### Phase 6: 改善ループ（2日〜継続）
- **目的**: 却下理由とメトリクスをプロンプトに還流する
- **実装**: prompts/improve.md（rejected/のreject_reason＋insightsを読み、draft.md/research.mdの改善差分を提案）、`xops improve` コマンド（**提案をPRとして出す。自動適用はしない**）
- **完了条件**: 週1実行で「プロンプト改善案PR」が生成され、人間がレビューしてマージできる
- **テスト**: rejectedサンプル10件での提案品質を目視評価
- **指示文**:
  > 「rejected/の却下理由とinsightsテーブルを読み込み、prompts/draft.md への具体的な差分（追加すべき制約・削るべき指示）を提案するimproveコマンドを実装。提案はブランチを切ってPR化し、人間レビューを必須とする」

**拡張フェーズ（Phase 7+、必要になってから）**: Discord Bot化（ボタン承認）/ 図解PNG自動生成 / note記事ドラフト生成 / Cloudflare Workers移行。

---

## 8. リスク対策

| リスク | 対策 |
|---|---|
| X規約（自動化ルール）違反 | 投稿は人間承認済みのみ・1日最大3本・自動いいね/フォロー/リプ/DMは**実装自体しない**（コードベースに入れない）。重複・類似投稿はdedupeで排除 |
| スパム判定 | 同一文面・同一リンク連投の禁止をposter.pyで機械チェック（直近30日の投稿との類似度）。ハッシュタグ乱用しない（0〜1個）。投稿間隔を最低4時間空ける |
| 投稿品質低下 | 二段評価（生成→別呼び出しで減点方式採点）＋閾値未満は人間に見せずに破棄＋人間承認。 「今日はネタがない」日は投稿しない（本数ノルマを持たない） |
| ガセ情報拡散 | 出典2ソース未満の伝聞は下書き化しない（scorerで強制減点）。「らしい」検出。投稿に出典リンクを残す。誤りが判明したら訂正ポストを出す運用ルールを固定ポストに明記 |
| 著作権 | 記事の引用は要約＋出典リンクに限定（本文転載しない）。画像の無断利用禁止。スクショは自分の画面のみ |
| 個人情報 | 収集データから個人名・アカウント名をプロンプト段階でマスク。競合分析は「型」の分析に限定し、特定アカウントへの言及投稿をしない |
| 炎上 | NGジャンル（§2-3）とNGワード（§4-3）の二重チェック。断定・属性攻撃・稼げる系を機械検出。riskスコア3以上は自動却下 |
| API料金増加 | api_usageテーブルで日次コスト記録、日次上限で生成スキップ。Haiku/Sonnetの使い分け。収集は無料ソースのみ |
| 自動化しすぎによる信用低下 | リプ・引用は100%手動。「自動生成です」感を出さないため、承認時に人間が一言直す運用を推奨（修正差分も学習データになる）。progress型投稿で「仕組みを作っている本人」であることを開示 |
| シークレット漏洩 | private repo必須・Secrets管理・ログマスク・.env はgitignore |

---

## 9. 30日運用計画

| 週 | やること | システム側 |
|---|---|---|
| 1週目 | アカウント設計確定・プロフィール整備・固定ポスト（宣言版）・**手動で毎日1投稿**（テンプレ§4-2を手で使い感覚を掴む） | Phase 0〜1（調査ログが毎朝届く状態に） |
| 2週目 | 調査ログを見て投稿を選ぶ運用開始。競合10アカウントのリスト化と週次観察開始 | Phase 2〜3（下書きがDiscordに届く。**投稿はまだ手動コピペ**） |
| 3週目 | 承認→自動投稿の運用開始（1日1〜2本）。リプは全部手動で返す | Phase 4〜5（実投稿＋CSV分析） |
| 4週目 | 週次レポートを見て型の比率を調整。noteの無料記事1本目（システム開発ログ）を公開し固定ポスト更新 | Phase 6（改善ループ稼働） |

**見るべきKPI（優先順）**
1. ブックマーク率（保存される=実用情報として認識されている）… 最重要
2. プロフィールクリック率 → フォロー転換率
3. 承認率（生成下書きのうちapprovedの割合）… システム品質の指標。50%未満ならプロンプト改善
4. インプレッション・いいねは参考値（アルゴリズム変動が大きい）

**失敗判定ライン（30日時点）**
- 承認率が30%未満のまま改善しない → 生成ロジックを作り直す
- 30投稿してブックマーク率中央値が0.5%未満 → コンセプトの切り口を見直す（型は維持しテーマを変える）
- 運用が1日15分を超えて続かない → 下書き本数を減らす（本数より品質）

**改善判断基準**: 週次で「型別ブックマーク率」を見て、上位型の生成比率を上げ、下位型は月次でテンプレ改修 or 廃止。判断はすべてinsightsテーブルに記録し、感覚で変えない。

---

## 10. 最終的な推奨案（最小構成の明確化）

**初心者が実装しやすく、将来拡張できる最小構成:**

```
言語        : Python 3.12（uv管理）
実行        : GitHub Actions cron（private repo・無料枠内）
データ      : SQLite + Markdown（すべてリポジトリにコミット＝バックアップ不要）
LLM         : Claude API（Haiku 4.5=要約 / Sonnet 5=生成・評価）
通知        : Discord Webhook（受信Bot不要）
承認        : GitHub上での下書きファイル編集（スマホ可・追加インフラゼロ）
投稿        : X API v2 write（tweepy・dry-run既定・日次上限3・時間帯ガード）
分析        : XアナリティクスCSV手動取込（API課金を回避）
```

**この構成が最小である理由**: サーバー0台・常駐プロセス0・DBサーバー0・管理画面開発0。可動部品はGitHub ActionsとWebhookだけで、全状態がGitに残るためClaude Codeがそのまま改善作業を続けられる。

**拡張パス（順番も固定）**: ① Discord Botボタン承認 → ② メトリクスAPI自動取得（X API有料枠が正当化できるフォロワー規模になってから）→ ③ 図解PNG生成 → ④ note記事ドラフト自動生成 → ⑤ 複数アカウント対応（configの多重化のみで対応できる設計にしてある）。

**最初の一歩**: このドキュメントをClaude Codeに渡し、「Phase 0の指示文（§7）を実行して」から始める。
