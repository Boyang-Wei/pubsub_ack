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
- **v1.SubscriberClient**を使用
- **毎分自動的に租期を延長**（60秒に設定）
- 処理進捗を30秒ごとに表示
- 予想結果: メッセージの再配信なし（租期延長により）

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
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

### Google Cloud認証の設定

#### 方法1: 環境変数を使用（推奨）
共有環境での使用に適しています：

```bash
# 環境変数にサービスアカウントキーファイルのパスを設定
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"

# または、.envファイルに追加
echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json" >> .env
```

#### 方法2: デフォルト認証を使用
```bash
# Google Cloud CLIで認証
gcloud auth application-default login
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

### 15分処理テスト（租期延長機能付き）
```bash
# 15分間の処理をシミュレート（毎分租期延長）
npm run test-15min
```

## 🔧 設定

### プロジェクト設定
- **プロジェクトID**: Google Cloud ProjectのID
- **トピック名**: `diamond-kla-scraping-requests`
- **サブスクリプション名**: `diamond-kla-scraper-worker`
- **ACK期限**: 10秒（デフォルト）

### 認証設定
- **GOOGLE_APPLICATION_CREDENTIALS**: サービスアカウントキーファイルのパス
- **認証方式**: 環境変数優先、デフォルト認証フォールバック

### テスト設定
- **処理時間**: 15分（900秒）
- **租期延長間隔**: 毎分（60秒）
- **延長後のACK期限**: 60秒
- **進捗表示間隔**: 30秒
- **タイムアウト**: 16分

## 📊 テスト結果の解釈

### 15分処理テスト（租期延長機能付き）
1. **メッセージ受信**: v1.SubscriberClientでメッセージを受信
2. **処理開始**: 15分間の処理をシミュレート
3. **租期延長**: 毎分自動的にACK期限を60秒に延長
4. **進捗表示**: 30秒ごとに処理進捗を表示
5. **処理完了**: 15分後にメッセージをACK

### 期待される動作
- 毎分租期を延長するため、メッセージが再配信されない
- 処理完了後にメッセージが正常にACKされる
- 長時間処理でも安全にメッセージを保持

### 租期延長の仕組み
- **初期ACK期限**: 10秒
- **延長間隔**: 毎分
- **延長後の期限**: 60秒
- **延長方法**: `modifyAckDeadline` APIを使用

## 🛠️ 開発

### ファイル構成
```
src/
├── config.ts              # 設定管理
├── logger.ts              # ログサービス
├── types.ts               # 型定義
├── clear-messages.ts      # メッセージクリア機能
├── check-pending-messages.ts  # 未取得メッセージチェック
└── test-15min-processing.ts   # 15分処理テスト（租期延長機能付き）
```

### 使用技術
- **v1.SubscriberClient**: Google Cloud PubSubの低レベルAPI
- **streamingPull**: リアルタイムメッセージ受信
- **modifyAckDeadline**: ACK期限の動的延長
- **dotenv**: 環境変数管理

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
   - `GOOGLE_APPLICATION_CREDENTIALS`環境変数が正しく設定されているか確認
   - サービスアカウントキーファイルが存在し、有効か確認
   - ファイルのJSON形式が正しいか確認

2. **メッセージが受信されない**
   - トピックにメッセージが存在するか確認
   - サブスクリプション名が正しいか確認
   - プロジェクトIDが正しいか確認

3. **租期延長エラー**
   - ネットワーク接続が安定しているか確認
   - PubSub APIの権限が十分か確認
   - エラーログを確認

### 認証の確認
```bash
# 環境変数が設定されているか確認
echo $GOOGLE_APPLICATION_CREDENTIALS

# サービスアカウントキーファイルの存在確認
ls -la $GOOGLE_APPLICATION_CREDENTIALS

# JSON形式の確認
cat $GOOGLE_APPLICATION_CREDENTIALS | jq .
```

### ログの確認
すべての操作は詳細なログを出力します。エラーが発生した場合は、ログメッセージを確認してください。

## 📝 注意事項

- このプロジェクトはテスト目的で作成されています
- 本番環境での使用は推奨されません
- ACK期限の設定は慎重に行ってください
- 租期延長機能により、長時間処理でもメッセージの再配信を防げます
- 共有環境では`GOOGLE_APPLICATION_CREDENTIALS`環境変数の使用を推奨します

## 🤝 貢献

バグ報告や機能要望は、Issueとして報告してください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。 