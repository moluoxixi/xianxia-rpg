export {};

declare global {
  interface Window {
    gameAPI: {
      sendMessage: (payload: {
        message: string;
        history: Array<{ role: string; content: string }>;
      }) => Promise<{ success: boolean; reply: string; error?: string }>;
      saveGame: (data: unknown) => Promise<{ success: boolean; message: string; data?: unknown; runId?: string }>;
      loadGame: () => Promise<{ success: boolean; data: unknown; message?: string }>;
      updateAIConfig: (config: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
      saveAIConfig: (config: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
      loadAIConfig: () => Promise<{ success: boolean; data: unknown; message?: string }>;
      testAIConnection: (config: Record<string, unknown>) => Promise<{ success: boolean; reply?: string; error?: string }>;
      saveDeathArchive: (data: unknown) => Promise<{ success: boolean; message: string; data?: unknown; runId?: string }>;
    };
  }
}
