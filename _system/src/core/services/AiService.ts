import { ClaudeService, ClaudeExecutionOptions } from './ClaudeService';
import { GeminiService } from './GeminiService';

/**
 * AiService: Unified interface for AI execution with fallback strategy.
 * Tries ClaudeService first, falls back to GeminiService if Claude fails.
 */
export class AiService {
  /**
   * Execute AI generation with fallback
   */
  static async execute(prompt: string, options: ClaudeExecutionOptions = {}): Promise<string> {
    try {
      return await ClaudeService.execute(prompt, options);
    } catch (claudeError: any) {
      console.warn(`ClaudeService failed: ${claudeError.message}. Falling back to GeminiService.`);
      
      try {
        return await GeminiService.execute(prompt, options);
      } catch (geminiError: any) {
        console.error(`GeminiService also failed: ${geminiError.message}`);
        throw new Error(`AI execution failed. Claude error: ${claudeError.message}. Gemini error: ${geminiError.message}`);
      }
    }
  }
}
