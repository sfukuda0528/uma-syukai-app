# TODO: 未実装機能整理

調査日: 2026-06-03

この一覧は `README.md` の MVP 完了条件と、現状の実装ファイルを照合して作成したものです。現状はアップロード、ジョブ管理、フレーム抽出、OCR による候補抽出、辞書照合、候補レビュー、PNG 生成、個別ダウンロード、削除まで接続済みです。

## MVP ブロッカー

- [x] 録画アップロード API を実装する
  - `app/api/jobs` で動画アップロードを受け付ける。
  - `components/upload/upload-panel.tsx` の file input と「解析ジョブを開始」ボタンを API 呼び出しに接続済み。
  - `uploads/` へ安全に保存する処理、ファイル種別・サイズ検証、ジョブ ID 発行を実装済み。

- [x] 解析ジョブ管理を実装する
  - `lib/jobs/store.ts` で作成・更新・取得・失敗記録に使える JSON ジョブストアを実装済み。
  - DB は使わず、`artifacts/jobs/*.json` にメタデータを保存する。
  - `StatusPanel` は実ジョブ状態を参照する。

- [x] Next.js から Python ワーカーを起動する導線を実装する
  - `worker/run_analysis.py` を追加済み。
  - Next.js Route Handler からワーカーを呼び出し、ジョブ状態を更新する最小導線を実装済み。
  - 現状のワーカーは解析スタブなので、次は ffmpeg/OCR の実処理を接続する。

- [x] `ffmpeg` による代表フレーム抽出を実装する
  - `worker/frame_extraction/` に抽出処理を実装済み。
  - `tmp/<jobId>/frames/` にフレームを出力し、解析結果 JSON へフレーム情報を残す。
  - 失敗ケースとして、短すぎる動画、壊れた動画、非対応形式、`ffmpeg` 未インストールを失敗状態として扱う。
  - 現在の実行環境では `ffmpeg` が未インストールのため、API smoke では期待通り `failed` になることを確認済み。

- [x] OCR によるアプリ名候補抽出を実装する
  - `worker/ocr/extractor.py` で EasyOCR の日本語・英語 reader を生成し、代表フレームから rawText、confidence、frame を抽出する処理を実装済み。
  - OCR の壊れた結果や空文字は候補化せず、フレーム欠落時は失敗扱いにする。
  - OCR 結果は確定扱いにせず、レビュー前提の `pending` ステータスで保存する。

- [x] アプリ名の正規化・辞書照合を実装する
  - `worker/matching/app_name_matcher.py` で `data/app-name-dictionary.json` を読み込む処理と単体テストは実装済み。
  - OCR の揺れ、英日表記、空白、記号、重複候補を整理する処理は部品として実装済み。
  - `worker/run_analysis.py` の本流から OCR 結果を辞書照合へ接続し、ジョブ候補へ信頼度スコア、照合理由、照合 alias を保存する処理を実装済み。

- [x] 候補レビュー UI を実データ編集に対応させる
  - `CandidateReview` を実ジョブ候補の確認・編集・却下・追加操作に接続済み。
  - `PATCH /api/jobs/[jobId]/candidates` で確認済み、編集済み、却下済み、追加済みの状態をジョブ結果へ保存する。
  - 画面更新後や再読み込み後も `artifacts/jobs/*.json` からレビュー結果を復元できる。

- [x] アイコン生成処理を実装する
  - `ThemePicker` をテーマ選択状態と生成 API に接続済み。
  - 追加依存なしの Node 側 PNG 生成器で、確認済み候補から 1024x1024 PNG を生成する。
  - ブランドロゴや既存アプリアイコンをコピーせず、頭文字と抽象図形だけで生成する。

- [x] 生成物のプレビューとダウンロードを実装する
  - `OutputPanel` の生成ボタンを `POST /api/jobs/[jobId]/icons` に接続済み。
  - 個別 PNG の配布 Route Handler、ファイル名ルール、生成済み一覧、再生成導線を実装済み。
  - MVP では個別ダウンロードを優先し、ZIP 一括ダウンロードは後続候補として扱う。

