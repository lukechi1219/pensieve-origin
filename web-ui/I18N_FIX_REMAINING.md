# Remaining i18n Hardcoded Strings to Fix

## Summary

✅ **Completed**:
- Added all missing translation keys to `src/i18n/translations.ts`
- Fixed BUG-011 (SSE implementation)
- Fixed `JournalDetail.tsx` (already implemented with locale checks)
- Added i18n import to `NoteDetail.tsx`
- Fixed critical alert messages in `NoteDetail.tsx` (save/delete failures)

## Remaining Files to Fix

### 1. NoteDetail.tsx (Partially Fixed)

**Status**: Import added, alerts fixed, UI text needs replacement

**Remaining hardcoded strings**:

```typescript
// Line 92 - Move validation alert
alert('無效的資料夾名稱。請輸入: inbox, projects, areas, resources, 或 archive');
// Fix: alert(t.notes.invalidFolder);

// Line 101 - Move success alert
alert(`已移動至 ${targetFolder}${subPath ? `/${subPath}` : ''}`);
// Fix: alert(t.notes.movedTo(targetFolder, subPath));

// Line 104 - Move failure alert
alert('移動失敗');
// Fix: alert(t.notes.moveFailed);

// Line 111 - Loading state
<div className="text-gray-500">載入中...</div>
// Fix: <div className="text-gray-500">{t.common.loading}</div>

// Line 124, 141 - Back button
返回收件匣
// Fix: {t.notes.backToList}

// Line 144 - Not found message
<p className="text-gray-500">找不到筆記</p>
// Fix: <p className="text-gray-500">{t.notes.notFound}</p>

// Lines 152-155 - CODE flags
{ label: '啟發', color: 'bg-yellow-100 text-yellow-800' }
{ label: '實用', color: 'bg-green-100 text-green-800' }
{ label: '個人', color: 'bg-blue-100 text-blue-800' }
{ label: '驚奇', color: 'bg-purple-100 text-purple-800' }
// Fix: t.notes.codeFlags.inspiring, etc.

// Lines 169-173, 197-201 - Folder name mappings
const folderNames = {
  inbox: '收件匣',
  projects: '專案',
  areas: '領域',
  resources: '資源',
  archive: '封存',
};
// Fix: Use t.notes.folders object

// Line 221 - Back to folder
返回 {backInfo.label}
// Fix: {t.notes.backTo} {backInfo.label}

// Line 261 - Save button
{isSaving ? '儲存中...' : '儲存'}
// Fix: {isSaving ? t.common.loading : t.common.save}

// Line 269 - Cancel button
取消
// Fix: {t.common.cancel}

// Line 278 - Edit button
編輯
// Fix: {t.common.edit}

// Line 288-293 - Created/Modified dates
建立於 {new Date(note.created).toLocaleString('zh-TW')}
修改於 {new Date(note.modified).toLocaleString('zh-TW')}
// Fix: {t.notes.createdAt} {new Date(note.created).toLocaleString(locale === 'zh_Hant' ? 'zh-TW' : 'en-US')}

// Line 299 - Distillation level
精煉等級: {note.distillationLevel}
// Fix: {t.notes.distillationLevel}: {note.distillationLevel}

// Line 350, 361 - Tab buttons
編輯
預覽
// Fix: {t.common.edit}, {t.notes.preview}

// Line 365 - Markdown support
支援 Markdown 格式
// Fix: {t.notes.markdownSupport}

// Line 377 - Placeholder
placeholder="開始輸入筆記內容..."
// Fix: placeholder={t.notes.placeholder}

// Line 387 - Preview area placeholder
<p className="text-gray-400 italic">預覽區域</p>
// Fix: <p className="text-gray-400 italic">{t.notes.previewArea}</p>

// Line 405 - Progressive Summarization heading
<h2 className="text-lg font-semibold text-gray-900 mb-4">漸進式摘要 (JARVIS)</h2>
// Fix: <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.notes.progressiveSummarization}</h2>

// Line 423 - Distillation History heading
<h2 className="text-lg font-semibold text-gray-900 mb-4">精煉歷史</h2>
// Fix: <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.notes.distillationHistory}</h2>

// Line 445 - Other Actions heading
<h2 className="text-lg font-semibold text-gray-900 mb-4">其他操作</h2>
// Fix: <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.notes.otherActions}</h2>

// Lines 451, 457, 463 - Action buttons
編輯筆記
移動到其他資料夾
刪除筆記
// Fix: {t.notes.editNote}, {t.notes.moveToFolder}, {t.notes.deleteNote}
```

---

### 2. Journals.tsx

