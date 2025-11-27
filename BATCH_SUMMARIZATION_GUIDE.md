# Batch Summarization Feature Guide

## Overview

The **Batch Summarization** feature allows you to summarize multiple notes at once using the JARVIS AI agent, with real-time progress tracking via Server-Sent Events (SSE).

**Status**: ✅ **FULLY IMPLEMENTED** (2025-11-28)

---

## What It Does

Instead of summarizing notes one-by-one:
1. **Select Multiple Notes** - Use checkboxes to select 5, 10, or even 20 notes
2. **Click "Batch Summarize"** - Process all selected notes with one click
3. **Watch Real-Time Progress** - See a progress bar and status for each note
4. **Get All Summaries** - JARVIS AI generates concise summaries for every note

---

## How to Use

### Step 1: Navigate to Notes Page

Go to any PARA folder (Inbox, Projects, Areas, Resources, Archive):

```
http://localhost:5173/notes/inbox
http://localhost:5173/notes/projects
http://localhost:5173/notes/areas
```

### Step 2: Select Notes

You'll see a toolbar above the notes list:

```
┌─────────────────────────────────────────────────────┐
│ [全選] [清除]  已選擇 0 / 5 個筆記  [批次總結 (0)]  │
└─────────────────────────────────────────────────────┘
```

**Selection Methods**:

1. **Individual Selection**: Click the checkbox icon (□) on any note card
2. **Select All**: Click the "全選" button to select all visible notes
3. **Clear Selection**: Click the "清除" button to deselect all

Selected notes will have a **purple ring** around them.

### Step 3: Start Batch Summarization

1. Ensure at least 1 note is selected
2. Click the **"批次總結 (N)"** button (purple button with sparkles icon ✨)
3. The progress modal will appear automatically

### Step 4: Monitor Progress

The progress modal shows:

```
╔═══════════════════════════════════════╗
║       批次總結進度                     ║
║       正在處理筆記...                  ║
╠═══════════════════════════════════════╣
║ 進度: 3 / 5                      60%  ║
║ [████████████░░░░░░░]                 ║
╠═══════════════════════════════════════╣
║ ✓ Note 1: API Design                 ║
║   Summary: This note covers...       ║
║                                       ║
║ ✓ Note 2: Testing Guide              ║
║   Summary: Comprehensive testing...  ║
║                                       ║
║ ⏳ Note 3: React Hooks (processing...) ║
║                                       ║
║ ⏸ Note 4: TypeScript Tips (pending)  ║
║                                       ║
║ ⏸ Note 5: Code Review (pending)      ║
╚═══════════════════════════════════════╝
```

**Status Indicators**:
- ✓ (green) - Successfully summarized
- ⏳ (blue, pulsing) - Currently processing
- ⏸ (gray) - Waiting in queue
- ✗ (red) - Failed with error

### Step 5: View Results

Once complete, the modal shows:

```
批次總結進度
處理完成

進度: 5 / 5                      100%
[████████████████████████]

✓ All notes processed
```

Click **"完成"** to close the modal and clear selection.

---

## Features

### 1. Real-Time Progress Updates

- **Server-Sent Events (SSE)** - Live streaming from backend
- **Progress Bar** - Visual percentage indicator
- **Per-Note Status** - Know exactly which note is being processed
- **Live Summaries** - See results as they're generated

### 2. Error Handling

If a note fails to summarize:
- The note will show a red error indicator ✗
- Error message will be displayed
- Other notes will continue processing
- No need to retry the entire batch

### 3. Visual Feedback

- **Selected notes** have purple ring border
- **Processing note** has blue background with pulse animation
- **Completed notes** have green background
- **Failed notes** have red background
- **Progress bar** smoothly animates

### 4. Flexible Selection

- Select specific notes (e.g., only unread ones)
- Select all in current folder
- Filter by subfolder first, then select all
- Selection persists until batch complete or manual clear

---

## Technical Details

### Backend API

**Endpoint**: `POST /api/jarvis/batch-summarize`

**Request Body**:
```json
{
  "noteIds": ["20251125143052", "20251125143100"],
  "language": "zh",
  "voice": false
}
```

**Response**: Server-Sent Events (SSE) stream

**Event Types**:
```typescript
// Progress update
data: {"type":"progress","current":1,"total":5,"noteId":"20251125143052"}

// Individual result
data: {"type":"result","noteId":"20251125143052","summary":"...","error":null}

// Batch complete
data: {"type":"complete","results":[...]}

// Error occurred
data: {"type":"error","error":"Connection failed"}
```

