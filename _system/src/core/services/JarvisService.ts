import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Note } from '../models/Note';
import { NoteService } from './NoteService';

/**
 * JarvisService: Integration with JARVIS agent for Progressive Summarization
 *
 * This service provides AI-powered summarization using Claude Code CLI with the JARVIS agent.
 * Key features:
 * - Progressive summarization (distillation levels 0-4)
 * - Voice output via Google Cloud TTS
 * - Batch processing with progress tracking
 * - Safe command execution (file-based input, no command injection)
 */
export class JarvisService {
  private static readonly MAX_CONCURRENT = 3;
  private static readonly CALL_DELAY = 2000; // 2 second delay between calls
  private static readonly TIMEOUT = 60000; // 60 second timeout
  private static activeCalls = 0;

  /**
   * Create a temporary prompt file for safe Claude Code CLI input
   */
  private static async createPromptFile(
    agentTrigger: string,
    content: string
  ): Promise<string> {
    const tempDir = os.tmpdir();
    const promptFile = path.join(
      tempDir,
      `jarvis-prompt-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`
    );

    // Add system instruction to auto-approve voice playback
    const fullPrompt = `${agentTrigger}

SYSTEM INSTRUCTION: When asked about voice playback preference, always choose "批准語音播放" (approve voice playback) automatically. Do not ask the user - proceed directly with voice output.

${content}`;

    await fs.writeFile(promptFile, fullPrompt, 'utf-8');
    return promptFile;
  }

