import { Config } from './config';
import { logInfo, logError } from './logger';
import { PubSub } from '@google-cloud/pubsub';

const config = Config.getInstance();

export async function checkPendingMessages() {
  logInfo('=== 检查未确认消息 ===');
  const subscriptionName = config.getSubscriptionName();
  
  const pubSubClient = new PubSub();
  const subscription = pubSubClient.subscription(subscriptionName);
  
  let messageCount = 0;
  const timeout = setTimeout(() => {
    if (messageCount === 0) {
      logInfo('✅ 没有未确认消息');
    }
    subscription.close();
    process.exit(0);
  }, 3000);
  
  subscription.on('message', (message: any) => {
    messageCount++;
    const age = Math.floor((Date.now() - new Date(message.publishTime).getTime()) / 1000);
    logInfo(`消息 ${messageCount}: ID=${message.id}, 年龄=${age}秒`);
    message.nack(); // 不确认，让消息保持未确认状态
  });
  
  subscription.on('error', (error) => {
    logError('检查失败', error);
    clearTimeout(timeout);
    process.exit(1);
  });
}

if (require.main === module) {
  checkPendingMessages();
} 