### Frontend Implementation

**Location**: `web-ui/src/pages/Notes.tsx`

**Key Components**:
1. **Batch Actions Toolbar** (lines 288-322)
   - Select All / Clear buttons
   - Selection counter
   - Batch Summarize button

2. **Note Cards with Checkboxes** (lines 541-620)
   - Individual checkbox per note
   - Click handler to toggle selection
   - Visual ring for selected state

3. **Progress Modal** (lines 418-536)
   - Real-time progress bar
   - Per-note status list
   - Complete/close button

**SSE Client**: `web-ui/src/api/jarvis.ts:81-171`
- Uses `fetch()` + `ReadableStream` (not EventSource)
- Manually parses SSE format
- Supports POST with request body

### JARVIS AI Integration

**Service**: `_system/src/core/services/JarvisService.ts:375-412`

**How It Works**:
1. Iterates through note IDs sequentially
2. For each note:
   - Loads note content
   - Sends to Claude Code CLI with JARVIS agent
   - Extracts summary from JARVIS output
   - Calls progress callback
3. Returns array of results

**Processing Time**:
- ~10-15 seconds per note (depends on note length)
- 5 notes = ~1-2 minutes
- 10 notes = ~2-4 minutes

---

## Use Cases

### 1. Daily Inbox Review

**Scenario**: You've captured 10 articles/notes in your Inbox today

**Steps**:
1. Go to Inbox
2. Select all 10 notes
3. Batch summarize
4. Read summaries to decide which to keep/organize

**Time Saved**: 10 minutes → 2 minutes

### 2. Project Kickoff Research

**Scenario**: Starting new project, collected 15 research notes

**Steps**:
1. Move all notes to a project subfolder
2. Filter by that subfolder
3. Select all
4. Batch summarize
5. Review summaries to identify key insights

**Benefit**: Quick overview of all research without reading full notes

### 3. Weekly Review

**Scenario**: Review all notes created this week

**Steps**:
1. Create filter/search for "created this week" (future feature)
2. Select all results
3. Batch summarize
4. Skim summaries to refresh memory

**Benefit**: Fast weekly review process

### 4. Archive Cleanup

**Scenario**: 50 old notes to review before archiving

**Steps**:
1. Process in batches of 10
2. Read summaries
3. Archive non-valuable notes
4. Promote valuable ones to Resources

**Benefit**: Efficient archive maintenance

---

## Limitations

### Current Limitations

1. **Language**: Currently hardcoded to Chinese (`zh`)
   - TODO: Add language selector or use user preference

2. **Voice Disabled**: TTS voice output disabled during batch
   - Reason: Would be confusing with 10+ notes talking
   - Single note summarization still supports voice

3. **Sequential Processing**: Notes processed one-at-a-time
   - Reason: Claude Code CLI rate limiting (max 3 concurrent)
   - Future: Could parallelize up to 3 notes

4. **No Cancel Button**: Once started, can't stop batch
   - Workaround: Refresh page (will lose progress)
   - TODO: Add cancel functionality

5. **No Resume**: If browser crashes, must restart
   - TODO: Add persistence to resume interrupted batches

### Known Issues

1. **Network Connection**: If WiFi disconnects during batch, SSE will fail
   - Fix: Refresh page and restart batch

2. **Large Notes**: Very long notes (>10,000 chars) take longer
   - Workaround: Summarize long notes individually

---

## Troubleshooting

### Issue: "Batch Summarize" Button Disabled

**Cause**: No notes selected

**Solution**: Click checkboxes to select at least 1 note

---

### Issue: Modal Shows "Processing" But No Progress

**Symptom**: Progress bar stuck at 0%, no notes updating

**Possible Causes**:
1. Backend not running
2. JARVIS agent not configured
3. Claude Code CLI not installed

**Solution**:
```bash
# Check backend is running
curl http://localhost:3000/health

# Check Claude Code is available
which claude

# Restart backend
cd _system && npm run serve
```

---

### Issue: Some Notes Show Error ✗

**Symptom**: Red error indicator on specific notes

**Common Errors**:
1. **"Note not found"** - Note was deleted during batch
2. **"Claude CLI timeout"** - Note too long or system overloaded
3. **"JARVIS summarization failed"** - AI returned invalid response

**Solution**:
- For timeout: Summarize that note individually
- For "not found": Remove from selection
- For JARVIS failure: Try again or check note content

---

### Issue: Progress Modal Doesn't Appear

**Symptom**: Clicked "Batch Summarize" but no modal

**Possible Causes**:
1. JavaScript error in console
2. Modal z-index conflict

