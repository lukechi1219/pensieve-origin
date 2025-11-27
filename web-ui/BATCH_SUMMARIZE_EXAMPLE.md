# Batch Summarize SSE Fix - Usage Example

## What Was Fixed

**Before (BROKEN):**
- Used `EventSource` which only supports GET requests
- Tried to send POST data separately, but no connection between EventSource and POST
- Feature was completely non-functional

**After (FIXED):**
- Uses `fetch()` with POST to send request body
- Reads response as `ReadableStream` to receive SSE events
- Properly parses SSE format (`data: {...}\n\n`)

## How to Use the Fixed API

### Example React Component

```typescript
import { useState } from 'react';
import { jarvisApi } from '../api';

export default function BatchSummarizeDemo() {
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<Array<{ noteId: string; summary: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleBatchSummarize = async () => {
    setIsRunning(true);
    setError(null);
    setProgress(null);
    setResults([]);

    await jarvisApi.batchSummarize(
      ['20251125143052', '20251124120000', '20251123100000'], // Note IDs
      {
        language: 'en',
        voice: false,

        // Progress callback - called for each note
        onProgress: (event) => {
          if (event.type === 'progress') {
            setProgress({ current: event.current!, total: event.total! });
          }
        },

        // Complete callback - called when all notes are done
        onComplete: (results) => {
          setResults(results);
          setIsRunning(false);
          setProgress(null);
        },

        // Error callback - called if batch fails
        onError: (errorMsg) => {
          setError(errorMsg);
          setIsRunning(false);
          setProgress(null);
        },
      }
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Batch Summarize Demo</h2>

      <button
        onClick={handleBatchSummarize}
        disabled={isRunning}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isRunning ? 'Summarizing...' : 'Start Batch Summarize'}
      </button>

      {/* Progress Bar */}
      {progress && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Processing {progress.current} of {progress.total} notes...
          </p>
          <div className="w-full bg-gray-200 rounded h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Results:</h3>
          {results.map((result) => (
            <div key={result.noteId} className="p-3 bg-gray-50 rounded">
              <p className="text-sm font-mono text-gray-500">{result.noteId}</p>
              <p className="mt-1">{result.summary}</p>
              {result.error && (
                <p className="mt-1 text-red-600 text-sm">Error: {result.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Technical Details

### Frontend Implementation

The fixed `batchSummarize` function:

1. **Sends POST request** with `fetch()` (unlike EventSource which only supports GET)
2. **Reads response body** as `ReadableStream`
3. **Parses SSE format** manually:
   - Each event is `data: {...}\n\n`
   - Uses buffer to handle chunked data
   - Extracts JSON from `data: ` prefix
4. **Calls callbacks** for progress, results, completion, and errors
5. **Returns Promise** that resolves when stream ends

### Backend SSE Format

The backend sends events in this format:

```
data: {"type":"progress","current":1,"total":3,"noteId":"20251125143052"}\n\n
data: {"type":"result","noteId":"20251125143052","summary":"Summary text..."}\n\n
data: {"type":"progress","current":2,"total":3,"noteId":"20251124120000"}\n\n
data: {"type":"result","noteId":"20251124120000","summary":"Summary text..."}\n\n
data: {"type":"complete","results":[...]}\n\n
```

### Event Types

| Event Type | Description | Fields |
|------------|-------------|--------|
| `progress` | Processing started for a note | `current`, `total`, `noteId` |
| `result` | Summary completed for a note | `noteId`, `summary`, `error?` |
| `complete` | All notes processed | `results[]` |
| `error` | Batch operation failed | `error` |

## Why This Fix Works

### The Problem with EventSource

```javascript
// ❌ BROKEN - EventSource can't send POST body
const eventSource = new EventSource('/api/batch-summarize');
// No way to send noteIds, language, voice!

fetch('/api/batch-summarize', { method: 'POST', body: {...} });
// This POST is disconnected from EventSource - server has no way to send events back
```

### The Solution with fetch + ReadableStream

```javascript
// ✅ WORKING - fetch sends POST and receives streamed response
const response = await fetch('/api/batch-summarize', {
  method: 'POST',
  body: JSON.stringify({ noteIds, language, voice })
});

// Read response as stream
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Parse SSE events from chunks
}
```

## Testing Checklist

- [ ] Build frontend successfully (`npm run build`)
- [ ] Start backend API server (`cd _system && npm run serve`)
- [ ] Start frontend dev server (`cd web-ui && npm run dev`)
- [ ] Create test notes in vault
- [ ] Implement batch summarize UI component
- [ ] Test with 3+ notes to see progress updates
- [ ] Verify summaries are returned correctly
- [ ] Test error handling (invalid note IDs)

## Related Files

- **Frontend API**: `web-ui/src/api/jarvis.ts:81-171`
- **Backend Route**: `_system/src/web/routes/jarvis.ts:115-176`
- **Bug Report**: `BUG_ANALYSIS_REPORT.md` (BUG-011)
