#!/bin/bash
# BUG-021 i18n Batch Fix Script
# Replaces all hardcoded Chinese strings with t.* translation keys

set -e

echo "🌐 Starting BUG-021 i18n batch fix..."
echo ""

# Fix Dashboard.tsx - replayOnboarding
echo "📝 Fixing Dashboard.tsx..."
sed -i.bak "s/title={locale === 'zh_Hant' ? '重看新手導覽' : 'Replay Onboarding'}/title={t.dashboard.replayOnboarding}/g" src/pages/Dashboard.tsx

# Fix LanguageSwitcher.tsx - switchLanguage
echo "📝 Fixing LanguageSwitcher.tsx..."
sed -i.bak "s/title={locale === 'en' ? 'Switch to 繁體中文' : 'Switch to English'}/title={t.common.switchLanguage}/g" src/components/LanguageSwitcher.tsx

echo "✅ Quick fixes complete!"
echo ""
echo "⚠️  Note: NoteDetail.tsx, Journals.tsx, Projects.tsx, and ProjectDetail.tsx"
echo "   have too many replacements for a bash script. These will be fixed manually."
echo ""
echo "🔧 Cleanup backup files..."
find src -name "*.bak" -delete

echo "✅ Batch fix complete! Build the project to verify."
