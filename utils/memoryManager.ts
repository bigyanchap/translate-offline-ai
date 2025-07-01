import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MemoryInfo {
  totalMemory: number;
  usedMemory: number;
  availableMemory: number;
  cacheSize: number;
  modelMemory: number;
}

export interface CacheItem {
  key: string;
  size: number;
  timestamp: number;
  priority: number; // 1 = high, 2 = medium, 3 = low
}

/**
 * MemoryManager - Intelligent Memory Management System
 * 
 * OPTIMIZATION #10: Regular Cache Cleanup - Automatic memory management
 * OPTIMIZATION #2: Background Cleanup - Aggressive cleanup when app goes to background
 * OPTIMIZATION #10: Memory Warning Handling - Proactive memory management
 * 
 * Why these optimizations:
 * - Regular cleanup prevents memory leaks and maintains performance
 * - Background cleanup frees maximum memory when app is not active
 * - Memory warning handling prevents app crashes due to low memory
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private cacheItems: Map<string, CacheItem> = new Map();
  private memoryWarningListeners: Array<() => void> = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // OPTIMIZATION #10: Memory threshold for proactive cleanup
  private readonly MEMORY_THRESHOLD = 0.8; // 80% memory usage threshold
  
  // OPTIMIZATION #10: Regular cleanup interval to prevent memory buildup
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes
  
  // OPTIMIZATION #10: Cache expiry to prevent stale data accumulation
  private readonly CACHE_EXPIRY = 3600000; // 1 hour

  private constructor() {
    this.initializeMemoryMonitoring();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Initialize memory monitoring
  private initializeMemoryMonitoring(): void {
    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performPeriodicCleanup();
    }, this.CLEANUP_INTERVAL);

    // Monitor app state changes
    AppState.addEventListener('change', this.handleAppStateChange);

    // Platform-specific memory monitoring
    if (Platform.OS === 'ios') {
      this.initializeIOSMemoryMonitoring();
    } else {
      this.initializeAndroidMemoryMonitoring();
    }
  }

  // iOS-specific memory monitoring
  private initializeIOSMemoryMonitoring(): void {
    // In a real implementation, you would listen to memory warnings
    // For now, we'll simulate memory monitoring
    console.log('iOS memory monitoring initialized');
  }

  // Android-specific memory monitoring
  private initializeAndroidMemoryMonitoring(): void {
    // In a real implementation, you would use Android memory APIs
    console.log('Android memory monitoring initialized');
  }

  // OPTIMIZATION #2: Handle app state changes for background cleanup
  // When app goes to background, perform aggressive cleanup to free maximum memory
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.performAggressiveCleanup(); // OPTIMIZATION #2: Free memory when not active
    } else if (nextAppState === 'active') {
      this.resumeNormalOperation(); // Resume normal operation when foregrounded
    }
  };

  // Add cache item with memory tracking
  addCacheItem(key: string, data: any, priority: number = 2): void {
    const size = this.estimateDataSize(data);
    const item: CacheItem = {
      key,
      size,
      timestamp: Date.now(),
      priority,
    };

    this.cacheItems.set(key, item);
    this.checkMemoryThreshold();
  }

  // Remove cache item
  removeCacheItem(key: string): void {
    this.cacheItems.delete(key);
  }

  // Get cache item
  getCacheItem(key: string): CacheItem | undefined {
    return this.cacheItems.get(key);
  }

  // Estimate data size in bytes
  private estimateDataSize(data: any): number {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    } else if (typeof data === 'object') {
      return new Blob([JSON.stringify(data)]).size;
    }
    return 0;
  }

  // Check memory threshold and trigger cleanup if needed
  private checkMemoryThreshold(): void {
    const memoryInfo = this.getMemoryInfo();
    const usageRatio = memoryInfo.usedMemory / memoryInfo.totalMemory;

    if (usageRatio > this.MEMORY_THRESHOLD) {
      console.warn('Memory usage high, triggering cleanup');
      this.performMemoryCleanup();
    }
  }

  // Perform memory cleanup
  private performMemoryCleanup(): void {
    // Remove expired cache items
    this.removeExpiredCacheItems();

    // Remove low-priority items if still over threshold
    const memoryInfo = this.getMemoryInfo();
    const usageRatio = memoryInfo.usedMemory / memoryInfo.totalMemory;

    if (usageRatio > this.MEMORY_THRESHOLD) {
      this.removeLowPriorityItems();
    }

    // Notify listeners
    this.notifyMemoryWarningListeners();
  }

  // Remove expired cache items
  private removeExpiredCacheItems(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cacheItems.entries()) {
      if (now - item.timestamp > this.CACHE_EXPIRY) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cacheItems.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`Removed ${expiredKeys.length} expired cache items`);
    }
  }

  // Remove low-priority items
  private removeLowPriorityItems(): void {
    const lowPriorityItems = Array.from(this.cacheItems.values())
      .filter(item => item.priority === 3)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest low-priority items
    const itemsToRemove = Math.ceil(lowPriorityItems.length * 0.5); // Remove 50%
    lowPriorityItems.slice(0, itemsToRemove).forEach(item => {
      this.cacheItems.delete(item.key);
    });

    console.log(`Removed ${itemsToRemove} low-priority cache items`);
  }

  // Perform aggressive cleanup when app goes to background
  private performAggressiveCleanup(): void {
    console.log('Performing aggressive memory cleanup');
    
    // Clear all low and medium priority items
    const keysToRemove: string[] = [];
    
    for (const [key, item] of this.cacheItems.entries()) {
      if (item.priority > 1) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      this.cacheItems.delete(key);
    });

    // Clear AsyncStorage cache
    this.clearAsyncStorageCache();

    console.log(`Aggressive cleanup: removed ${keysToRemove.length} items`);
  }

  // Resume normal operation when app comes to foreground
  private resumeNormalOperation(): void {
    console.log('Resuming normal memory operation');
    // Reset any background-specific settings
  }

  // Perform periodic cleanup
  private performPeriodicCleanup(): void {
    this.removeExpiredCacheItems();
    this.checkMemoryThreshold();
  }

  // Clear AsyncStorage cache
  private async clearAsyncStorageCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('translation_cache_') || 
        key.startsWith('audio_cache_') ||
        key.startsWith('temp_')
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`Cleared ${cacheKeys.length} AsyncStorage cache items`);
      }
    } catch (error) {
      console.error('Error clearing AsyncStorage cache:', error);
    }
  }

  // Get memory information
  getMemoryInfo(): MemoryInfo {
    const totalMemory = this.getTotalMemory();
    const usedMemory = this.getUsedMemory();
    const cacheSize = this.getCacheSize();
    const modelMemory = this.getModelMemory();

    return {
      totalMemory,
      usedMemory,
      availableMemory: totalMemory - usedMemory,
      cacheSize,
      modelMemory,
    };
  }

  // Get total memory (simulated)
  private getTotalMemory(): number {
    // In a real implementation, you would get actual device memory
    return Platform.OS === 'ios' ? 4096 : 8192; // MB
  }

  // Get used memory (simulated)
  private getUsedMemory(): number {
    const cacheSize = this.getCacheSize();
    const modelMemory = this.getModelMemory();
    const baseMemory = 512; // Base app memory usage
    
    return baseMemory + cacheSize + modelMemory;
  }

  // Get cache size
  private getCacheSize(): number {
    let totalSize = 0;
    for (const item of this.cacheItems.values()) {
      totalSize += item.size;
    }
    return totalSize;
  }

  // Get model memory usage
  private getModelMemory(): number {
    // In a real implementation, you would get actual model memory usage
    return 256; // MB
  }

  // Add memory warning listener
  addMemoryWarningListener(listener: () => void): void {
    this.memoryWarningListeners.push(listener);
  }

  // Remove memory warning listener
  removeMemoryWarningListener(listener: () => void): void {
    const index = this.memoryWarningListeners.indexOf(listener);
    if (index > -1) {
      this.memoryWarningListeners.splice(index, 1);
    }
  }

  // Notify memory warning listeners
  private notifyMemoryWarningListeners(): void {
    this.memoryWarningListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in memory warning listener:', error);
      }
    });
  }

  // Get cache statistics
  getCacheStats(): {
    totalItems: number;
    totalSize: number;
    priorityBreakdown: { [key: number]: number };
  } {
    const priorityBreakdown: { [key: number]: number } = { 1: 0, 2: 0, 3: 0 };
    let totalSize = 0;

    for (const item of this.cacheItems.values()) {
      priorityBreakdown[item.priority]++;
      totalSize += item.size;
    }

    return {
      totalItems: this.cacheItems.size,
      totalSize,
      priorityBreakdown,
    };
  }

  // Force cleanup (for manual memory management)
  async forceCleanup(): Promise<void> {
    console.log('Forcing memory cleanup');
    
    // Clear all cache items
    this.cacheItems.clear();
    
    // Clear AsyncStorage cache
    await this.clearAsyncStorageCache();
    
    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    console.log('Force cleanup completed');
  }

  // Cleanup on app termination
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Note: AppState.removeEventListener is not available in React Native
    // The listener will be automatically cleaned up when the component unmounts
    this.cacheItems.clear();
    this.memoryWarningListeners = [];
    
    console.log('Memory manager cleaned up');
  }
}

export default MemoryManager.getInstance(); 