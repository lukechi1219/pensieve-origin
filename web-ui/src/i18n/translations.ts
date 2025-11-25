export const translations = {
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      inbox: 'Inbox',
      projects: 'Projects',
      areas: 'Areas',
      resources: 'Resources',
      journal: 'Journal',
      chat: 'Chat',
    },

    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back to your second brain',
      stats: {
        inbox: 'Inbox',
        activeProjects: 'Active Projects',
        journalStreak: 'Journal Streak',
        journalTotal: 'Total Journals',
      },
      viewAll: 'View all →',
      emptyInbox: 'Inbox is empty',
      noActiveProjects: 'No active projects',
    },

    // Notes
    notes: {
      title: 'Notes',
      newNote: 'New Note',
      noNotes: 'No notes here yet',
      createFirst: 'Create your first note',
      search: 'Search notes...',
      moveToInbox: 'Move to Inbox',
      moveToProjects: 'Move to Projects',
      moveToAreas: 'Move to Areas',
      moveToResources: 'Move to Resources',
      moveToArchive: 'Move to Archive',
      delete: 'Delete',
      loading: 'Loading...',
      notFound: 'Note not found',
      backToList: 'Back to note list',
      count: (count: number) => `${count} notes`,
      codeFlags: {
        inspiring: 'Inspiring',
        useful: 'Useful',
        personal: 'Personal',
        surprising: 'Surprising',
      },
      folders: {
        inbox: 'Inbox',
        projects: 'Projects',
        areas: 'Areas',
        resources: 'Resources',
        archive: 'Archive',
      },
    },

    // Journal
    journal: {
      title: 'Journal',
      subtitle: 'Track your daily reflections and growth',
      entries: 'Entries',
      newEntry: 'New Entry',
      noEntries: 'No journal entries yet',
      createFirst: 'Create your first journal entry',
      currentStreak: 'Current Streak',
      longestStreak: 'Longest Streak',
      days: 'days',
      totalEntries: 'Total Entries',
      loading: 'Loading...',
      comingSoon: 'Journal Feature Coming Soon',
      comingSoonDesc: 'Journal browsing, editing, and habit tracking features are under development',
    },

    // Projects
    projects: {
      title: 'Projects',
      newProject: 'New Project',
      noProjects: 'No projects yet',
      createFirst: 'Create your first project',
      active: 'Active',
      completed: 'Completed',
      archived: 'Archived',
      progress: 'Progress',
      status: 'Status',
      loading: 'Loading...',
    },

    // Chat
    chat: {
      title: 'Chat History',
      newChat: 'New Chat',
      noChats: 'No chat history yet',
      createFirst: 'Create your first conversation',
      messages: 'messages',
      lastUpdate: 'Last update',
      voiceMode: 'Voice Companion',
      enableVoice: 'Enable voice companion',
      disableVoice: 'Disable voice companion',
      sendMessage: 'Send',
      sending: 'Sending...',
      inputPlaceholder: 'Type a message... (Enter to send)',
      noMessages: 'No messages yet, start the conversation!',
      deleteChat: 'Delete conversation',
      confirmDelete: 'Are you sure you want to delete this conversation?',
    },

    // JARVIS
    jarvis: {
      summarize: 'Summarize',
      summarizing: 'Summarizing...',
      replay: 'Replay',
      distill: 'Distill',
      error: 'Failed to generate summary',
    },

    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      today: 'Today',
      yesterday: 'Yesterday',
      daysAgo: (days: number) => `${days} days ago`,
    },

    // Time formats
    time: {
      justNow: 'Just now',
      minutesAgo: (min: number) => `${min} minutes ago`,
      hoursAgo: (hours: number) => `${hours} hours ago`,
    },
  },

  zh_Hant: {
    // 導覽
    nav: {
      dashboard: '儀表板',
      inbox: '收件匣',
      projects: '專案',
      areas: '領域',
      resources: '資源',
      journal: '日記',
      chat: '對話',
    },

    // 儀表板
    dashboard: {
      title: '儀表板',
      welcome: '歡迎回到您的第二大腦',
      stats: {
        inbox: '收件匣',
        activeProjects: '活躍專案',
        journalStreak: '日記連續天數',
        journalTotal: '日記總數',
      },
      viewAll: '查看全部 →',
      emptyInbox: '收件匣是空的',
      noActiveProjects: '沒有活躍的專案',
    },

    // 筆記
    notes: {
      title: '筆記',
      newNote: '新筆記',
      noNotes: '這裡還沒有筆記',
      createFirst: '建立第一筆筆記',
      search: '搜尋筆記...',
      moveToInbox: '移至收件匣',
      moveToProjects: '移至專案',
      moveToAreas: '移至領域',
      moveToResources: '移至資源',
      moveToArchive: '移至封存',
      delete: '刪除',
      loading: '載入中...',
      notFound: '找不到筆記',
      backToList: '返回筆記列表',
      count: (count: number) => `共 ${count} 則筆記`,
      codeFlags: {
        inspiring: '啟發',
        useful: '實用',
        personal: '個人',
        surprising: '驚喜',
      },
      folders: {
        inbox: '收件匣',
        projects: '專案',
        areas: '領域',
        resources: '資源',
        archive: '封存',
      },
    },

    // 日記
    journal: {
      title: '日記',
      subtitle: '追蹤您的日常反思與成長',
      entries: '條目',
      newEntry: '新日記',
      noEntries: '尚無日記',
      createFirst: '建立第一筆日記',
      currentStreak: '當前連續天數',
      longestStreak: '最長連續天數',
      days: '天',
      totalEntries: '總條目數',
      loading: '載入中...',
      comingSoon: '日記功能即將推出',
      comingSoonDesc: '日記瀏覽、編輯和習慣追蹤功能正在開發中',
    },

    // 專案
    projects: {
      title: '專案',
      newProject: '新專案',
      noProjects: '尚無專案',
      createFirst: '建立第一個專案',
      active: '進行中',
      completed: '已完成',
      archived: '已封存',
      progress: '進度',
      status: '狀態',
      loading: '載入中...',
    },

    // 對話
    chat: {
      title: '對話記錄',
      newChat: '新對話',
      noChats: '尚無對話記錄',
      createFirst: '建立第一個對話',
      messages: '則訊息',
      lastUpdate: '最後更新',
      voiceMode: '語音陪聊',
      enableVoice: '開啟語音陪聊',
      disableVoice: '關閉語音陪聊',
      sendMessage: '送出',
      sending: '傳送中...',
      inputPlaceholder: '輸入訊息... (Enter 送出)',
      noMessages: '尚無訊息，開始對話吧！',
      deleteChat: '刪除對話',
      confirmDelete: '確定要刪除此對話嗎？',
    },

    // JARVIS
    jarvis: {
      summarize: '總結',
      summarizing: '總結中...',
      replay: '重播',
      distill: '精煉',
      error: '無法生成摘要',
    },

    // 通用
    common: {
      save: '儲存',
      cancel: '取消',
      delete: '刪除',
      edit: '編輯',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      loading: '載入中...',
      error: '錯誤',
      success: '成功',
      confirm: '確認',
      today: '今天',
      yesterday: '昨天',
      daysAgo: (days: number) => `${days} 天前`,
    },

    // 時間格式
    time: {
      justNow: '剛剛',
      minutesAgo: (min: number) => `${min} 分鐘前`,
      hoursAgo: (hours: number) => `${hours} 小時前`,
    },
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = typeof translations.en;
