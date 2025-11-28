import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Load .env from _system directory (backend root)
// src/core/utils/config.ts -> ../../../ -> _system/
// dist/core/utils/config.js -> ../../../ -> _system/
const backendRoot = path.resolve(__dirname, '../../../');
const envPath = path.resolve(backendRoot, '.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Fallback to default loading (process.cwd) if specific file not found
  dotenv.config();
}

interface Config {
  vaultPath: string;
  defaultLanguage: 'en' | 'zh';
  ttsScriptPath: string;
  defaultTTSVoiceEN: string;
  defaultTTSVoiceZH: string;
  webPort: number;
  webHost: string;
  claudeCodeMaxConcurrent: number;
  claudeCodeTimeout: number;
  journalAutoCreate: boolean;
  journalDefaultTemplate: string;
  autoArchiveCompletedProjects: boolean;
  telegramAppApiId?: number;
  telegramAppApiHash?: string;
  telegramSessionName?: string;
}

function getConfig(): Config {
  // Determine project root based on file location (works for both src/ and dist/)
  // src/core/utils/config.ts -> ../../../../ -> project root
  // dist/core/utils/config.js -> ../../../../ -> project root
  const projectRoot = path.resolve(__dirname, '../../../../');

  let vaultPath: string;
  if (process.env.VAULT_PATH) {
    const resolvedFromCwd = path.resolve(process.cwd(), process.env.VAULT_PATH);
    if (existsSync(resolvedFromCwd)) {
      vaultPath = resolvedFromCwd;
    } else {
      // If relative path from CWD doesn't exist, try relative to project root
      // This handles cases where CWD is _system but VAULT_PATH is ./vault (expected from root)
      const resolvedFromProject = path.resolve(projectRoot, process.env.VAULT_PATH);
      if (existsSync(resolvedFromProject)) {
        vaultPath = resolvedFromProject;
      } else {
        vaultPath = resolvedFromCwd; // Fallback to original resolution
      }
    }
  } else {
    vaultPath = path.resolve(projectRoot, 'vault');
  }

  return {
    vaultPath,
    defaultLanguage: (process.env.DEFAULT_LANGUAGE || 'en') as 'en' | 'zh',
    ttsScriptPath: path.resolve(projectRoot, process.env.TTS_SCRIPT_PATH || './_system/script/google_tts.sh'),
    defaultTTSVoiceEN: process.env.DEFAULT_TTS_VOICE_EN || 'en-GB-Standard-B',
    defaultTTSVoiceZH: process.env.DEFAULT_TTS_VOICE_ZH || 'cmn-TW-Standard-B',
    webPort: parseInt(process.env.WEB_PORT || '3000', 10),
    webHost: process.env.WEB_HOST || 'localhost',
    claudeCodeMaxConcurrent: parseInt(process.env.CLAUDE_CODE_MAX_CONCURRENT || '3', 10),
    claudeCodeTimeout: parseInt(process.env.CLAUDE_CODE_TIMEOUT || '60000', 10),
    journalAutoCreate: process.env.JOURNAL_AUTO_CREATE === 'true',
    journalDefaultTemplate: process.env.JOURNAL_DEFAULT_TEMPLATE || 'daily-reflection',
    autoArchiveCompletedProjects: process.env.AUTO_ARCHIVE_COMPLETED_PROJECTS === 'true',
    telegramAppApiId: process.env.TELEGRAM_APP_API_ID ? parseInt(process.env.TELEGRAM_APP_API_ID, 10) : undefined,
    telegramAppApiHash: process.env.TELEGRAM_APP_API_HASH,
    telegramSessionName: process.env.TELEGRAM_SESSION_NAME || 'telegram_session',
  };
}

export const config = getConfig();
