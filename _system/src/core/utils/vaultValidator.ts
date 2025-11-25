import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';

export interface VaultStructure {
  inbox: string;
  projects: string;
  areas: string;
  resources: string;
  archive: string;
  journal: string;
  templates: string;
}

export async function getVaultStructure(): Promise<VaultStructure> {
  const vaultPath = config.vaultPath;
  return {
    inbox: path.join(vaultPath, '0-inbox'),
    projects: path.join(vaultPath, '1-projects'),
    areas: path.join(vaultPath, '2-areas'),
    resources: path.join(vaultPath, '3-resources'),
    archive: path.join(vaultPath, '4-archive'),
    journal: path.join(vaultPath, 'journal'),
    templates: path.join(vaultPath, 'templates'),
  };
}

export async function validateVaultStructure(): Promise<{ valid: boolean; missing: string[] }> {
  const structure = await getVaultStructure();
  const missing: string[] = [];

  for (const [name, dirPath] of Object.entries(structure)) {
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        missing.push(name);
      }
    } catch (error) {
      missing.push(name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

export async function createVaultStructure(): Promise<void> {
  const structure = await getVaultStructure();

  for (const dirPath of Object.values(structure)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}
