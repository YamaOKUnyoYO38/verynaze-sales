# プレモーテム / Voice Bridge IME

> プロジェクト開始前に「失敗した未来」を想像し、原因を逆算して回避策を決める。

---

## 1. 失敗シナリオ全景

```text
Aqua Voice っぽく Overlay から作り始める
  ↓
入力欄挿入に Accessibility を使う
  ↓
Google Play 審査で危険になる
  ↓
継続録音が SpeechRecognizer で不安定
  ↓
バッテリー消費が高い
  ↓
履歴に個人情報が残りすぎる
  ↓
Overlay 権限が怖くてユーザーが離脱
  ↓
Play Store 公開前に Privacy Policy と Data Safety が書けない
  ↓
自分用 APK で止まる
```

---

## 2. 失敗パターンと回避策

| # | 失敗パターン | 検知タイミング | 回避策 |
| --- | --- | --- | --- |
| 1 | Aqua Voice 模倣に走り Overlay 中心になる | Phase 0〜2 | IME 主軸を絶対方針として固定。Phase 2 で IME 経由挿入が通るまで Overlay に着手しない |
| 2 | 入力欄挿入に Accessibility を使う | Phase 2 | `AccessibilityService` 禁止。Manifest にも追加禁止 |
| 3 | Google Play 審査でリジェクト | Phase 9 | `playNoOverlay` flavor を事前準備、Privacy Policy / Data Safety を実装と一致させる |
| 4 | SpeechRecognizer で継続録音が不安定 | Phase 8 | 20 秒セグメント、無音確定、連続エラー 3 回で停止、上限 10 分 |
| 5 | バッテリー消費が高い | Phase 8 | 低バッテリー自動停止、画面ロック時停止、Foreground Service は録音中のみ |
| 6 | 履歴に個人情報が残りすぎる | Phase 5 | 保存期間 (初期 30 日)、個別/全削除、外部送信なし、音声ファイル保存 OFF |
| 7 | Overlay 権限を怖がってユーザーが離脱 | Phase 7 / クローズドテスト | Overlay は任意、初期 OFF、IME 内ボタンで全機能可、`playNoOverlay` 用意 |
| 8 | Privacy Policy / Data Safety が間に合わない | Phase 9 | Phase 0 でドラフト作成済み、Phase 9 で実装と再突合 |
| 9 | 自分用 APK で止まる | Phase 9 | クローズドテスト 12 人 × 14 日の計画を Phase 9 開始時点で確定 |
| 10 | ChatGPT / Chrome / LINE / メモ で挿入失敗 | Phase 2〜各 Phase 末 | 退行テストで毎 Phase 末に再実行 |
| 11 | ユーザー操作なしで録音が始まる | Phase 4〜8 | 録音は必ずユーザー操作起点。バックグラウンドのみ状態からの開始禁止 |
| 12 | 録音中表示がない | Phase 4 | 通知 + UI バッジ + 音量バー。3 か所で必ず表示 |
| 13 | API キー直書き | Phase 9 | MVP では外部 API なし。将来も `BuildConfig` 経由のみ |
| 14 | 設計書と実装の乖離 | 各 Phase | Phase 末に本ドキュメントセットを実装と突合 |
| 15 | flavor 切替に失敗し Play 提出が遅れる | Phase 9 | Phase 9 開始時に 2 flavor 同時ビルドを CI 化 |

---

## 3. 早期警戒シグナル

- 「Accessibility を使えば挿入できる」と話題になる → 即時 NG 宣言
- 「常時録音にしよう」と話題になる → 仕様外と明示
- 「外部 API に送ろう」と話題になる → 別 flavor + 明示同意フローが揃ってから議論
- 「Overlay 必須にしよう」と話題になる → `playNoOverlay` の存在意義を再確認
- 履歴削除 UI が後回しになる → Phase 5 と同時に必須

---

## 4. 回避策ハードガード

- `AccessibilityService` を Manifest に追加しない (CI で grep ガード)
- `INTERNET` パーミッションを MVP 期間中追加しない
- 音声ファイル保存設定の初期値は OFF (定数で固定)
- 録音開始メソッドは必ずユーザー操作経由のコールパスからのみ呼ばれる (ReleaseSafetyGate)
- Foreground Service は録音中のみ起動・停止 (ライフサイクルテスト必須)

---

## 5. 撤退基準

下記のいずれかが満たされない限り、Production 公開しない。

- IME として有効化でき、固定文挿入が通る
- ChatGPT / Chrome / LINE / メモ で挿入成功率 95% 以上
- クローズドテスト 14 日でクラッシュ率 1% 未満
- Privacy Policy / Data Safety が実装と一致
- `playNoOverlay` flavor がビルドできる
- 全データ削除が機能する
- `AccessibilityService` が存在しない

---

## 6. 失敗してもよいこと

- 単一の音声認識エンジンで全状況をカバーすること (フォールバックでよい)
- すべての Android アプリで 100% 挿入が成功すること (失敗時はクリップボードコピー)
- 完全な常時録音を実現すること (そもそも目標外)

これらは「失敗してよい」と最初から宣言し、リソースを割かない。

---

## 7. 振り返り運用

各 Phase 末で次の 3 問に答える。

1. 上記失敗パターンのうち、今 Phase で近づいたものは?
2. 早期警戒シグナルは観測されたか?
3. 撤退基準のいずれかに抵触したか?

1 つでも YES の場合、次 Phase へ進む前に対応策を本書に追記する。
