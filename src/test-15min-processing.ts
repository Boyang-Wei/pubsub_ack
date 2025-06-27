import { Config } from './config';
import { logInfo, logError } from './logger';
import { PubSub } from '@google-cloud/pubsub';

const config = Config.getInstance();

export async function test15MinProcessing() {
  logInfo('=== 15分钟处理测试 ===');
  
  const subscriptionName = config.getSubscriptionName();
  logInfo(`订阅名称: ${subscriptionName}`);
  logInfo(`ACK期限: 10秒`);
  logInfo(`处理时间: 15分钟 (900秒)`);
  logInfo(`预期结果: 消息重新投递（因为处理时间超过ACK期限）`);

  const pubSubClient = new PubSub();
  const subscription = pubSubClient.subscription(subscriptionName, {
    flowControl: {
      maxMessages: 1, // 只处理一条消息
    },
  });

  let messageReceived = false;
  let timeoutId: NodeJS.Timeout;

  return new Promise<void>((resolve) => {
    const messageHandler = async (message: any) => {
      if (messageReceived) {
        message.nack(); // 拒绝重复消息
        return;
      }

      messageReceived = true;
      
      try {
        // 解析消息内容
        const messageData = message.data ? message.data.toString() : '无数据';
        const publishTime = message.publishTime ? 
          new Date(message.publishTime.toDate()).toLocaleString() : 
          '未知时间';
        
        logInfo('📨 收到消息:');
        logInfo(`   ID: ${message.id}`);
        logInfo(`   发布时间: ${publishTime}`);
        logInfo(`   数据长度: ${messageData.length} 字符`);
        logInfo(`   数据内容: ${messageData.substring(0, 200)}${messageData.length > 200 ? '...' : ''}`);
        
        logInfo('');
        logInfo('⏰ 开始模拟15分钟处理...');
        logInfo('   (这将超过10秒的ACK期限，消息应该会重新投递)');
        
        // 模拟15分钟处理
        const startTime = Date.now();
        const processingTime = 15 * 60 * 1000; // 15分钟
        
        // 每30秒显示一次进度
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = processingTime - elapsed;
          const progress = Math.round((elapsed / processingTime) * 100);
          
          logInfo(`   ⏳ 处理进度: ${progress}% (剩余 ${Math.round(remaining / 1000)} 秒)`);
          
          if (elapsed >= processingTime) {
            clearInterval(progressInterval);
          }
        }, 30000);
        
        // 等待15分钟
        await new Promise(resolve => setTimeout(resolve, processingTime));
        clearInterval(progressInterval);
        
        const totalTime = Date.now() - startTime;
        logInfo('');
        logInfo(`✅ 处理完成! 总耗时: ${Math.round(totalTime / 1000)} 秒`);
        logInfo('   (注意: 由于处理时间超过ACK期限，这条消息可能已经被重新投递)');
        
        // 确认消息
        message.ack();
        logInfo('   ✅ 消息已确认');
        
        // 关闭订阅
        subscription.removeListener('message', messageHandler);
        subscription.close();
        clearTimeout(timeoutId);
        
        logInfo('');
        logInfo('🎯 测试完成!');
        logInfo('   建议检查PubSub控制台，看是否有消息重新投递');
        
        resolve();
      } catch (error) {
        logError('处理消息时发生错误', error);
        message.nack();
        resolve();
      }
    };

    subscription.on('message', messageHandler);

    subscription.on('error', (error) => {
      logError('订阅发生错误', error);
      resolve();
    });

    // 设置超时（16分钟）
    timeoutId = setTimeout(() => {
      if (!messageReceived) {
        logInfo('⏰ 超时: 16分钟内未收到消息');
      }
      subscription.removeListener('message', messageHandler);
      subscription.close();
      resolve();
    }, 16 * 60 * 1000);

    logInfo('🚀 开始监听消息...');
  });
}

// 如果直接运行此文件
if (require.main === module) {
  test15MinProcessing()
    .then(() => {
      logInfo('测试结束');
      process.exit(0);
    })
    .catch((error) => {
      logError('测试失败', error);
      process.exit(1);
    });
} 