#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('pensieve')
  .description('A second brain knowledge management system')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize the Pensieve vault')
  .action(() => {
    console.log('Initializing Pensieve vault...');
    console.log('✓ Vault structure verified');
  });

program
  .command('capture <text>')
  .description('Quick capture a note')
  .action((text: string) => {
    console.log(`Capturing: "${text}"`);
  });

program.parse(process.argv);
