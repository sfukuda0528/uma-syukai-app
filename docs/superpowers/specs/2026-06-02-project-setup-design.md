# Project Setup Design

## 概要

`README.md` と `CODEX.md` に沿って、個人利用向けのハイブリッド Web アプリとして開発を始められる最小構成を作る。対象は App Store 配布や iOS ネイティブ実装ではなく、Next.js の UI/API と Python ワーカーを組み合わせるローカル実行前提の MVP である。

## 方針

- フロントエンドと軽量 API の土台は `Next.js`, `React`, `TypeScript`, `Tailwind CSS` で作る。
- 画面はホーム画面録画のアップロード、解析状況、候補レビュー、テーマ選択、生成物ダウンロードの流れが分かる作業用 UI にする。
- 重い処理は `worker/` 以下の Python ワーカー責務として分離し、初期状態では README と依存定義だけを置く。
- ローカル保存領域として `uploads/`, `tmp/`, `artifacts/` を作り、`.gitkeep` で空ディレクトリを保持する。
- DB、認証、キュー、クラウド OCR、iOS ネイティブ API は導入しない。

## 完了条件

- `npm run lint` と `npm run build` で Next.js 側の最小構成を検証できる。
- `package.json` に開発コマンドが定義されている。
- README/CODEX の推奨ディレクトリ構成が実体として存在する。
- Python が未導入でも、ワーカー導入に必要な依存候補と責務が分かる。
