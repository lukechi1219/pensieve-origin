import { describe, it, expect } from 'vitest';
import {
  sanitizeSubPath,
  validatePARAFolder,
} from '../pathSecurity';

describe('pathSecurity', () => {
  describe('sanitizeSubPath', () => {
    it('should allow empty subPath', () => {
      expect(sanitizeSubPath('')).toBe('');
      expect(sanitizeSubPath(undefined)).toBe('');
    });

    it('should allow valid relative paths', () => {
      expect(sanitizeSubPath('project-name')).toBe('project-name');
      expect(sanitizeSubPath('project-name/subfolder')).toBe('project-name/subfolder');
      expect(sanitizeSubPath('my_project-123')).toBe('my_project-123');
    });

    it('should reject parent directory references (..)', () => {
      expect(() => sanitizeSubPath('..')).toThrow('Parent directory references (..) not allowed');
      expect(() => sanitizeSubPath('../etc/passwd')).toThrow('Parent directory references');
      expect(() => sanitizeSubPath('../../etc/cron.d/malicious')).toThrow('Parent directory references');
      expect(() => sanitizeSubPath('valid/../../etc/passwd')).toThrow('Parent directory references');
    });

    it('should reject absolute paths', () => {
      // Both should throw, error message depends on which check runs first
      expect(() => sanitizeSubPath('/etc/passwd')).toThrow();
      expect(() => sanitizeSubPath('/tmp/malicious')).toThrow();
    });

    it('should reject Windows absolute paths', () => {
      // Both should throw
      expect(() => sanitizeSubPath('C:\\Windows\\System32')).toThrow();
      expect(() => sanitizeSubPath('\\Windows\\System32')).toThrow();
    });

    it('should reject null bytes', () => {
      expect(() => sanitizeSubPath('test\0.md')).toThrow(/Null bytes not allowed/);
    });

    it('should reject paths that are too long', () => {
      const longPath = 'a'.repeat(201);
      expect(() => sanitizeSubPath(longPath)).toThrow(/too long/);
    });

    it('should reject special characters', () => {
      // All should throw due to invalid characters
      expect(() => sanitizeSubPath('test;rm -rf /')).toThrow();
      expect(() => sanitizeSubPath('test$(whoami)')).toThrow();
      expect(() => sanitizeSubPath('test`whoami`')).toThrow();
      expect(() => sanitizeSubPath('test|whoami')).toThrow();
      expect(() => sanitizeSubPath('test&whoami')).toThrow();
      expect(() => sanitizeSubPath('test>output.txt')).toThrow();
      expect(() => sanitizeSubPath('test<input.txt')).toThrow();
    });

    it('should reject paths with spaces', () => {
      // Both should throw
      expect(() => sanitizeSubPath('test folder')).toThrow();
      expect(() => sanitizeSubPath('project name/subfolder')).toThrow();
    });

    it('should trim whitespace', () => {
      expect(sanitizeSubPath('  project-name  ')).toBe('project-name');
      expect(sanitizeSubPath(' project-name/subfolder ')).toBe('project-name/subfolder');
    });
  });

  describe('validatePARAFolder', () => {
    it('should accept valid PARA folders', () => {
      expect(() => validatePARAFolder('inbox')).not.toThrow();
      expect(() => validatePARAFolder('projects')).not.toThrow();
      expect(() => validatePARAFolder('areas')).not.toThrow();
      expect(() => validatePARAFolder('resources')).not.toThrow();
      expect(() => validatePARAFolder('archive')).not.toThrow();
    });

    it('should reject invalid folders', () => {
      expect(() => validatePARAFolder('invalid')).toThrow('Invalid PARA folder');
      expect(() => validatePARAFolder('0-inbox')).toThrow('Invalid PARA folder');
      expect(() => validatePARAFolder('../etc')).toThrow('Invalid PARA folder');
      expect(() => validatePARAFolder('')).toThrow('Invalid PARA folder');
    });

    it('should reject case variations', () => {
      expect(() => validatePARAFolder('Inbox')).toThrow('Invalid PARA folder');
      expect(() => validatePARAFolder('PROJECTS')).toThrow('Invalid PARA folder');
    });
  });
});
