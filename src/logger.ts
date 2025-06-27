export function logInfo(message: string, ...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.log(`[INFO] ${timestamp} - ${message}`, ...args);
}

export function logError(message: string, error?: any): void {
  const timestamp = new Date().toISOString();
  console.error(`[ERROR] ${timestamp} - ${message}`, error);
}

export function logWarn(message: string, ...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.warn(`[WARN] ${timestamp} - ${message}`, ...args);
} 