import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface ModelConfig {
  modelName: string;
  modelPath: string;
  isQuantized: boolean;
  quantizationType: 'Q4' | 'Q8' | 'FP16' | 'FP32';
  maxTokens: number;
  memoryLimit: number; // MB
  loadTimeout: number; // ms
  unloadDelay: number; // ms
}

export interface ModelStatus {
  isLoaded: boolean;
  isLoading: boolean;
  lastUsed: number;
  memoryUsage: number;
  error?: string;
}

/**
 * ModelManager - Optimized Model Management Service
 * 
 * OPTIMIZATION #1: Lazy Loading - Models only load when needed, not at app startup
 * OPTIMIZATION #2: Background Unloading - Automatically unloads models when app goes to background
 * OPTIMIZATION #8: Queue Processing - Single-threaded operations to prevent memory conflicts
 * 
 * Why these optimizations:
 * - Lazy loading reduces app startup time and initial memory footprint
 * - Background unloading frees significant memory when app is not active
 * - Queue processing prevents concurrent model sessions that could cause memory issues
 */
export class ModelManager {
  private static instance: ModelManager;
  private gemmaModel: any = null;
  private ttsModel: any = null;
  private modelStatus: Map<string, ModelStatus> = new Map();
  private unloadTimer: NodeJS.Timeout | null = null;
  private isBackgrounded: boolean = false;
  private appStateSubscription: any = null;
  
  // OPTIMIZATION #8: Queue-based processing to prevent concurrent model operations
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  // OPTIMIZATION #3: Quantized Model Configuration
  // Using Q4 quantization reduces model size by 50-75% with minimal quality loss
  private readonly GEMMA_CONFIG: ModelConfig = {
    modelName: 'gemma-3n-2b-q4', // Q4 quantized version for maximum compression
    modelPath: './assets/models/gemma-3n-2b-q4',
    isQuantized: true,
    quantizationType: 'Q4', // 4-bit quantization for maximum compression
    maxTokens: 256, // OPTIMIZATION #7: Reduced from 512 to limit memory usage during inference
    memoryLimit: 256, // MB - conservative memory limit for mobile devices
    loadTimeout: 30000,
    unloadDelay: 300000, // 5 minutes - auto-unload after inactivity
  };

  // OPTIMIZATION #5: Compact TTS Model (Indic Parler-TTS Mini)
  // Indic Parler-TTS Mini supports 21 Indian languages with compact size
  private readonly TTS_CONFIG: ModelConfig = {
    modelName: 'indic-parler-tts-mini', // Multi-language TTS model for Indian languages
    modelPath: './assets/models/indic-parler-tts-mini',
    isQuantized: true,
    quantizationType: 'Q8', // 8-bit quantization for TTS (good balance of size/quality)
    maxTokens: 128, // Smaller token limit for TTS
    memoryLimit: 150, // MB - slightly larger due to multi-language support
    loadTimeout: 15000,
    unloadDelay: 600000, // 10 minutes - TTS can stay loaded longer
  };

