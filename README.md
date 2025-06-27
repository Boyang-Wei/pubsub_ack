# PubSub ACK期限测试项目

这个项目用于测试Google Cloud PubSub的ACK期限设置功能。

## 项目结构

```
├── src/
│   ├── config.ts          # 配置管理
│   ├── logger.ts          # 日志服务
│   ├── types.ts           # 类型定义
│   ├── publisher.ts       # 消息发布者
│   └── subscriber.ts      # 消息订阅者
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## 安装依赖

```bash
npm install
```

## 配置

1. 复制环境变量示例文件：
```bash
cp env.example .env
```

2. 编辑 `.env` 文件，设置你的GCP项目信息：
```env
GOOGLE_CLOUD_PROJECT=your-project-id
TOPIC_NAME=diamond-kla-scraping-requests
SUBSCRIPTION_NAME=diamond-kla-scraper-worker
ACK_DEADLINE_SECONDS=120
```

3. 确保你有GCP的认证凭据（可以通过 `gcloud auth application-default login` 设置）

## 使用方法

### 1. 发送测试消息

```bash
npm run publish
```

这会将一个测试消息发送到指定的topic。

### 2. 启动订阅者（测试ACK期限）

```bash
npm run subscribe
```

订阅者会：
- 连接到指定的subscription
- 设置ACK期限（默认120秒）
- 模拟30秒的处理时间
- 每5秒输出处理进度

### 3. 测试ACK期限

1. 首先启动订阅者：
```bash
npm run subscribe
```

2. 在另一个终端发送消息：
```bash
npm run publish
```

3. 观察订阅者的输出，验证ACK期限是否生效

## 测试场景

### 场景1：正常ACK期限
- 设置ACK期限为120秒
- 处理时间为30秒
- 预期结果：消息成功处理并ACK

### 场景2：ACK期限不足
- 设置ACK期限为10秒
- 处理时间为30秒
- 预期结果：消息超时，重新投递

### 场景3：边界测试
- 设置ACK期限为30秒
- 处理时间为30秒
- 预期结果：刚好在期限内完成

## 注意事项

1. 确保GCP项目中有对应的topic和subscription
2. 确保有足够的权限访问PubSub
3. 测试时注意观察日志输出，了解ACK期限的实际效果
4. 可以通过修改 `.env` 文件中的 `ACK_DEADLINE_SECONDS` 来测试不同的期限设置

## 故障排除

如果遇到认证问题：
```bash
gcloud auth application-default login
```

如果遇到权限问题，确保服务账号有以下权限：
- `pubsub.subscriber`
- `pubsub.publisher`
- `pubsub.viewer` 