# Chord Sheet App (Prototype)

バンド演奏時のコード確認用WEBアプリ（プロトタイプ）です。
Vite + React + TypeScript + Tailwind CSS で構築されています。

## 🚀 開発サーバーの起動

ローカル環境でアプリを起動するには、以下のコマンドを実行してください。

```bash
npm run dev
```

コマンド実行後、ターミナルに表示されるURL（通常は `http://localhost:5173`）にブラウザでアクセスすると、アプリが表示されます。

## 📦 ビルド（本番用）

本番環境向けにビルドする場合は以下のコマンドを実行します。

```bash
npm run build
```

生成されたファイルは `dist` ディレクトリに出力されます。

## 📂 プロジェクト構成

- `src/components/`: UIコンポーネント (Header, ChordSheet)
- `src/types/`: データ型定義 (Song, Section, Measure, Beat)
- `src/App.tsx`: メインアプリケーション