- [x] 録画、解析結果、生成物の削除を実装する
  - `DELETE /api/jobs/[jobId]` と削除 UI を実装済み。
  - 対象ジョブに紐づく `uploads/`, `tmp/`, `artifacts/` のファイルをまとめて削除する。
  - 誤操作を避ける確認 UI と、削除後の画面状態リセットを実装済み。

- [x] API と UI のエラー・空状態を実装する
  - アップロード以外のタブでも API エラーを表示する共通バナーを追加済み。
  - OCR 候補なし、生成済みアイコンなし、生成失敗、ファイル削除失敗の表示を実装済み。
  - ジョブ状態、候補数、生成数をヘッダーの進捗表示に反映する。

## 実装品質・検証

- [x] `npm run lint` を通す
  - 2026-06-03 に通過確認済み。

- [x] `npm run build` を通す
  - 2026-06-03 に通過確認済み。

- [x] ワーカー単体の確認コマンドを用意する
  - `npm run test:worker` で Python unittest を起動するコマンドを追加済み。
  - Python は `C:\Users\kyome\AppData\Local\Python\bin\python.exe` を解決して実行できることを確認済み。
  - フレーム抽出、OCR、辞書照合、候補 JSON 生成を unittest で個別に検証できるようにした。PNG 生成は Node 側の `npm run test` で検証する。

- [x] データモデルを実運用用に整理する
  - 現在の `AppCandidate` は最小型で、ページ番号、グリッド位置、候補ステータス、生成物パスなどが不足している。
  - `AnalysisJob` は抽出フレーム一覧を保持できるように拡張済み。
  - 候補ステータスと生成物一覧を扱える形へ拡張済み。ページ番号、グリッド位置、ワーカー詳細ステップは後続拡張として扱う。

## 後続拡張候補

- [x] OCR エンジンの精度比較を行う
  - `worker/ocr/compare_engines.py` に同一フレームを複数 OCR エンジンで比較する集計ハーネスを追加済み。
  - raw 件数、ユニークテキスト、平均 confidence、エンジン失敗を横並びで確認できる。
  - `PaddleOCR` は追加依存を即導入せず、同じ runner 形式で差し込める後続実装ポイントとして整理済み。

- [x] テーマ編集 UI を追加する
  - 現状は `data/default-icon-themes.json` の固定テーマのみ。
  - 色、文字、抽象図形、背景スタイルをユーザーが調整できるようにする。
  - `ThemePicker` にカスタムテーマ色編集を追加し、生成 API へ編集済みテーマを送信するようにした。

- [x] ZIP 一括ダウンロードを追加する
  - MVP の個別ダウンロード後に、全生成 PNG と設定手順をまとめて出力する。
  - `GET /api/jobs/[jobId]/icons/archive` と ZIP 生成器を追加し、生成済み PNG と `README.txt` をまとめて保存できる。

- [x] ブラウザ側での軽量フレームプレビューを追加する
  - 解析前に動画内容を確認し、不要な範囲を避けられるようにする。
  - アップロード画面で選択動画をローカル object URL としてプレビューできる。

- [x] 解析前の動画トリミングを追加する
  - 長すぎる録画や不要区間を削って、ワーカー処理時間を短縮する。
  - アップロード時に開始秒・終了秒を送信し、Python ワーカーが ffmpeg の `-ss` / `-to` へ反映する。

- [x] ローカル DB またはジョブキュー導入を検討する
  - 複数ジョブや履歴管理が必要になった段階で検討する。MVP では追加しない。
  - `docs/post-mvp-extension-decisions.md` に、現時点では JSON ストアと直接ワーカー起動を維持する判断を記録済み。

- [x] クラウド OCR の任意利用を検討する
  - プライバシー方針と明示的な opt-in を前提に、必要になった場合だけ検討する。
  - `docs/post-mvp-extension-decisions.md` に opt-in、送信前確認、削除導線を必須条件として整理済み。

## 確認メモ

- `AGENTS.md` から `@RTK.md` が参照されているが、調査時点では `C:\ws\uma-syukai-app\RTK.md` は存在しなかった。
- `lib/schemas/candidates.ts` の `sampleCandidates` は残っているが、画面表示は実ジョブ候補へ接続済み。
- `app/api/` とワーカー実装ディレクトリは作成済み。
