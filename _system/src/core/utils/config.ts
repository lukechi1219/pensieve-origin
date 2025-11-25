import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

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
}

function getConfig(): Config {
  const projectRoot = process.cwd();

  return {
    vaultPath: path.resolve(projectRoot, process.env.VAULT_PATH || './vault'),
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
  };
}

export const config = getConfig();