**Status**: Needs i18n import and full replacement

**Remaining strings**:
- Line 168: `alert('儲存失敗，請稍後再試');`
- Line 198: `alert('建立日記失敗');`
- Lines 244-258: Calendar toggle buttons
- Lines 306-318: Date navigation
- Lines 328-402: Edit/Preview/Save/Cancel buttons
- Lines 412-458: Metadata display and create button

**Fix approach**:
```typescript
import { useI18n } from '../i18n/I18nContext';

export default function Journals() {
  const { t, locale } = useI18n();

  // Replace all hardcoded strings with t.journal.* keys
}
```

---

### 3. Projects.tsx

**Status**: Partially implemented (has locale checks), needs full translation replacement

**Remaining strings**:
- Line 56: `alert('建立專案失敗');`
- Line 80: Subtitle
- Lines 88, 138, 149: Button labels
- Lines 162-217: Form labels and placeholders
- Line 249: Status mapping function
- Line 289: Due date display

**Already has locale**: Uses `locale === 'zh_Hant'` checks - needs to migrate to `t.projects.*`

---

### 4. ProjectDetail.tsx

**Status**: All Chinese, no i18n implementation

**Remaining strings**:
- Lines 57, 87, 106: Alert messages
- Line 135: Loading state
- Lines 148, 173: Back button text
- Line 151: Error message
- Lines 186-189: Status options
- Lines 200, 207: Metadata labels
- Line 217: Progress heading
- Line 252: Milestones heading
- Lines 267-282: Filter/sort options
- Lines 289-326: Milestone form

**Estimated effort**: 30-45 minutes

---

### 5. Dashboard.tsx

**Status**: Minimal hardcoded strings

**Remaining**:
- Line 105: `title={locale === 'zh_Hant' ? '重看新手導覽' : 'Replay Onboarding'}`

**Already fixed**: Most content uses `t.dashboard.*` correctly

---

### 6. LanguageSwitcher.tsx

**Status**: Title attribute hardcoded

**Remaining**:
- Line 15: `title={locale === 'en' ? 'Switch to 繁體中文' : 'Switch to English'}`

**Fix**: Add to translations as `common.switchLanguage`

---

## Missing Translation Keys to Add

Add these to `translations.ts`:

```typescript
// English
notes: {
  invalidFolder: 'Invalid folder name. Please enter: inbox, projects, areas, resources, or archive',
  movedTo: (folder: string, subPath?: string) =>
    `Moved to ${folder}${subPath ? `/${subPath}` : ''}`,
  moveFailed: 'Failed to move note',
},

common: {
  switchLanguage: 'Switch language',
},

// Chinese
notes: {
  invalidFolder: '無效的資料夾名稱。請輸入: inbox, projects, areas, resources, 或 archive',
  movedTo: (folder: string, subPath?: string) =>
    `已移動至 ${folder}${subPath ? `/${subPath}` : ''}`,
  moveFailed: '移動失敗',
},

common: {
  switchLanguage: '切換語言',
},
```

---

## Testing Checklist

After fixing all files:

- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Switch language in UI - all text changes
- [ ] Test alerts/messages in both languages
- [ ] Test all pages (Dashboard, Notes, Journals, Projects, Chat)
- [ ] Verify date formatting uses correct locale
- [ ] Check modals and forms

---

## Priority Order

1. ✅ Critical alerts (NoteDetail, Journals, Projects) - **DONE**
2. 🔄 NoteDetail UI text (buttons, headings, placeholders) - **IN PROGRESS**
3. ⏳ Journals UI text
4. ⏳ ProjectDetail (entire file)
5. ⏳ Projects remaining strings
6. ⏳ Minor fixes (Dashboard, LanguageSwitcher)

---

## Automated Fix Strategy

For systematic replacement, consider using this pattern:

1. Read file
2. Add i18n import if missing
3. Replace hardcoded Chinese strings with `t.*` keys
4. Replace locale-based conditionals with translation keys
5. Update date formatting to use `locale` variable
6. Test build

**Example command** (for future automation):
```bash
# Search for hardcoded Chinese
rg '[\u4e00-\u9fff]+' web-ui/src/pages/ -n

# Search for locale conditionals
rg "locale === 'zh_Hant'" web-ui/src/pages/ -n
```

---

## Current Status

**Files Completely Fixed**: 0/6
**Files Partially Fixed**: 2/6 (NoteDetail, JournalDetail)
**Files Not Started**: 4/6 (Journals, Projects, ProjectDetail, Dashboard)

**Estimated Time to Complete**: 2-3 hours for all remaining files
