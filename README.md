# PubSub ACK期限テスト

Google Cloud PubSubのACK期限設定をテストするためのTypeScriptプロジェクトです。

## 📋 機能

### 1. **メッセージクリア** (`npm run clear`)
- サブスクリプション内のすべてのメッセージを詳細表示してクリア
- 各メッセージのID、公開時間、データ内容を表示
- 自動的にACKしてメッセージを削除

### 2. **未取得メッセージチェック** (`npm run check-pending`)
- サブスクリプション内の未処理メッセージをチェック
- 詳細モード: `npm run check-pending-details`

### 3. **15分処理テスト** (`npm run test-15min`)
- 15分間のメッセージ処理をシミュレート
- 処理進捗を30秒ごとに表示
- ACK期限タイムアウトの状況をテスト
- 予想結果: メッセージの再配信（15分 > 10秒ACK期限のため）

## 🚀 セットアップ

### 前提条件
- Node.js (v14以上)
- Google Cloud Project
- PubSub Topic: `diamond-kla-scraping-requests`
- PubSub Subscription: `diamond-kla-scraper-worker`

### インストール
```bash
# 依存関係をインストール
npm install

# TypeScriptをビルド
npm run build
```

### 環境変数の設定
`.env`ファイルを作成し、以下を設定してください：

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
PUBSUB_TOPIC_NAME=diamond-kla-scraping-requests
PUBSUB_SUBSCRIPTION_NAME=diamond-kla-scraper-worker
```

## 📖 使用方法

### メッセージのクリア
```bash
# すべてのメッセージをクリア
npm run clear
```

### 未取得メッセージのチェック
```bash
# 未取得メッセージの数をチェック
npm run check-pending

# 詳細情報を表示
npm run check-pending-details
```

### 15分処理テスト
```bash
# 15分間の処理をシミュレート
npm run test-15min
```

## 🔧 設定

### プロジェクト設定
- **プロジェクトID**: Google Cloud ProjectのID
- **トピック名**: `diamond-kla-scraping-requests`
- **サブスクリプション名**: `diamond-kla-scraper-worker`
- **ACK期限**: 10秒（デフォルト）

### テスト設定
- **処理時間**: 15分（900秒）
- **進捗表示間隔**: 30秒
- **タイムアウト**: 16分

## 📊 テスト結果の解釈

### 15分処理テスト
1. **メッセージ受信**: サブスクリプションからメッセージを受信
2. **処理開始**: 15分間の処理をシミュレート
3. **進捗表示**: 30秒ごとに処理進捗を表示
4. **ACK期限超過**: 10秒のACK期限を超過
5. **再配信**: メッセージが再配信される可能性
6. **処理完了**: 15分後にメッセージをACK

### 期待される動作
- ACK期限（10秒）を超過するため、メッセージが再配信される
- Google Cloud Consoleで再配信を確認できる
- 処理完了後にメッセージが正常にACKされる

## 🛠️ 開発

### ファイル構成
```
src/
├── config.ts              # 設定管理
├── logger.ts              # ログサービス
├── types.ts               # 型定義
├── clear-messages.ts      # メッセージクリア機能
├── check-pending-messages.ts  # 未取得メッセージチェック
└── test-15min-processing.ts   # 15分処理テスト
```

### ビルド
```bash
# TypeScriptをコンパイル
npm run build

# 実行
npm start
```

## 🔍 トラブルシューティング

### よくある問題

1. **認証エラー**
   - Google Cloud認証が正しく設定されているか確認
   - サービスアカウントキーが有効か確認

2. **メッセージが受信されない**
   - トピックにメッセージが存在するか確認
   - サブスクリプション名が正しいか確認

3. **ACK期限エラー**
   - 処理時間がACK期限を超過していないか確認
   - サブスクリプションのACK期限設定を確認

### ログの確認
すべての操作は詳細なログを出力します。エラーが発生した場合は、ログメッセージを確認してください。

## 📝 注意事項

- このプロジェクトはテスト目的で作成されています
- 本番環境での使用は推奨されません
- ACK期限の設定は慎重に行ってください
- メッセージの再配信は追加コストが発生する可能性があります

## 🤝 貢献

バグ報告や機能要望は、Issueとして報告してください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。 