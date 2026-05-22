# Claude Code 向け指示書 / Voice Bridge IME

Android 音声入力 IME 「Voice Bridge IME」 の Phase 0 ドキュメントセット。
本ファイルはプロジェクト全体の最上位指示書であり、他の設計ドキュメントを束ねるエントリポイントである。

---

## 0. プロジェクト概要

### 0.1 プロダクト名

Voice Bridge IME

### 0.2 目的

Android スマホ上で、ユーザーが現在入力しているテキスト欄に対して、音声入力・文字起こし・辞書補正・履歴保存を行う。
Aqua Voice のようにスマホ上で素早く音声入力を開始できる体験を目指す。
ただし Google Play Store 公開を最終目標にするため、他アプリを Accessibility で操作する方式ではなく、Android 公式の `InputMethodService`（IME 方式）を主軸にする。

### 0.3 最終到達点

- Android スマホ実機で安定動作する
- Google Play Store で公開可能な権限設計になっている
- IME として全アプリ横断で使える
- 画面端のフローティングボタン、または IME 内マイクボタンから音声入力できる
- 1 回タップで単発録音できる
- 2 回タップで継続録音できる
- 継続録音中は再タップまで録音・認識を続ける
- 音量メーターで音声が届いているか分かる
- 内蔵マイクで音声を取り込む
- 文字起こし結果を現在アクティブな入力欄へ挿入する
- 誤変換を辞書登録し、次回以降は補正できる
- 文字起こし履歴を日時付きで一覧表示し、コピーできる
- Google Play の内部テスト → クローズドテスト → 審査 → Production 公開まで進められる

### 0.4 既存資産との関係

既存の「Voice Bridge: Aqua Voice 連携 + Whisper 文字起こし常駐」の発展版として扱う。
今回は PC 常駐ツールではなく、Android IME アプリとして再設計する。

### 0.5 最初の実装ゴール

最初から音声認識・Overlay・辞書・履歴を全部作らない。
**最初のゴールはこれだけ。**

> Android スマホ実機で、Voice Bridge IME を有効化し、現在の入力欄へ固定文字列「テスト」を挿入できる

この固定文字列挿入が通るまで、音声認識には進まない。

---

## 1. 最重要方針

### 1.1 絶対方針

1. 入力欄への文字挿入は `InputMethodService` / IME で行う
2. `AccessibilityService` は実装しない
3. ユーザー操作なしに録音を開始しない
4. 録音中は必ず明確な UI 表示を出す
5. 音声ファイル保存は初期 OFF
6. 外部 API 送信は MVP では禁止
7. 文字起こし履歴はユーザーが削除できる
8. Google Play 版では Overlay 機能を任意機能にする
9. Overlay なしでも IME 内マイクボタンで全機能が使えるようにする
10. Play Store 審査で Overlay が問題化した場合に備えて `playNoOverlay` flavor を用意する

### 1.2 開発思想

このアプリの価値は「常時録音」ではない。価値は以下。

- スマホで長文を音声入力しやすい
- ChatGPT / Claude / Gemini / LINE / Gmail / メモなどに素早く入力できる
- 誤変換を自分用辞書で補正できる
- 過去の音声入力履歴を再利用できる
- 音声入力の開始・停止が直感的である

### 1.3 Google Play 公開を見据えた原則

- 権限は最小限にする
- マイク権限の用途を明示する
- Overlay は任意にする
- Accessibility は使わない
- ユーザーが明示的に録音開始した時だけマイクを使う
- 録音中状態を必ず表示する
- 履歴保存・削除・全削除を実装する
- Privacy Policy と Data Safety の内容と実装を一致させる
- 外部送信がある場合は明示同意を取る
- MVP では外部送信なしにする

---

## 2. 目的・非目的

### 2.1 目的

- Android スマホで素早く音声入力できる IME を作る
- 現在アクティブな入力欄に文字起こし結果を挿入する
- 1 回タップで単発録音できる
- 2 回タップで継続録音できる
- 録音中の音量メーターを表示する
- 辞書補正で固有名詞や誤変換を直せる
- 文字起こし履歴を日時付きで保存し、コピーできる
- Google Play Store 公開可能な設計にする
- スマホ実機テストを前提に品質保証する

### 2.2 非目的

- 完全な常時録音アプリを作ること
- ユーザー操作なしに裏で録音すること
- 他アプリの入力欄を Accessibility で強制操作すること
- 他アプリの画面内容を読み取ること
- 外部 API に音声を無断送信すること
- 音声ファイルを初期状態で保存すること
- Google Play ポリシーに反する形で Overlay を常用すること
- Aqua Voice の完全コピーを作ること
- 最初から高精度な独自音声認識エンジンを作ること
- すべてのアプリで 100% 入力挿入できる保証をすること

---

## 3. 想定ユースケース

### 3.1 ChatGPT / Claude / Gemini への長文入力

ユーザーがスマホで ChatGPT / Claude アプリを開き、入力欄をタップする。
Voice Bridge IME またはフローティングボタンから録音開始する。
話した内容が文字起こしされ、入力欄に挿入される。

