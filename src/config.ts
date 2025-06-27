import dotenv from 'dotenv';

dotenv.config();

export class Config {
  private static instance: Config;

  private constructor() {}

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public getGoogleCloudProject(): string {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (!project) {
      throw new Error('GOOGLE_CLOUD_PROJECT环境变量未设置');
    }
    return project;
  }

  public getTopicName(): string {
    const topicName = process.env.TOPIC_NAME;
    if (!topicName) {
      throw new Error('TOPIC_NAME环境变量未设置');
    }
    return topicName;
  }

  public getSubscriptionName(): string {
    const subscriptionName = process.env.SUBSCRIPTION_NAME;
    if (!subscriptionName) {
      throw new Error('SUBSCRIPTION_NAME环境变量未设置');
    }
    return subscriptionName;
  }

  public getAckDeadlineSeconds(): number {
    const ackDeadline = process.env.ACK_DEADLINE_SECONDS;
    if (!ackDeadline) {
      return 60; // 默认60秒
    }
    return parseInt(ackDeadline, 10);
  }
} 