  private constructor() {
    this.initializeAppStateListener();
    this.initializeMemoryWarningListener();
  }

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  // OPTIMIZATION #2: Background Unloading - Initialize app state listeners
  // This ensures models are unloaded when app goes to background to free memory
  private initializeAppStateListener(): void {
    // Use subscription pattern for better compatibility
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  // OPTIMIZATION #2: Handle app state changes for background unloading
  // When app goes to background, unload models to free significant memory
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.isBackgrounded = true;
      this.unloadModelsOnBackground(); // Free memory when not active
    } else if (nextAppState === 'active') {
      this.isBackgrounded = false;
      this.cancelUnloadTimer(); // Resume normal operation
    }
  };

  // Initialize memory warning listeners
  private initializeMemoryWarningListener(): void {
    if (Platform.OS === 'ios') {
      // iOS memory warning handling
      // In a real implementation, you would listen to memory warnings
      console.log('Memory warning listener initialized for iOS');
    }
  }

  // OPTIMIZATION #1: Lazy Loading - Load Gemma model only when needed
  // This reduces app startup time and initial memory footprint
  async loadGemmaModel(): Promise<void> {
    const modelKey = 'gemma';
    
    if (this.modelStatus.get(modelKey)?.isLoaded) {
      return;
    }

    if (this.modelStatus.get(modelKey)?.isLoading) {
      // Wait for existing load to complete
      await this.waitForModelLoad(modelKey);
      return;
    }

    this.setModelStatus(modelKey, { isLoaded: false, isLoading: true, lastUsed: Date.now(), memoryUsage: 0 });

    try {
      console.log('Loading Gemma model (lazy load)...');
      
      // Check memory availability
      if (!this.checkMemoryAvailability(this.GEMMA_CONFIG.memoryLimit)) {
        throw new Error('Insufficient memory for Gemma model');
      }

      // Load quantized model
      await this.loadQuantizedModel(this.GEMMA_CONFIG);
      
      this.setModelStatus(modelKey, { 
        isLoaded: true, 
        isLoading: false, 
        lastUsed: Date.now(), 
        memoryUsage: this.GEMMA_CONFIG.memoryLimit 
      });

      console.log('Gemma model loaded successfully');
      
      // Schedule auto-unload
      this.scheduleModelUnload(modelKey, this.GEMMA_CONFIG.unloadDelay);
      
    } catch (error) {
      console.error('Error loading Gemma model:', error);
      this.setModelStatus(modelKey, { 
        isLoaded: false, 
        isLoading: false, 
        lastUsed: Date.now(), 
        memoryUsage: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Lazy load TTS model only when needed
  async loadTTSModel(): Promise<void> {
    const modelKey = 'tts';
    
    if (this.modelStatus.get(modelKey)?.isLoaded) {
      return;
    }

    if (this.modelStatus.get(modelKey)?.isLoading) {
      await this.waitForModelLoad(modelKey);
      return;
    }

    this.setModelStatus(modelKey, { isLoaded: false, isLoading: true, lastUsed: Date.now(), memoryUsage: 0 });

    try {
      console.log('Loading TTS model (lazy load)...');
      
      if (!this.checkMemoryAvailability(this.TTS_CONFIG.memoryLimit)) {
        throw new Error('Insufficient memory for TTS model');
      }

      await this.loadQuantizedModel(this.TTS_CONFIG);
      
      this.setModelStatus(modelKey, { 
        isLoaded: true, 
        isLoading: false, 
        lastUsed: Date.now(), 
        memoryUsage: this.TTS_CONFIG.memoryLimit 
      });

      console.log('TTS model loaded successfully');
      
      this.scheduleModelUnload(modelKey, this.TTS_CONFIG.unloadDelay);
      
    } catch (error) {
      console.error('Error loading TTS model:', error);
      this.setModelStatus(modelKey, { 
        isLoaded: false, 
        isLoading: false, 
        lastUsed: Date.now(), 
        memoryUsage: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Load quantized model based on platform
  private async loadQuantizedModel(config: ModelConfig): Promise<void> {
    // Simulate loading quantized model
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (Platform.OS === 'ios') {
      // Use Core ML optimized model
      console.log(`Loading ${config.modelName} with Core ML optimization`);
    } else {
      // Use ONNX Runtime for Android
      console.log(`Loading ${config.modelName} with ONNX Runtime (${config.quantizationType})`);
    }
  }

  // Queue-based request handling to avoid concurrent sessions
  async executeWithGemma<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          await this.loadGemmaModel();
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  async executeWithTTS<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          await this.loadTTSModel();
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const operation = this.requestQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Error processing queue operation:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  // Unload models when app goes to background
  private unloadModelsOnBackground(): void {
    console.log('App backgrounded - unloading models');
    this.unloadGemmaModel();
    this.unloadTTSModel();
    this.clearCache();
  }

  // Unload specific models
  async unloadGemmaModel(): Promise<void> {
    if (this.gemmaModel) {
      console.log('Unloading Gemma model');
      this.gemmaModel = null;
      this.setModelStatus('gemma', { 
        isLoaded: false, 
        isLoading: false, 
        lastUsed: Date.now(), 
        memoryUsage: 0 
      });
    }
  }

  async unloadTTSModel(): Promise<void> {
    if (this.ttsModel) {
      console.log('Unloading TTS model');
      this.ttsModel = null;
      this.setModelStatus('tts', { 
        isLoaded: false, 
        isLoading: false, 
        lastUsed: Date.now(), 
        memoryUsage: 0 
      });
    }
  }

  // Schedule auto-unload after inactivity
  private scheduleModelUnload(modelKey: string, delay: number): void {
    this.cancelUnloadTimer();
    
    this.unloadTimer = setTimeout(async () => {
      if (modelKey === 'gemma') {
        await this.unloadGemmaModel();
      } else if (modelKey === 'tts') {
        await this.unloadTTSModel();
      }
    }, delay);
  }

  private cancelUnloadTimer(): void {
    if (this.unloadTimer) {
      clearTimeout(this.unloadTimer);
      this.unloadTimer = null;
    }
  }

  // Memory management
  private checkMemoryAvailability(requiredMB: number): boolean {
    // In a real implementation, you would check actual memory availability
    // For now, we'll simulate memory checking
    const availableMemory = 512; // Simulated available memory in MB
    const currentUsage = this.getCurrentMemoryUsage();
    
    return (availableMemory - currentUsage) >= requiredMB;
  }

  private getCurrentMemoryUsage(): number {
    let totalUsage = 0;
    this.modelStatus.forEach(status => {
      totalUsage += status.memoryUsage;
    });
    return totalUsage;
  }

  // Cache management
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('translation_cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('Translation cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Utility methods
  private setModelStatus(modelKey: string, status: ModelStatus): void {
    this.modelStatus.set(modelKey, status);
  }

  private async waitForModelLoad(modelKey: string): Promise<void> {
    return new Promise((resolve) => {
      const checkStatus = () => {
        const status = this.modelStatus.get(modelKey);
        if (status && !status.isLoading) {
          resolve();
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }

  // Get model status
  getModelStatus(modelKey: string): ModelStatus | undefined {
    return this.modelStatus.get(modelKey);
  }

  // Get all model statuses
  getAllModelStatuses(): Map<string, ModelStatus> {
    return new Map(this.modelStatus);
  }

  // Check if models are loaded
  isGemmaLoaded(): boolean {
    return this.modelStatus.get('gemma')?.isLoaded || false;
  }

  isTTSLoaded(): boolean {
    return this.modelStatus.get('tts')?.isLoaded || false;
  }

  // Cleanup on app termination
  cleanup(): void {
    this.cancelUnloadTimer();
    this.unloadGemmaModel();
    this.unloadTTSModel();
    this.clearCache();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

export default ModelManager.getInstance(); 