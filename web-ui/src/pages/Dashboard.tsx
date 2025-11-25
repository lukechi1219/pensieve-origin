import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { journalsApi, notesApi, projectsApi } from '../api';
import type { JournalStats, Note, Project } from '../types';
import { FileText, BookOpen, FolderKanban, TrendingUp, Flame } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [journalStats, notesResponse, projectsResponse] = await Promise.all([
        journalsApi.getStats(),
        notesApi.list({ folder: 'inbox' }),
        projectsApi.list(),
      ]);

      setStats(journalStats);
      setRecentNotes(notesResponse.items.slice(0, 5));
      setProjects(projectsResponse.items.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.title}</h1>
        <p className="mt-2 text-gray-600">{t.dashboard.welcome}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t.dashboard.stats.inbox}
          value={recentNotes.length}
          icon={FileText}
          color="blue"
          link="/notes/inbox"
        />
        <StatCard
          title={t.dashboard.stats.activeProjects}
          value={projects.length}
          icon={FolderKanban}
          color="purple"
          link="/projects"
        />
        <StatCard
          title={t.dashboard.stats.journalStreak}
          value={stats?.currentStreak || 0}
          icon={Flame}
          color="orange"
          link="/journals"
        />
        <StatCard
          title={t.dashboard.stats.journalTotal}
          value={stats?.totalEntries || 0}
          icon={BookOpen}
          color="green"
          link="/journals"
        />
      </div>

      {/* Recent notes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t.dashboard.stats.inbox}</h2>
          <Link
            to="/notes/inbox"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t.dashboard.viewAll}
          </Link>
        </div>
        {recentNotes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t.dashboard.emptyInbox}</p>
        ) : (
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <Link
                key={note.id}
                to={`/note/${note.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{note.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(note.created).toLocaleDateString('zh-TW')}
                </p>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Active projects */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t.dashboard.stats.activeProjects}</h2>
          <Link
            to="/projects"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t.dashboard.viewAll}
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t.dashboard.noActiveProjects}</p>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.name}
                to={`/projects/${project.name}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <span className="text-sm text-gray-500">{project.progress.percentComplete}%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress.percentComplete}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{project.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'orange' | 'green';
  link: string;
}

function StatCard({ title, value, icon: Icon, color, link }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <Link
      to={link}
      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Link>
  );
}
