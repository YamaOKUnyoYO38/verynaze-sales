# Voice Bridge IME — Android プロジェクト

Android 音声入力 IME 「Voice Bridge IME」 の実装ルート。
設計ドキュメントは `../.company/pm/projects/voice-bridge-ime/` を参照。

## Phase 1 のスコープ

最小構成の Android プロジェクトのみ。

- `app/` シングルモジュール
- Kotlin / Jetpack Compose / Material3
- ランチャー Activity (`MainActivity`) はプレースホルダ画面のみ
- IME / 音声 / Overlay は **まだ実装しない**

## ビルド・実機インストール手順

このリポジトリには Gradle Wrapper のバイナリ (`gradle/wrapper/gradle-wrapper.jar`, `gradlew`, `gradlew.bat`) を含めていません。Android Studio で開いた際に自動生成させるか、ローカルの Gradle で生成してください。

### A. Android Studio で開く

1. Android Studio (Koala 以降推奨) を起動
2. `Open` から `android/` ディレクトリを選択
3. Gradle JDK 17 を指定
4. `Sync Project with Gradle Files` を実行
5. 実機を USB 接続 (開発者オプション + USB デバッグ ON)
6. `app` Run Configuration を選んで `Run`

### B. CLI で Gradle Wrapper を生成

ローカルに Gradle 8.10+ がある場合:

```bash
cd android
gradle wrapper --gradle-version=8.10.2
./gradlew :app:assembleDebug
./gradlew :app:installDebug   # 実機 / エミュレータが必要
```

## バージョン

| 項目 | 値 |
| --- | --- |
| Kotlin | 2.0.21 |
| Android Gradle Plugin | 8.7.3 |
| Gradle | 8.10.2 |
| `compileSdk` | 35 |
| `targetSdk` | 35 |
| `minSdk` | 26 |
| `applicationId` | `jp.verynaze.voicebridgeime` |
| `versionName` | 0.1.0 |
| `versionCode` | 1 |

## Phase 1 完了条件

- [ ] Android Studio でプロジェクトを開ける
- [ ] Gradle Sync が成功する
- [ ] `app` をビルドできる (`assembleDebug` 成功)
- [ ] 実機に `installDebug` でインストールできる
- [ ] 起動して「Voice Bridge IME」プレースホルダ画面が表示される
- [ ] アプリ起動でクラッシュしない

完了したら Phase 2 (最小 IME で固定文「テスト」挿入) に進む。
