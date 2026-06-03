# Codex 実装ガイド

## 目的

このファイルは、Codex などの AI エージェントがこのプロジェクトを実装するときの判断基準を定める。実装時は `CODEX_PROJECT_BRIEF.md` の元構想を参考にしつつ、このプロジェクトを個人利用向けのハイブリッド Web アプリとして扱うこと。

プロジェクト概要、主要ユーザーフロー、実装優先順位、データとファイルの扱い、MVP 完了条件は `README.md` を参照すること。

## このプロジェクトの前提

- App Store 配布の iOS アプリではない。
- Swift、SwiftUI、Vision、AVFoundation を前提にした実装は行わない。
- 個人利用向けの Web アプリとして実装する。
- フロントエンドと軽量 API は `Next.js` にまとめる。
- 動画解析や OCR などの重い処理は `Python` ワーカーに分離する。
- 初期段階ではローカルファイル保存を中心にする。
- 認証、DB、キュー、クラウドストレージ、マルチユーザー対応は MVP の範囲外とする。

## 必須技術選定

### フロントエンド

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`

### Web サーバー層

- `Next.js Route Handlers`
- 必要な場合のみ `Server Actions`

### 解析ワーカー

- `Python`
- `ffmpeg`
- `PaddleOCR` または `EasyOCR`
- `Pillow`

### 保存方式

- ローカルファイル保存
- JSON メタデータ
- `uploads/`, `tmp/`, `artifacts/` の分離

## システム責務分割

### ブラウザ

ブラウザはユーザー操作と確認を担当する。

- 動画ファイル選択
- 解析開始
- 解析結果の表示
- アプリ名候補の確認、編集、削除、追加
- アイコンテーマ選択
- 生成アイコンの確認
- ダウンロード操作

### Next.js

Next.js は Web UI と軽量 API を担当する。

- 画面提供
- アップロード受付
- 解析ジョブ起動
- 結果取得 API
- 生成済みファイルの配布
- ローカル保存領域との接続

### Python ワーカー

Python ワーカーは重い解析処理と生成処理を担当する。

- `ffmpeg` によるフレーム抽出
- 安定フレーム選定
- OCR
- アプリ名正規化
- 辞書マッチング
- 候補生成
- PNG アイコン生成

## 実装時の最重要制約

- Web アプリとして実装する。
- 個人利用を前提に、過剰な基盤を導入しない。
- 解析結果は推定として扱い、ユーザー確認を必須にする。
- 録画ファイル、解析結果、生成物を削除できるようにする。
- サードパーティのロゴや既存アプリアイコンをコピーしない。
- 生成アイコンはオリジナルで汎用的な表現にする。
- OCR 結果からインストール済みアプリ一覧を取得したと主張しない。
- ホーム画面への自動配置を実装できるかのように扱わない。

## 禁止事項

- iOS ネイティブアプリとして新規実装すること。
- App Store 審査向けの設計を主軸にすること。
- Swift、SwiftUI、Vision、AVFoundation を採用技術として追加すること。
- private API や SpringBoard 関連の実装を提案すること。
- インストール済みアプリ一覧を直接取得する実装を作ること。
- 隠し URL スキーム探索をアプリ検出の主手段にすること。
- DB、認証、キュー、外部ストレージを初期 MVP に追加すること。
- クラウド OCR をデフォルト処理にすること。
- 解析結果をユーザー確認なしで確定扱いすること。
- ブランドロゴに似せたアイコンを自動生成すること。

## 推奨ディレクトリ構成

```text
app/
  api/
  page.tsx
  layout.tsx

components/
  upload/
  analysis/
  review/
  icon-studio/

lib/
  jobs/
  storage/
  schemas/

worker/
  frame_extraction/
  ocr/
  matching/
  icon_generation/

data/
  app-name-dictionary.json
  default-icon-themes.json

uploads/
tmp/
artifacts/
```

各ディレクトリの責務は次の通り。

- `app/`: Next.js の画面と API
- `components/`: UI コンポーネント
- `lib/jobs/`: 解析ジョブ起動と状態管理
- `lib/storage/`: ローカルファイル保存の読み書き
- `lib/schemas/`: TypeScript 側の型とバリデーション
- `worker/`: Python 側の解析処理
- `data/`: 辞書とテーマ定義
- `uploads/`: 取り込んだ録画
- `tmp/`: 解析中の一時ファイル
- `artifacts/`: OCR 結果、生成アイコン、書き出しファイル

## 参照元ドキュメント

- `CODEX_PROJECT_BRIEF.md`
- `README.md`
- `docs/superpowers/specs/2026-06-02-web-docs-design.md`
- `docs/superpowers/plans/2026-06-02-web-docs.md`

## トラブルシューティング参照

開発サーバー、PowerShell、in-app browser 連携で既知の失敗例がある場合は `docs/troubleshooting.md` を参照する。
特にローカル検証では、ブラウザで開いているポートの `/api/jobs` が `Content-Type: application/json` を返すことを確認してから進める。
