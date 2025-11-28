import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface ClaudeExecutionOptions {
  model?: 'haiku' | 'sonnet' | 'opus';
  allowedTools?: string[];
  timeout?: number;
  cwd?: string;
}

/**
 * ClaudeService: Low-level service for executing Claude CLI commands headless.
 * Handles process spawning, input piping, concurrency limiting, and error handling.
 */
export class ClaudeService {
  private static readonly MAX_CONCURRENT = 3;
  private static readonly CALL_DELAY = 2000; // 2 second delay between calls
  private static readonly DEFAULT_TIMEOUT = 60000; // 60 seconds
  private static activeCalls = 0;

  /**
   * Execute Claude Code CLI with the given prompt
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
      `claude-prompt-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`
    );

    try {
      await fs.writeFile(promptFile, prompt, 'utf-8');

      const model = options.model || 'haiku';
      const allowedTools = options.allowedTools || ['Read', 'Grep', 'WebSearch', 'Bash'];
      const timeoutMs = options.timeout || this.DEFAULT_TIMEOUT;
      const cwd = options.cwd || process.cwd();

      // SECURITY: Use spawn() with argument array to prevent shell injection
      const args = [
        '--print',
        '--model', model,
        '--allowedTools', allowedTools.join(',')
      ];

      return await new Promise<string>((resolve, reject) => {
        const proc = spawn('claude', args, {
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
          reject(new Error(`Claude CLI timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        proc.on('close', (code) => {
          clearTimeout(timeoutHandle);

          if (stderr && stderr.trim().length > 0) {
             // Only log, don't reject immediately unless code != 0 or stdout empty
             // because Claude CLI might output warnings to stderr
             // console.warn('Claude CLI stderr:', stderr);
          }

          if (code !== 0) {
            reject(new Error(`Claude CLI exited with code ${code}. stderr: ${stderr}`));
            return;
          }

          if (!stdout || stdout.trim().length === 0) {
             // Check if there was a specific error in stderr even if code was 0 (unlikely but possible)
            reject(new Error(`Claude CLI returned empty output. stderr: ${stderr || 'none'}`));
            return;
          }

          resolve(stdout.trim());
        });

        proc.on('error', (error) => {
          clearTimeout(timeoutHandle);
          reject(new Error(`Failed to spawn Claude CLI: ${error.message}`));
        });
      });

    } finally {
      this.activeCalls--;
      // Cleanup temp file
      await fs.unlink(promptFile).catch(() => {});
      
      // Rate limiting: delay between calls to prevent API flooding
      await new Promise((resolve) => setTimeout(resolve, this.CALL_DELAY));
    }
  }
}
