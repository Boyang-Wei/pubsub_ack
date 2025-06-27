import { Config } from './config';
import { logInfo, logError } from './logger';
import { PubSub } from '@google-cloud/pubsub';
import * as dotenv from 'dotenv';

// 加载.env文件
dotenv.config();

const config = Config.getInstance();

// 解析命令行参数
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  let showDetails = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--details':
        showDetails = true;
        break;
      case '--help':
        logInfo('使用方法:');
        logInfo('  npm run check-pending');
        logInfo('  npm run check-pending -- --details');
        logInfo('');
        logInfo('参数说明:');
        logInfo('  --details: 显示详细信息');
        logInfo('  --help: 显示帮助信息');
        process.exit(0);
    }
  }

  return { showDetails };
}

export async function checkPendingMessages(showDetails = false) {
  logInfo('=== 检查未拉取消息 ===');
  
  const subscriptionName = config.getSubscriptionName();
  logInfo(`订阅名称: ${subscriptionName}`);

  // 检查环境变量中的credential路径
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialPath) {
    logInfo(`使用环境变量中的credential文件: ${credentialPath}`);
    
    // 验证文件是否存在
    try {
      const fs = require('fs');
      if (!fs.existsSync(credentialPath)) {
        logError(`❌ Credential文件不存在: ${credentialPath}`);
        throw new Error(`Credential文件不存在: ${credentialPath}`);
      }
      
      // 读取并验证JSON格式
      const credentialContent = fs.readFileSync(credentialPath, 'utf8');
      JSON.parse(credentialContent); // 验证JSON格式
      
      logInfo('✅ Credential文件验证成功');
    } catch (error) {
      logError('❌ Credential文件验证失败', error);
      throw error;
    }
  } else {
    logInfo('使用默认认证方式');
  }

  try {
    const pubSubClient = new PubSub();
    const subscription = pubSubClient.subscription(subscriptionName);

    // 获取订阅信息
    const [subscriptionInfo] = await subscription.getMetadata();
    
    logInfo('📊 订阅信息:');
    logInfo(`   名称: ${subscriptionInfo.name}`);
    logInfo(`   主题: ${subscriptionInfo.topic}`);
    logInfo(`   ACK期限: ${subscriptionInfo.ackDeadlineSeconds}秒`);
    
    if (showDetails) {
      logInfo(`   消息保留期限: ${subscriptionInfo.messageRetentionDuration?.seconds || '默认'}秒`);
      logInfo(`   启用消息排序: ${subscriptionInfo.enableMessageOrdering || false}`);
      logInfo(`   启用Exactly Once: ${subscriptionInfo.enableExactlyOnceDelivery || false}`);
    }

    // 获取主题信息
    const topicName = subscriptionInfo.topic;
    if (topicName) {
      logInfo('');
      logInfo('📈 消息统计:');
      logInfo(`   主题: ${topicName}`);
      
      // 使用消息监听的方式检查未确认消息
      let messageCount = 0;
      let hasMessages = false;
      
      return new Promise<void>((resolve) => {
        const messageHandler = (message: any) => {
          hasMessages = true;
          messageCount++;
          
          if (showDetails) {
            const publishTime = message.publishTime ? 
              new Date(message.publishTime.toDate()).toLocaleString() : 
              '未知时间';
            
            logInfo(`   消息 ${messageCount}:`);
            logInfo(`     ID: ${message.id}`);
            logInfo(`     发布时间: ${publishTime}`);
            logInfo(`     数据长度: ${message.data?.length || 0} 字节`);
          }
          
          // 不确认消息，让它们保持未确认状态
          message.nack();
        };

        subscription.on('message', messageHandler);

        subscription.on('error', (error) => {
          logError('检查消息时发生错误', error);
          subscription.removeListener('message', messageHandler);
          subscription.close();
          resolve();
        });

        // 3秒后停止检查
        setTimeout(() => {
          subscription.removeListener('message', messageHandler);
          subscription.close();
          
          if (hasMessages) {
            logInfo(`   未确认消息: 发现 ${messageCount} 条消息`);
          } else {
            logInfo(`   未确认消息: 无消息等待处理`);
          }
          
          logInfo('');
          logInfo('✅ 检查完成');
          resolve();
        }, 3000);
      });
    }

    logInfo('');
    logInfo('✅ 检查完成');

  } catch (error) {
    logError('检查未拉取消息失败', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const { showDetails } = parseCommandLineArgs();
  
  checkPendingMessages(showDetails)
    .then(() => {
      logInfo('检查完成');
      process.exit(0);
    })
    .catch((error) => {
      logError('检查失败', error);
      process.exit(1);
    });
} 