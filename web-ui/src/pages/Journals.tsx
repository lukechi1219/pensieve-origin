import { useEffect, useState } from 'react';
import { journalsApi } from '../api';
import type { Journal, JournalStats } from '../types';
import { Calendar, TrendingUp } from 'lucide-react';

export default function Journals() {
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJournalStats();
  }, []);

  const loadJournalStats = async () => {
    try {
      const journalStats = await journalsApi.getStats();
      setStats(journalStats);
    } catch (error) {
      console.error('Failed to load journal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">日記</h1>
        <p className="mt-2 text-gray-600">追蹤您的日常反思與成長</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="總條目數"
          value={stats?.totalEntries || 0}
          icon={Calendar}
        />
        <StatCard
          title="當前連續天數"
          value={stats?.currentStreak || 0}
          icon={TrendingUp}
        />
        <StatCard
          title="最長連續天數"
          value={stats?.longestStreak || 0}
          icon={TrendingUp}
        />
      </div>

      {/* Placeholder for journal entries */}
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">日記功能即將推出</h3>
        <p className="text-gray-600">
          日記瀏覽、編輯和習慣追蹤功能正在開發中
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
