import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ClaudeExecutionOptions } from './ClaudeService';

/**
 * GeminiService: Service for executing Gemini CLI commands headless.
 * Acts as a fallback for ClaudeService.
 */
export class GeminiService {
  private static readonly MAX_CONCURRENT = 3;
  private static readonly CALL_DELAY = 2000;
  private static readonly DEFAULT_TIMEOUT = 60000;
  private static activeCalls = 0;

  /**
   * Map Claude models to Gemini equivalents
   */
  private static mapModel(claudeModel?: string): string | undefined {
    // Currently defaulting to CLI default model as specific versions (gemini-2.0-flash)
    // were causing "thinking not supported" errors or 404s.
    return undefined;
    
    /* Future mapping:
    switch (claudeModel) {
      case 'haiku':
        return 'gemini-2.0-flash';
      case 'sonnet':
        return 'gemini-2.0-flash';
      case 'opus':
        return 'gemini-2.0-pro-exp';
      default:
        return undefined;
    }
    */
  }

  /**
   * Execute Gemini CLI with the given prompt
   */
  static async execute(prompt: string, options: ClaudeExecutionOptions = {}): Promise<string> {
    // Wait if max concurrent calls reached
    while (this.activeCalls >= this.MAX_CONCURRENT) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.activeCalls++;

    const tempDir = os.tmpdir();
    const promptFile = path.join(
      tempDir,
      `gemini-prompt-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`
    );

    try {
      await fs.writeFile(promptFile, prompt, 'utf-8');

      const model = this.mapModel(options.model);
      const timeoutMs = options.timeout || this.DEFAULT_TIMEOUT;
      const cwd = options.cwd || process.cwd();

      // Construct arguments for Gemini CLI
      const args: string[] = [];
      
      if (model) {
        args.push('--model', model);
      }

      // Headless mode doesn't support granular --allowed-tools, use --yolo for auto-approval
      if (options.allowedTools && options.allowedTools.length > 0) {
         args.push('--yolo');
      }

      return await new Promise<string>((resolve, reject) => {
        const proc = spawn('gemini', args, {
          cwd,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        // Read prompt file and pipe to stdin
        fs.readFile(promptFile, 'utf-8')
          .then(content => {
            if (proc.stdin.writable) {
              proc.stdin.write(content);
              proc.stdin.end();
            }
          })
          .catch(reject);

        proc.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        const timeoutHandle = setTimeout(() => {
          proc.kill();
          reject(new Error(`Gemini CLI timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        proc.on('close', (code) => {
          clearTimeout(timeoutHandle);

          if (code !== 0) {
            reject(new Error(`Gemini CLI exited with code ${code}. stderr: ${stderr}`));
            return;
          }

          if (!stdout || stdout.trim().length === 0) {
            reject(new Error(`Gemini CLI returned empty output. stderr: ${stderr || 'none'}`));
            return;
          }

          resolve(stdout.trim());
        });

        proc.on('error', (error) => {
          clearTimeout(timeoutHandle);
          reject(new Error(`Failed to spawn Gemini CLI: ${error.message}`));
        });
      });

    } finally {
      this.activeCalls--;
      await fs.unlink(promptFile).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, this.CALL_DELAY));
    }
  }
}
