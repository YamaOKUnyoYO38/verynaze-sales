# ARCHITECTURE / Voice Bridge IME

Android IME 「Voice Bridge IME」 のアーキテクチャ仕様。

---

## 1. モジュール構成

```text
VoiceBridgeIme Android App
├── app/
│   ├── MainActivity
│   ├── VoiceImeService              // InputMethodService 実装
│   ├── FloatingVoiceButtonService   // Overlay フローティングボタン (任意)
│   ├── DictationForegroundService   // 録音中の Foreground Service
│   └── VoiceBridgeApplication
│
├── core/
│   ├── AppEventBus
│   ├── PermissionStateManager
│   ├── PrivacyGuard
│   ├── ErrorReporter
│   └── Logger
│
├── domain/
│   ├── DictationController          // 録音セッションの状態管理
│   ├── TextInsertionController      // IME 経由のテキスト挿入
│   ├── DictionaryEngine             // 認識結果に対する後処理置換
│   ├── HistoryUseCase
│   ├── RecordingStateMachine
│   └── ReleaseSafetyGate            // flavor / 権限の安全弁
│
├── speech/
│   ├── SpeechEngine                 // 抽象インターフェース
│   ├── AndroidSpeechRecognizerEngine
│   ├── OnDeviceSpeechRecognizerEngine
│   ├── SpeechResult
│   └── AudioLevelState
│
├── data/
│   ├── RoomDatabase
│   ├── TranscriptEntity
│   ├── DictionaryEntryEntity
│   ├── AppSettingsEntity
│   ├── TranscriptDao
│   ├── DictionaryDao
│   └── SettingsRepository
│
├── ui/
│   ├── onboarding/
│   ├── home/
│   ├── history/
│   ├── dictionary/
│   ├── settings/
│   ├── diagnostics/
│   └── components/
│
├── overlay/
│   ├── FloatingButtonView
│   ├── FloatingButtonState
│   ├── DragController
│   └── OverlayPermissionGuide
│
├── ime/
│   ├── ImeKeyboardView
│   ├── ImeMicToolbar
│   ├── ImeCommitBridge              // InputConnection.commitText() の薄いラッパ
│   └── ImeSubtypeConfig
│
└── release/
    ├── play/
    ├── playNoOverlay/
    ├── internalDebug/
    └── qa/
```

---

## 2. 録音 → 挿入フロー

```text
ユーザー操作
  ↓
IME 内マイクボタン or フローティングボタン
  ↓
DictationController
  ↓
SpeechEngine
  ↓
音声認識結果
  ↓
DictionaryEngine で補正
  ↓
HistoryRepository に保存
  ↓
ImeCommitBridge
  ↓
現在の InputConnection へ commitText()
  ↓
入力欄へ文字挿入
```

---

## 3. 録音状態マシン

```kotlin
enum class RecordingState {
    Idle,
    Preparing,
    ListeningOneShot,
    ListeningContinuous,
    Transcribing,
    Committing,
    Error
}
```

| 遷移元 | イベント | 遷移先 |
| --- | --- | --- |
| `Idle` | 単発タップ | `Preparing` → `ListeningOneShot` |
| `Idle` | ダブルタップ (600ms 以内) | `Preparing` → `ListeningContinuous` |
| `Listening*` | 発話終了 / 無音確定 / 最大秒数 | `Transcribing` |
| `Transcribing` | 認識完了 | `Committing` |
| `Committing` | 挿入完了 | `ListeningContinuous` (継続中) または `Idle` |
| 任意 | ユーザー停止 | `Idle` |
| 任意 | エラー | `Error` |
| `Error` | 自動復帰 | `Idle` |

---

## 4. 継続録音のセグメント設計

```text
Continuous Mode ON
  ↓
startListening()
  ↓
発話終了 or 最大 N 秒
  ↓
onResults()
  ↓
辞書補正
  ↓
commitText()
  ↓
短い休止
  ↓
次セグメントへ
```

### 4.1 セグメント・時間制約

| 項目 | 値 |
| --- | --- |
| 1 セグメント最大 | 20 秒 |
| 無音確定 | 1.2〜1.8 秒 |
| 継続録音 初期最大 | 10 分 |
| 設定上限 | 30 分 |
| 低バッテリー時 | 自動停止 |
| 画面ロック時 | 原則停止 |
| ユーザー操作なしの自動開始 | 禁止 |
| バックグラウンドのみの状態からの録音開始 | 禁止 |

### 4.2 連続エラー時の挙動

