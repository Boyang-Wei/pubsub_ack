import { Config } from './config';
import { logInfo, logError } from './logger';
import { SubscriberClient } from '@google-cloud/pubsub/build/src/v1';
import * as dotenv from 'dotenv';

// 加载.env文件
dotenv.config();

const config = Config.getInstance();

interface PubSubConfig {
  projectId: string;
  subscriptionName: string;
  extensionIntervalSeconds?: number;
  extensionDurationSeconds?: number;
  maxExtensionCount?: number;
}

export async function test15MinProcessing() {
  logInfo('=== 15分钟处理测试 (使用v1.SubscriberClient - 改进版) ===');
  
  const subscriptionName = config.getSubscriptionName();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  
  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID环境变量未设置');
  }

  // 配置参数（参考代码的配置）
  const pubSubConfig: PubSubConfig = {
    projectId,
    subscriptionName,
    extensionIntervalSeconds: 60, // 每60秒延长一次
    extensionDurationSeconds: 300, // 延长到300秒
    maxExtensionCount: 120, // 最大延长120次
  };

  logInfo(`订阅名称: ${subscriptionName}`);
  logInfo(`项目ID: ${projectId}`);
  logInfo(`ACK期限: 10秒`);
  logInfo(`处理时间: 15分钟 (900秒)`);
  logInfo(`延长间隔: ${pubSubConfig.extensionIntervalSeconds}秒`);
  logInfo(`延长后期限: ${pubSubConfig.extensionDurationSeconds}秒`);
  logInfo(`最大延长次数: ${pubSubConfig.maxExtensionCount}`);

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

  // 创建v1.SubscriberClient
  const subscriberClient = new SubscriberClient();
  
  // 解析订阅名称（参考代码的方式）
  const formattedSubscription = subscriptionName.indexOf('/') >= 0
    ? subscriptionName
    : subscriberClient.subscriptionPath(projectId, subscriptionName);
  
  logInfo(`格式化订阅名称: ${formattedSubscription}`);

  let extensionCount = 0;
  let extensionTimer: NodeJS.Timeout | null = null;
  let isProcessing = false;

  // 拉取消息函数（参考代码的方式）
  async function pullMessage() {
    const request = {
      subscription: formattedSubscription,
      maxMessages: 1,
      allowExcessMessages: false,
    };

    try {
      const [response] = await subscriberClient.pull(request);

      if (!response.receivedMessages || response.receivedMessages.length === 0) {
        return null;
      }

      return response.receivedMessages[0];
    } catch (error) {
      logError('拉取消息失败', error);
      return null;
    }
  }

  // 延长ACK期限函数（参考代码的方式）
  async function extendAckDeadline(message: any): Promise<boolean> {
    const modifyAckRequest = {
      subscription: formattedSubscription,
      ackIds: [message.ackId],
      ackDeadlineSeconds: pubSubConfig.extensionDurationSeconds,
    };

    try {
      await subscriberClient.modifyAckDeadline(modifyAckRequest);
      return true;
    } catch (error) {
      logError('延长ACK期限失败', error);
      return false;
    }
  }

  // 确认消息函数（参考代码的方式）
  async function acknowledgeMessage(message: any): Promise<boolean> {
    const ackRequest = {
      subscription: formattedSubscription,
      ackIds: [message.ackId],
    };

    try {
      await subscriberClient.acknowledge(ackRequest);
      return true;
    } catch (error) {
      logError('确认消息失败', error);
      return false;
    }
  }

  // 开始延长定时器（参考代码的方式）
  function startExtensionTimer(message: any): void {
    extensionTimer = setInterval(async () => {
      try {
        const success = await extendAckDeadline(message);
        if (success) {
          extensionCount++;
          const elapsed = Math.round(extensionCount * (pubSubConfig.extensionIntervalSeconds || 60));
          logInfo(`   🔄 延长租期成功 (第${extensionCount}次, ${elapsed}秒)`);

          if (extensionCount >= (pubSubConfig.maxExtensionCount || 120)) {
            stopExtensionTimer();
            logInfo('   ⚠️ 达到最大延长次数，停止延长');
          }
        }
      } catch (error) {
        logError('延长租期时发生错误', error);
        stopExtensionTimer();
      }
    }, (pubSubConfig.extensionIntervalSeconds || 60) * 1000);
  }

  // 停止延长定时器（参考代码的方式）
  function stopExtensionTimer(): void {
    if (extensionTimer) {
      clearInterval(extensionTimer);
      extensionTimer = null;
    }
  }

  // 处理单条消息（参考代码的方式）
  async function processMessage(message: any): Promise<void> {
    isProcessing = true;
    extensionCount = 0;

    try {
      // 解析消息内容
      const messageData = message.message?.data ? 
        message.message.data.toString() : '无数据';
      const publishTime = message.message?.publishTime ? 
        new Date(message.message.publishTime.toDate()).toLocaleString() : 
        '未知时间';
      
      logInfo('📨 收到消息:');
      logInfo(`   ID: ${message.message?.messageId}`);
      logInfo(`   发布时间: ${publishTime}`);
      logInfo(`   数据长度: ${messageData.length} 字符`);
      logInfo(`   数据内容: ${messageData.substring(0, 200)}${messageData.length > 200 ? '...' : ''}`);
      logInfo(`   ACK ID: ${message.ackId}`);
      
      logInfo('');
      logInfo('⏰ 开始模拟15分钟处理...');
      logInfo('   (将定期延长租期以防止消息重新投递)');
      
      // 开始定期延长ACK期限
      startExtensionTimer(message);
      
      // 每30秒显示一次进度
      const startTime = Date.now();
      const processingTime = 15 * 60 * 1000; // 15分钟
      
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
      
      // 停止延长定时器
      stopExtensionTimer();
      
      const totalTime = Date.now() - startTime;
      logInfo('');
      logInfo(`✅ 处理完成! 总耗时: ${Math.round(totalTime / 1000)} 秒`);
      logInfo(`   总延长次数: ${extensionCount} 次`);
      logInfo('   (由于定期延长租期，消息应该没有被重新投递)');
      
      // 最后延长操作完成后等待2秒（参考代码的方式）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 确认消息
      const success = await acknowledgeMessage(message);
      if (success) {
        logInfo('   ✅ 消息已确认');
      } else {
        logError('   ❌ 消息确认失败');
      }
      
      logInfo('');
      logInfo('🎯 测试完成!');
      logInfo('   由于定期延长租期，消息应该没有被重新投递');
      
    } catch (error) {
      logError('处理消息时发生错误', error);
      stopExtensionTimer();
      throw error;
    } finally {
      isProcessing = false;
    }
  }

  // 主测试逻辑
  try {
    logInfo('🚀 开始拉取消息...');
    
    // 拉取消息
    const message = await pullMessage();
    
    if (!message) {
      logInfo('⏰ 没有消息可处理');
      return;
    }
    
    // 处理消息
    await processMessage(message);
    
  } catch (error) {
    logError('测试失败', error);
    throw error;
  }
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