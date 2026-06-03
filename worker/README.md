# Python Worker

`worker/` は動画解析とアイコン生成の重い処理を担当する領域です。

初期 MVP では Next.js からジョブを起動し、Python 側で次の処理を段階的に実装します。

- `ffmpeg` による代表フレーム抽出
- 安定フレーム選定
- `PaddleOCR` または `EasyOCR` による OCR
- アプリ名候補の正規化
- `data/app-name-dictionary.json` に基づく辞書照合
- `Pillow` による PNG アイコン生成

この領域では iOS ネイティブ API、インストール済みアプリ一覧の直接取得、ブランドロゴのコピー生成を扱いません。

## 辞書照合

`worker/matching/app_name_matcher.py` は OCR 由来の文字列を受け取り、アプリ名辞書の `canonicalName` と `aliases` に照合します。照合結果には、表示名、信頼度、照合理由、照合に使った alias を含め、同じ表示名の候補は最も信頼度の高いものだけを残します。
