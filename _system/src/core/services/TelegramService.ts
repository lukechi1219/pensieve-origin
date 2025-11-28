import path from 'path';
import { spawn } from 'child_process';
import { config } from '../utils/config';

export class TelegramService {
  /**
   * Get unread Telegram messages by executing a Python script.
   */
  static async getUnreadMessages(): Promise<{ chat_id: number; chat_title: string; unread_count: number }[]> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'script/check_telegram_unread.sh');

      const TELEGRAM_APP_API_ID = process.env.TELEGRAM_APP_API_ID;
      const TELEGRAM_APP_API_HASH = process.env.TELEGRAM_APP_API_HASH;
      const TELEGRAM_SESSION_NAME = process.env.TELEGRAM_SESSION_NAME || 'telegram_session';

      if (!TELEGRAM_APP_API_ID || !TELEGRAM_APP_API_HASH) {
        console.warn('Telegram API credentials not set. Skipping unread message check.');
        console.warn('Please ensure TELEGRAM_APP_API_ID and TELEGRAM_APP_API_HASH are set in _system/.env');
        return resolve([]);
      }

      const child = spawn(scriptPath, [], {
        env: {
          ...process.env,
          TELEGRAM_APP_API_ID,
          TELEGRAM_APP_API_HASH,
          TELEGRAM_SESSION_NAME,
        },
        cwd: process.cwd(),
      });

      let scriptOutput = '';
      let scriptError = '';

      child.stdout.on('data', (data) => {
        scriptOutput += data.toString();
      });

      child.stderr.on('data', (data) => {
        scriptError += data.toString();
      });

      // Set a timeout to kill the process if it hangs
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('Telegram script timed out after 10 seconds'));
      }, 10000);

      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.error(`Telegram script exited with code ${code}`);
          console.error(`Script stderr: ${scriptError}`);
          // Don't reject if it's just a warning or non-critical error, return empty list
          if (scriptError.includes('Error:')) {
             return reject(new Error(`Failed to get unread Telegram messages: ${scriptError || 'Unknown error'}`));
          }
          // Fallback to empty list if code is non-zero but maybe not fatal (or we want to be resilient)
           console.warn('Telegram script failed, returning empty list to prevent crash');
           return resolve([]);
        }

        try {
          // If output is empty, return empty array
          if (!scriptOutput.trim()) {
            return resolve([]);
          }
          // Try to find the JSON array in the output (in case of other stdout noise)
          const jsonMatch = scriptOutput.match(/\[.*\]/s);
          const jsonString = jsonMatch ? jsonMatch[0] : scriptOutput;
          
          const parsedOutput = JSON.parse(jsonString);
          resolve(parsedOutput);
        } catch (jsonError) {
          console.error('Failed to parse JSON output from Telegram script:', jsonError);
          console.error(`Script output: ${scriptOutput}`);
          // Return empty array instead of crashing/rejecting to keep API alive
          resolve([]);
        }
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        console.error('Failed to start Telegram script process:', err);
        reject(err);
      });
    });
  }
}
