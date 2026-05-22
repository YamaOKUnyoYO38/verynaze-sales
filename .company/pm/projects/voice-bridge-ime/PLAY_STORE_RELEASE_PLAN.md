# Google Play Store リリース計画 / Voice Bridge IME

---

## 1. リリース戦略

1. `internalDebug` で実機開発
2. `qa` で内部関係者へ配布
3. Play Console 「内部テスト」トラックへ `play` flavor を投入
4. クローズドテスト (12 人 × 14 日) を実施
5. 審査リスク評価
6. Production 公開
7. 必要に応じて `playNoOverlay` flavor を即時切替

---

## 2. flavor 設計

| flavor | Overlay | ログ | 用途 |
| --- | --- | --- | --- |
| `internalDebug` | 有効 | 詳細 | 実機開発 |
| `qa` | 有効 | 制限 | クローズドテスト用社内配布 |
| `play` | 任意 (初期 OFF) | 制限 | Play Store 提出候補 |
| `playNoOverlay` | なし (Manifest からも除外) | 制限 | Overlay 審査落ち時の代替版 |

`playNoOverlay` は `SYSTEM_ALERT_WINDOW` を `<uses-permission>` ごと除外する。
ビルド時に `ReleaseSafetyGate` が flavor を見て Overlay 起動コードを無効化する。

---

## 3. パーミッション運用

| Permission | 用途 | flavor |
| --- | --- | --- |
| `RECORD_AUDIO` | 音声入力 | 全 flavor |
| `POST_NOTIFICATIONS` | 録音中通知 | 全 flavor |
| `FOREGROUND_SERVICE` | 録音中 Foreground Service | 全 flavor |
| `FOREGROUND_SERVICE_MICROPHONE` | マイク利用 Foreground Service | 全 flavor |
| `SYSTEM_ALERT_WINDOW` | フローティングボタン | `play` / `internalDebug` / `qa` のみ |

絶対追加しない:

- `ACCESSIBILITY_SERVICE`
- `QUERY_ALL_PACKAGES`
- `READ_CONTACTS`
- `READ_SMS`
- `READ_CALL_LOG`
- `READ_MEDIA_IMAGES`
- `READ_MEDIA_VIDEO`
- `MANAGE_EXTERNAL_STORAGE`
- `REQUEST_INSTALL_PACKAGES`
- `INTERNET` (MVP 期間中)

---

## 4. パーミッション説明文

### 4.1 マイク

> Voice Bridge IME は、ユーザーが録音ボタンを押した時だけマイクを使用します。
> 音声は文字起こしのために使用されます。
> MVP では音声ファイルを保存せず、外部 API にも送信しません。
> 録音中は画面上に録音状態を表示します。

### 4.2 Overlay (任意)

> Voice Bridge IME は、他のアプリの上に小さな録音ボタンを表示するために Overlay 権限を使用します。
> この権限は音声入力の開始・停止操作のためだけに使われます。
> 入力内容の読み取りや他アプリの操作には使用しません。
> 拒否しても IME 内マイクボタンで音声入力できます。

### 4.3 Foreground Service (マイク)

> Voice Bridge IME は、ユーザーが録音ボタンを押した時だけマイクを使用します。
> 音声は文字起こしのために使用されます。
> MVP では音声ファイルを保存せず、外部 API にも送信しません。
> 録音中は画面上に録音状態を表示します。

---

## 5. Play Console 必須項目

- アプリ名 / 短い説明 / 詳細な説明
- グラフィックアセット (アイコン / フィーチャーグラフィック / スクリーンショット)
- カテゴリ: ツール または 仕事効率化
- コンテンツのレーティング
- Privacy Policy URL
- Data Safety フォーム (本書 `DATA_SAFETY_DRAFT.md` と一致させる)
- ターゲット API レベル
- 16 KB ページサイズ対応
- 64bit 対応
- App Bundle (`.aab`) 提出

---

## 6. テストトラック

| トラック | 対象 | 期間 |
| --- | --- | --- |
| Internal testing | 社内・身内 (最大 100 人) | Phase 9 開始時から常時 |
| Closed testing | 12 人 × 14 日 (Play 要件) | Production 申請前 |
| Open testing | 必要に応じて | 任意 |
| Production | 一般公開 | 審査通過後 |

クローズドテストで以下を計測。

- クラッシュ率
- マイク権限拒否率
- Overlay 権限拒否率
- IME 有効化完了率
- ChatGPT / Chrome / LINE / メモ での挿入成功率

---

## 7. Production 提出前 No-Go チェックリスト

下記のいずれかに該当する場合、Production へ提出してはならない。

- [ ] `AccessibilityService` が Manifest に存在する
- [ ] ユーザー操作なしに録音開始できる
- [ ] 録音中表示がない
- [ ] 履歴削除ができない
- [ ] 音声保存が初期 ON
- [ ] 外部 API 送信が初期 ON
- [ ] Privacy Policy がない
- [ ] Data Safety と実装が一致していない
- [ ] Overlay なしで使えない
- [ ] `playNoOverlay` flavor が作れない
- [ ] 12 人 × 14 日テストの計画がない
- [ ] ChatGPT / Chrome / LINE / メモ で実機挿入テスト未完了

すべて NO であれば提出可能。

---

## 8. 提出前 Go チェックリスト

- [ ] IME として有効化できる
- [ ] 現在の入力欄へ固定文を挿入できる
- [ ] ChatGPT / Chrome / メモ / LINE で実機テスト済み
- [ ] マイク権限説明がある
- [ ] 録音中 UI がある
- [ ] 音声ファイル保存が初期 OFF
- [ ] 外部送信が OFF
- [ ] 履歴削除ができる
- [ ] 全データ削除ができる
- [ ] Overlay なしでも使える
- [ ] `AccessibilityService` が存在しない

---

## 9. リジェクト想定と対応

| 想定 | 対応 |
| --- | --- |
| Overlay 用途が不明確 | `play` から `playNoOverlay` に切替えて再提出 |
| Foreground Service 用途が不明確 | 通知文・説明文を強化、Foreground Service 起動条件を録音中のみに限定 |
| データ収集と Data Safety の不一致 | Data Safety を実装と再突合し再申請 |
| マイク権限の必要性が不明確 | パーミッション説明ダイアログとストア説明を強化 |
| Accessibility 風挙動を疑われる | 機能説明動画を添付、`AccessibilityService` 未実装を明示 |

---

## 10. 提出操作の責任分界

Claude Code は以下を行わない。

- Play Console への提出操作
- 署名鍵の生成・アップロード
- ストア掲載情報の最終登録

これらはユーザーが Play Console UI 上で実施する。
Claude Code は `.aab` の生成、提出物ドラフト、チェックリストの維持までを担当する。