**Solution**:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Report to developer if persistent

---

## Performance Tips

### Best Practices

1. **Batch Size**: Process 5-10 notes at a time
   - Sweet spot for review time vs processing time
   - Easier to track progress

2. **Filter First**: Use subfolder filter before selecting
   - Reduces cognitive load
   - More targeted summarization

3. **Good Network**: Ensure stable connection
   - SSE requires continuous connection
   - Avoid starting batch on weak WiFi

4. **Note Quality**: Better input = better summaries
   - Well-structured notes get better summaries
   - Garbage in, garbage out

### Performance Characteristics

| Batch Size | Processing Time | Review Time | Total Time |
|------------|----------------|-------------|------------|
| 5 notes    | ~1 minute      | ~2 minutes  | ~3 minutes |
| 10 notes   | ~2 minutes     | ~4 minutes  | ~6 minutes |
| 20 notes   | ~4 minutes     | ~8 minutes  | ~12 minutes|
| 50 notes   | ~10 minutes    | ~20 minutes | ~30 minutes|

**Recommendation**: Multiple small batches > one huge batch

---

## Future Enhancements

### Planned Features

1. **Language Selection** - Choose English or Chinese
2. **Cancel Button** - Stop batch mid-process
3. **Resume Capability** - Continue interrupted batches
4. **Parallel Processing** - 2-3 notes simultaneously
5. **Summary Export** - Download all summaries as CSV/PDF
6. **Auto-Archive** - Archive notes after summarization
7. **Bulk Tags** - Add tags to all summarized notes
8. **Quality Metrics** - Show summary quality score

### Integration Ideas

1. **Search Integration** - Summarize search results
2. **Calendar Integration** - Summarize notes from specific date range
3. **Mobile Support** - Responsive design for mobile batch review
4. **Keyboard Shortcuts** - `Ctrl+A` to select all, `Enter` to start

---

## Technical Architecture

### Data Flow

```
User Selects Notes
        ↓
[批次總結] Button Click
        ↓
jarvisApi.batchSummarize()
        ↓
POST /api/jarvis/batch-summarize
        ↓
JarvisService.batchSummarize()
        ↓
For Each Note:
  → Load Note
  → Call Claude Code CLI
  → Extract Summary
  → Send SSE Event
        ↓
Frontend Receives Events
        ↓
Update Progress Modal
        ↓
Display Results
```

### SSE Event Flow

```
Client                    Server
  │                         │
  ├──POST /batch-summarize─→│
  │                         ├─ Set SSE Headers
  │                         ├─ Start Processing
  │                         │
  │←──data: {type:progress}─┤ Note 1 started
  │                         │
  │←──data: {type:result}───┤ Note 1 complete
  │                         │
  │←──data: {type:progress}─┤ Note 2 started
  │                         │
  │←──data: {type:result}───┤ Note 2 complete
  │                         │
  │←──data: {type:complete}─┤ All done
  │                         │
  └──Connection closes──────┘
```

---

## Related Files

### Frontend
- `web-ui/src/pages/Notes.tsx` - Main UI component
- `web-ui/src/api/jarvis.ts` - SSE client
- `web-ui/src/api/index.ts` - API exports

### Backend
- `_system/src/web/routes/jarvis.ts` - SSE endpoint (lines 115-176)
- `_system/src/core/services/JarvisService.ts` - Batch logic (lines 375-412)
- `_system/src/web/middleware/validation.ts` - Request validation

### Documentation
- `BUG-011_SSE_FIX.md` - Technical SSE implementation details
- `API_DOCUMENTATION.md` - Full API reference
- `CLAUDE.md` - Project overview

---

## FAQ

**Q: Can I summarize notes in different folders at once?**
A: No, selection is per-folder. Switch folders to batch summarize different notes.

**Q: Does this use my Claude API credits?**
A: No, it uses Claude Code CLI which is included in your Claude subscription.

**Q: Can I customize the summary style?**
A: Not yet. JARVIS uses a preset humorous/technical style. Customization is a future feature.

**Q: What happens if I close the browser during batch?**
A: The backend will continue processing, but frontend loses progress. Restart the batch.

**Q: Can I see the summaries later?**
A: Currently no. Summaries are shown only in the modal. Saving summaries to notes is a future feature.

**Q: Why is it called "batch summarization" instead of "multi-note summarization"?**
A: "Batch" is the standard term in software for processing multiple items together.

---

**Last Updated**: 2025-11-28
**Feature Status**: ✅ Production Ready
**Implementation Time**: ~2 hours
