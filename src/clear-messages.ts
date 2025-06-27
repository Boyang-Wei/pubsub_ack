import { Config } from './config';
import { logInfo, logError } from './logger';
import { PubSub } from '@google-cloud/pubsub';
import dayjs from 'dayjs';

const config = Config.getInstance();

export async function clearMessages() {
  logInfo('=== 清空消息 ===');
  
  const subscriptionName = config.getSubscriptionName();
  logInfo(`订阅名称: ${subscriptionName}`);

  const pubSubClient = new PubSub();
  const subscription = pubSubClient.subscription(subscriptionName, {
    flowControl: {
      maxMessages: 100, // 一次拉取更多消息
    },
  });

  let clearedCount = 0;
  let timeoutId: NodeJS.Timeout;

  return new Promise<void>((resolve) => {
    const messageHandler = async (message: any) => {
      try {
        // 解析消息内容
        const messageData = message.data ? message.data.toString() : '无数据';
        const publishTime = message.publishTime ? 
          dayjs(message.publishTime.toDate()).format('YYYY-MM-DD HH:mm:ss') : 
          '未知时间';
        
        // 尝试解析JSON数据
        let parsedData = null;
        try {
          parsedData = JSON.parse(messageData);
        } catch (e) {
          // 如果不是JSON格式，使用原始数据
        }

        // 打印消息详情
        logInfo(`📨 消息 ${clearedCount + 1}:`);
        logInfo(`   ID: ${message.id}`);
        logInfo(`   发布时间: ${publishTime}`);
        logInfo(`   数据长度: ${messageData.length} 字符`);
        
        if (parsedData) {
          logInfo(`   数据类型: JSON`);
          logInfo(`   数据内容: ${JSON.stringify(parsedData, null, 2).substring(0, 200)}${JSON.stringify(parsedData).length > 200 ? '...' : ''}`);
        } else {
          logInfo(`   数据类型: 文本`);
          logInfo(`   数据内容: ${messageData.substring(0, 200)}${messageData.length > 200 ? '...' : ''}`);
        }
        
        // 显示消息属性
        if (message.attributes && Object.keys(message.attributes).length > 0) {
          logInfo(`   属性: ${JSON.stringify(message.attributes)}`);
        }
        
        logInfo(`   ✅ 已确认并清空`);
        logInfo(''); // 空行分隔

        message.ack();
        clearedCount++;
      } catch (error) {
        logError('清空消息失败', error);
      }
    };

    subscription.on('message', messageHandler);

    subscription.on('error', (error) => {
      logError('订阅发生错误', error);
    });

    // 5秒后停止清空
    timeoutId = setTimeout(() => {
      subscription.removeListener('message', messageHandler);
      subscription.close();
      logInfo(`🎯 清空完成，共清空 ${clearedCount} 条消息`);
      resolve();
    }, 5000);

    logInfo('🚀 开始清空消息...');
  });
}

// 如果直接运行此文件
if (require.main === module) {
  clearMessages()
    .then(() => {
      logInfo('✅ 清空消息完成');
      process.exit(0);
    })
    .catch((error) => {
      logError('❌ 清空消息失败', error);
      process.exit(1);
    });
} 