### 3.2 LINE / Discord / Gmail への短文入力

短い返信や連絡文を音声で入力する。
入力結果は挿入されるだけで、自動送信はしない。
送信ボタンはユーザーが明示的に押す。

### 3.3 メモ・日記・Brain Dump

長いアイデアを継続録音で入力する。
2 回タップで継続録音開始。
セグメント単位で文字起こし、入力欄へ追記。再タップで停止。

### 3.4 辞書育成

よく誤認識される固有名詞を辞書登録する。
例:

| 誤認識 | 正表記 |
| --- | --- |
| べりーなーぜ | 株式会社ベリーナーゼ |
| クロードコード | Claude Code |
| コデックス | Codex |
| チャットジーピーティー | ChatGPT |
| ワタナベヨウ | ワタナベヨウ |

MVP では、音声認識エンジン自体を学習させるのではなく、認識結果に対する後処理置換として実装する。

### 3.5 履歴再利用

過去の文字起こしを履歴画面で確認する。
日時・原文・補正文を確認できる。コピー、辞書登録、削除が可能。

---

## 4. ドキュメント構成

| ファイル | 役割 |
| --- | --- |
| `CLAUDE_CODE_INSTRUCTION.md` | 本書。全体方針と Phase 計画 |
| `ARCHITECTURE.md` | モジュール構成・録音/挿入フロー・状態遷移 |
| `UI_UX_SPEC.md` | 画面・操作・状態表示の仕様 |
| `PLAY_STORE_RELEASE_PLAN.md` | Play Store 提出までの段取りと flavor 設計 |
| `SMARTPHONE_TEST_PLAN.md` | 実機テスト計画 |
| `PRIVACY_POLICY_DRAFT.md` | Privacy Policy 草案 |
| `DATA_SAFETY_DRAFT.md` | Google Play Data Safety 草案 |
| `PREMORTEM.md` | 失敗シナリオと回避策 |

---

## 5. Phase 計画

| Phase | 目標 | 完了条件 |
| --- | --- | --- |
| Phase 0 | docs 作成 | 本ディレクトリの 8 ファイルが揃う |
| Phase 1 | Android プロジェクト作成 | 空プロジェクトが実機にインストールできる |
| Phase 2 | 最小 IME で固定文「テスト」挿入 | ChatGPT / Chrome / メモ / LINE で挿入確認 |
| Phase 3 | Onboarding | IME 有効化 / 権限案内が完成 |
| Phase 4 | 単発音声入力 | 1 タップで録音 → 文字挿入 |
| Phase 5 | 履歴 DB | Room で保存 / 一覧 / 削除 |
| Phase 6 | 辞書補正 | 置換ルールで認識後処理 |
| Phase 7 | Overlay | フローティングボタン (任意機能) |
| Phase 8 | 継続録音 | 2 タップで継続、再タップで停止 |
| Phase 9 | Play release 準備 | flavor 分離、Privacy Policy、Data Safety |

各 Phase 末に以下を報告する。

- 実装した内容
- 変更ファイル
- 実機テスト結果
- 失敗したテスト
- 次 Phase へ進んでよいか
- Google Play 審査リスクが増えていないか

---

## 6. 環境

| 項目 | 内容 |
| --- | --- |
| OS | Windows 11 + WSL2 |
| 実装母艦 | Claude Code |
| IDE | Android Studio |
| 言語 | Kotlin |
| ビルド | Gradle Kotlin DSL |
| 実機テスト | Android スマホ |
| `minSdk` | 26 |
| `targetSdk` | 35 以上 |
| `compileSdk` | 利用可能な最新安定版 |
| `packageName` | `jp.verynaze.voicebridgeime` |

---

## 7. 進行ルール

1. いきなり全部実装しない
2. Phase 順に進める
3. Phase ごとにスマホ実機テスト項目を作る
4. `AccessibilityService` を追加しない
5. 外部 STT API を追加しない
6. 音声ファイル保存を初期 ON にしない
7. Overlay を必須にしない
8. 既存ファイル削除・大規模移動は事前に差分提示
9. API キーをコードに直書きしない
10. Play 提出操作はしない（ユーザーの手で行う）

---

## 8. Phase 0 完了条件

- `.company/pm/projects/voice-bridge-ime/` 配下に以下 8 ファイルが存在する
  - `CLAUDE_CODE_INSTRUCTION.md`
  - `ARCHITECTURE.md`
  - `UI_UX_SPEC.md`
  - `PLAY_STORE_RELEASE_PLAN.md`
  - `SMARTPHONE_TEST_PLAN.md`
  - `PRIVACY_POLICY_DRAFT.md`
  - `DATA_SAFETY_DRAFT.md`
  - `PREMORTEM.md`
- 各ファイルにアーキテクチャ・UI/UX・プレモーテム・実機テスト・Play 公開条件が記載されている
- ブランチ `claude/voice-bridge-ime-android-2UoMu` に push されている
- Draft PR が作成されている
