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

      child.on('close', (code) => {
        if (code !== 0) {
          console.error(`Telegram script exited with code ${code}`);
          console.error(`Script stderr: ${scriptError}`);
          return reject(new Error(`Failed to get unread Telegram messages: ${scriptError || 'Unknown error'}`));
        }

        try {
          // If output is empty, return empty array
          if (!scriptOutput.trim()) {
            return resolve([]);
          }
          const parsedOutput = JSON.parse(scriptOutput);
          resolve(parsedOutput);
        } catch (jsonError) {
          console.error('Failed to parse JSON output from Telegram script:', jsonError);
          console.error(`Script output: ${scriptOutput}`);
          reject(new Error(`Invalid JSON output from script: ${scriptOutput}`));
        }
      });

      child.on('error', (err) => {
        console.error('Failed to start Telegram script process:', err);
        reject(err);
      });
    });
  }
}
