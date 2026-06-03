# Post-MVP Extension Decisions

調査日: 2026-06-03

## OCR エンジン比較

`worker/ocr/compare_engines.py` に、同じ代表フレームを複数 OCR エンジンで処理した結果を横並びに集計するハーネスを追加した。現時点では既存の EasyOCR 実装を標準エンジンとし、PaddleOCR などの追加エンジンは同じ `EngineRunner` 形の関数として差し込める。

集計項目はフレーム数、抽出 raw 件数、ユニークテキスト、平均 confidence、エンジンごとの失敗メッセージ。

## ローカル DB / ジョブキュー

現状は個人利用の単一マシン運用で、ジョブ JSON ストアと直接ワーカー起動で MVP 要件を満たしている。複数ジョブの同時実行、履歴検索、再試行、長時間ワーカー監視が必要になるまでは DB とキューは導入しない。

導入する段階では、現在の `lib/jobs/store.ts` を Repository 境界として維持し、保存先だけ SQLite などへ置き換える。ジョブキューは Route Handler から直接 Python を起動している `lib/worker/runner.ts` の境界で差し替える。

## クラウド OCR

クラウド OCR は録画フレームを外部送信するため、デフォルトでは無効のままにする。導入する場合は明示的 opt-in、送信前の確認、送信フレームの削除導線、利用サービス名の表示を必須条件にする。

初期実装ではローカル OCR とレビュー UI を優先し、クラウド OCR は `worker/ocr/compare_engines.py` の比較対象として安全要件が満たせる段階で追加する。