連続 3 回エラーで停止し `Error` 状態へ。
ユーザーに `DiagnosticsScreen` を案内する。

---

## 5. テキスト挿入

### 5.1 挿入経路

`InputConnection.commitText(text, 1)` のみを使う。
`AccessibilityService` 経由の挿入は実装しない。

### 5.2 挿入文の整形

| モード | 整形ルール (初期値) |
| --- | --- |
| 単発録音後 | 末尾にスペースなし |
| 継続録音セグメント間 | 改行なし、必要に応じて句点 |

設定で変更可能:

- セグメントごとに改行
- セグメントごとに句点
- 句読点なし
- 文末にスペース

### 5.3 挿入失敗時のフォールバック

- クリップボードへコピー
- 通知で「入力欄へ挿入できなかったためコピーしました」と表示
- `DiagnosticsScreen` に直近エラーを記録

---

## 6. 辞書補正

### 6.1 補正パイプライン

```text
resultText
  ↓
DictionaryEngine.apply()
  ↓
ImeCommitBridge.commitText(correctedText)
```

### 6.2 例

| 誤認識 | 正表記 |
| --- | --- |
| べりーなーぜ | 株式会社ベリーナーゼ |
| クロードコード | Claude Code |
| コデックス | Codex |

### 6.3 エンティティ

```kotlin
@Entity(tableName = "dictionary_entries")
data class DictionaryEntryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val sourceText: String,
    val replacementText: String,
    val matchType: MatchType,
    val enabled: Boolean = true,
    val createdAt: Long,
    val updatedAt: Long,
    val hitCount: Int = 0
)

enum class MatchType {
    EXACT,
    CONTAINS
}
```

### 6.4 登録経路

1. 辞書画面から手動追加
2. 履歴詳細から「この誤変換を辞書登録」
3. 文字起こし直後の結果カードから辞書登録

---

## 7. 履歴

### 7.1 エンティティ

```kotlin
@Entity(tableName = "transcripts")
data class TranscriptEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val rawText: String,
    val correctedText: String,
    val mode: TranscriptMode,
    val durationMs: Long,
    val createdAt: Long,
    val inserted: Boolean,
    val copiedToClipboard: Boolean,
    val dictionaryApplied: Boolean
)

enum class TranscriptMode {
    ONE_SHOT,
    CONTINUOUS
}
```

### 7.2 初期設定

| 項目 | 初期値 |
| --- | --- |
| 履歴保存 | ON |
| 保存期間 | 30 日 |
| 音声ファイル保存 | OFF |
| 外部送信 | OFF |
| 全データ削除 | いつでも可能 |

---

## 8. パーミッション

### 8.1 Manifest 宣言

#### `play` flavor

```xml
RECORD_AUDIO
POST_NOTIFICATIONS
FOREGROUND_SERVICE
FOREGROUND_SERVICE_MICROPHONE
SYSTEM_ALERT_WINDOW
```

#### `playNoOverlay` flavor

```xml
RECORD_AUDIO
POST_NOTIFICATIONS
FOREGROUND_SERVICE
FOREGROUND_SERVICE_MICROPHONE
```

### 8.2 絶対に追加しないパーミッション

```text
ACCESSIBILITY_SERVICE
QUERY_ALL_PACKAGES
READ_CONTACTS
READ_SMS
READ_CALL_LOG
READ_MEDIA_IMAGES
READ_MEDIA_VIDEO
MANAGE_EXTERNAL_STORAGE
REQUEST_INSTALL_PACKAGES
INTERNET   // MVP では外部送信なしのため不要
```

`INTERNET` は MVP では原則付与しない。将来 STT クラウド連携を追加する場合のみ、別 flavor または明示同意フローと共に導入する。

---

## 9. Foreground Service

`DictationForegroundService` は録音中のみ起動する。

- `foregroundServiceType="microphone"`
- 通知タイトルに「録音中」を必ず表示
- 録音停止と同時に `stopForeground`
- アプリ起動だけでは Service 起動しない

---

## 10. flavor 設計

| flavor | Overlay | 用途 |
| --- | --- | --- |
| `internalDebug` | 有効 | 実機開発用、詳細ログ |
| `qa` | 有効 | クローズドテスト用、ログ制限 |
| `play` | 任意 (初期 OFF) | Play Store 提出候補 |
| `playNoOverlay` | なし | Overlay 審査落ち時の代替版 |

`ReleaseSafetyGate` は flavor を参照して、ビルド時に Overlay 機能の可否を制御する。