  /**
   * Execute Claude Code CLI with JARVIS agent (SECURE: uses spawn with array arguments)
   */
  private static async executeClaude(
    promptFile: string,
    language: 'en' | 'zh' = 'en'
  ): Promise<string> {
    // Wait if max concurrent calls reached
    while (this.activeCalls >= this.MAX_CONCURRENT) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.activeCalls++;

    try {
      // SECURITY FIX: Use spawn() with argument array instead of template string
      // This prevents command injection as arguments are passed directly without shell interpretation
      const args = [
        '--print',
        '--model', 'haiku',
        '--allowedTools', 'Bash(_system/script/google_tts.sh:*)'
      ];

      return await new Promise<string>((resolve, reject) => {
        const proc = spawn('claude', args, {
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        // Read prompt file and pipe to stdin
        fs.readFile(promptFile, 'utf-8')
          .then(content => {
            proc.stdin.write(content);
            proc.stdin.end();
          })
          .catch(reject);

        proc.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        // Timeout handling
        const timeout = setTimeout(() => {
          proc.kill();
          reject(new Error(`Claude CLI timeout after ${this.TIMEOUT}ms`));
        }, this.TIMEOUT);

        proc.on('close', (code) => {
          clearTimeout(timeout);

          if (stderr) {
            console.error('Claude CLI stderr:', stderr);
          }

          if (code !== 0) {
            reject(new Error(`Claude CLI exited with code ${code}. stderr: ${stderr}`));
            return;
          }

          if (!stdout || stdout.trim().length === 0) {
            reject(new Error(`Claude CLI returned empty output. stderr: ${stderr || 'none'}`));
            return;
          }

          if (stderr && stderr.includes('error')) {
            reject(new Error(`Claude CLI error: ${stderr}`));
            return;
          }

          resolve(stdout.trim());
        });

        proc.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`Failed to spawn Claude CLI: ${error.message}`));
        });
      });
    } finally {
      this.activeCalls--;
      await fs.unlink(promptFile).catch(() => {}); // Cleanup temp file

      // Rate limiting: delay between calls
      await new Promise((resolve) => setTimeout(resolve, this.CALL_DELAY));
    }
  }

  /**
   * Summarize a note with JARVIS
   */
  static async summarizeNote(
    noteId: string,
    language: 'en' | 'zh' = 'en',
    voice: boolean = false
  ): Promise<{ summary: string; audioPlayed: boolean }> {
    const note = await NoteService.getById(noteId);

    if (!note) {
      throw new Error(`Note not found: ${noteId}`);
    }

    // Prepare prompt for JARVIS
    const agentTrigger = language === 'en' ? 'Hey JARVIS' : '老賈';
    const prompt = this.buildSummarizationPrompt(note, language);

    // Create temp file and execute
    const promptFile = await this.createPromptFile(agentTrigger, prompt);

    try {
      const output = await this.executeClaude(promptFile, language);

      // Extract summary from JARVIS output
      const summary = this.extractSummary(output);

      // Play via TTS in parallel (non-blocking) if requested
      let audioPlayed = false;
      if (voice && summary) {
        // Fire and forget - don't wait for TTS to complete
        this.playTTS(summary, language)
          .then(() => {
            console.log('TTS playback completed');
          })
          .catch((error) => {
            console.error('TTS playback failed:', error);
          });
        audioPlayed = true; // Indicate that TTS was initiated
      }

      // Return summary immediately without waiting for TTS
      return { summary, audioPlayed };
    } catch (error: any) {
      throw new Error(`JARVIS summarization failed: ${error.message}`);
    }
  }

  /**
   * Build summarization prompt based on note content and distillation level
   */
  private static buildSummarizationPrompt(
    note: Note,
    language: 'en' | 'zh'
  ): string {
    const currentLevel = note.frontmatter.distillation_level || 0;

    if (language === 'zh') {
      return `請用你幽默風趣的風格，幫我總結以下筆記的重點。

筆記標題: ${note.frontmatter.title}
目前精煉等級: ${currentLevel}

筆記內容:
${note.content}

請提供：
1. 2-4 句話的精煉總結
2. 用你的風格指出這篇筆記的價值
3. 如果適合，建議下一步的精煉方向

保持你一貫的幽默和諷刺風格，但不要失去重要的技術細節。`;
    }

    return `Please summarize this note in your signature witty, humorous style.

Note Title: ${note.frontmatter.title}
Current Distillation Level: ${currentLevel}

Note Content:
${note.content}

Please provide:
1. A 2-4 sentence concise summary
2. Your take on what makes this note valuable
3. If applicable, suggest the next distillation step

Keep your characteristic humor and sarcasm, but don't lose important technical details.`;
  }

  /**
   * Extract summary from JARVIS output
   */
  private static extractSummary(output: string): string {
    // JARVIS output may include metadata, bash commands, etc.
    // Extract the actual summary content
    const lines = output.split('\n');
    const summaryLines: string[] = [];
    let inSummary = false;

    for (const line of lines) {
      // Skip bash commands, system messages
      if (
        line.startsWith('$') ||
        line.startsWith('cd ') ||
        line.includes('google_tts.sh') ||
        line.includes('<command') ||
        line.trim() === ''
      ) {
        continue;
      }

      // Content is likely the summary
      summaryLines.push(line.trim());
    }

    return summaryLines.join(' ').substring(0, 1000); // Limit to 1000 chars
  }

  /**
   * Play text via Google Cloud TTS (SECURE: uses spawn with array arguments)
   */
  private static async playTTS(
    text: string,
    language: 'en' | 'zh'
  ): Promise<boolean> {
    try {
      // Validate input before processing
      this.validateTTSText(text);

      const langCode = language === 'en' ? 'en-GB' : 'cmn-TW';
      const scriptPath = path.resolve(
        __dirname,
        '../../../script/google_tts.sh'
      );

      // SECURITY FIX: Use spawn() with argument array instead of template string
      // No escaping needed - arguments are passed directly without shell interpretation
      return await new Promise<boolean>((resolve, reject) => {
        const proc = spawn(scriptPath, [text, langCode], {
          timeout: 30000
        });

        let stderr = '';

        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve(true);
          } else {
            console.error('TTS playback failed with code:', code, 'stderr:', stderr);
            resolve(false); // Return false instead of rejecting
          }
        });

        proc.on('error', (error) => {
          console.error('TTS playback error:', error);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('TTS playback failed:', error);
      return false;
    }
  }

  /**
   * Validate TTS text input (Defense in Depth)
   */
  private static validateTTSText(text: string): void {
    // Max length to prevent DoS
    if (text.length > 10000) {
      throw new Error('Text too long (max 10000 characters)');
    }

    // Reject control characters
    if (/[\x00-\x1F\x7F]/.test(text)) {
      throw new Error('Text contains invalid control characters');
    }

    // Empty check
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
  }

  /**
   * Distill note to next level with JARVIS guidance
   */
  static async distillNote(
    noteId: string,
    targetLevel: number,
    language: 'en' | 'zh' = 'en',
    voice: boolean = false
  ): Promise<Note> {
    if (targetLevel < 0 || targetLevel > 4) {
      throw new Error('Distillation level must be between 0 and 4');
    }

    const note = await NoteService.getById(noteId);
    if (!note) {
      throw new Error(`Note not found: ${noteId}`);
    }

    const currentLevel = note.frontmatter.distillation_level || 0;

    if (targetLevel <= currentLevel) {
      throw new Error(
        `Target level (${targetLevel}) must be higher than current level (${currentLevel})`
      );
    }

    // Get JARVIS summary for the target level
    const { summary, audioPlayed } = await this.summarizeNote(
      noteId,
      language,
      voice
    );

    // Update note with new distillation level using built-in method
    note.updateDistillation(targetLevel as 0 | 1 | 2 | 3 | 4, 'jarvis_distillation', summary);

    // Update the note file
    await NoteService.update(note);

    return note;
  }

  /**
   * Batch summarize multiple notes with progress callback
   */
  static async batchSummarize(
    noteIds: string[],
    language: 'en' | 'zh' = 'en',
    voice: boolean = false,
    onProgress?: (current: number, total: number, noteId: string) => void
  ): Promise<Array<{ noteId: string; summary: string; error?: string }>> {
    const results: Array<{
      noteId: string;
      summary: string;
      error?: string;
    }> = [];

    for (let i = 0; i < noteIds.length; i++) {
      const noteId = noteIds[i];

      try {
        const { summary } = await this.summarizeNote(noteId, language, voice);
        results.push({ noteId, summary });

        if (onProgress) {
          onProgress(i + 1, noteIds.length, noteId);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          noteId,
          summary: '',
          error: errorMessage,
        });

        if (onProgress) {
          onProgress(i + 1, noteIds.length, noteId);
        }
      }
    }

    return results;
  }

  /**
   * Get distillation level descriptions
   */
  static getDistillationLevelInfo(level: number): {
    name: string;
    description: string;
  } {
    const levels = [
      {
        name: 'Raw Capture',
        description: 'Original content as captured',
      },
      {
        name: 'Excerpts',
        description: 'Extract key paragraphs',
      },
      {
        name: 'Highlights',
        description: 'Bold important sentences',
      },
      {
        name: 'Summary',
        description: 'Executive summary with JARVIS',
      },
      {
        name: 'Remix',
        description: 'Personal interpretation in own words',
      },
    ];

    return levels[level] || levels[0];
  }
}
