import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Inbox, 
  FolderKanban, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Clock,
  HelpCircle 
} from 'lucide-react';
import { notesApi, projectsApi, journalsApi } from '../api';
import type { Note, ProjectListItem } from '../types';
import { useI18n } from '../i18n/I18nContext';
import OnboardingModal from '../components/OnboardingModal';

interface DashboardStats {
  inboxCount: number;
  activeProjectCount: number;
  journalStreak: number;
  totalJournals: number;
}

export default function Dashboard() {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [recentProjects, setRecentProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [notesRes, projectsRes, journalRes] = await Promise.all([
          notesApi.list(),
          projectsApi.list(),
          journalsApi.getStats(),
        ]);

        // Calculate inbox count (notes in 'inbox' folder)
        const inboxCount = notesRes.items.filter(
          (n) => !n.paraFolder || n.paraFolder === 'inbox'
        ).length;

        // Calculate active projects
        const activeProjects = projectsRes.items.filter(
          (p) => p.status === 'active'
        );

        setStats({
          inboxCount,
          activeProjectCount: activeProjects.length,
          journalStreak: journalRes.currentStreak,
          totalJournals: journalRes.totalEntries,
        });

        setRecentNotes(notesRes.items.slice(0, 5));
        setRecentProjects(activeProjects.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Check if user has onboarded
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    if (!hasOnboarded) {
      const timer = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasOnboarded', 'true');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={handleOnboardingClose} 
      />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.title}</h1>
          <p className="mt-2 text-gray-600">{t.dashboard.welcome}</p>
        </div>
        <button
          onClick={() => setShowOnboarding(true)}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title={t.dashboard.replayOnboarding}
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t.dashboard.stats.inbox}
          value={stats?.inboxCount || 0}
          icon={Inbox}
          to="/notes/inbox"
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          title={t.dashboard.stats.activeProjects}
          value={stats?.activeProjectCount || 0}
          icon={FolderKanban}
          to="/projects"
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <StatCard
          title={t.dashboard.stats.journalStreak}
          value={stats?.journalStreak || 0}
          icon={TrendingUp}
          to="/journals"
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          title={t.dashboard.stats.journalTotal}
          value={stats?.totalJournals || 0}
          icon={Calendar}
          to="/journals"
          color="text-orange-600"
          bg="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Notes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">{t.notes.title}</h2>
            <Link to="/notes/inbox" className="text-sm text-blue-600 hover:text-blue-800">
              {t.dashboard.viewAll}
            </Link>
          </div>
          <div className="p-6">
            {recentNotes.length > 0 ? (
              <div className="space-y-4">
                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    to={`/note/${note.id}`}
                    className="block group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                          <FileText className="h-5 w-5 text-gray-500 group-hover:text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {note.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(note.created).toLocaleDateString(locale === 'zh_Hant' ? 'zh-TW' : 'en-US')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t.dashboard.emptyInbox}
              </div>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">{t.projects.title}</h2>
            <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-800">
              {t.dashboard.viewAll}
            </Link>
          </div>
          <div className="p-6">
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project: ProjectListItem) => (
                  <Link
                    key={project.name}
                    to={`/projects/${project.name}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-indigo-50 transition-colors">
                          <FolderKanban className="h-5 w-5 text-gray-500 group-hover:text-indigo-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {project.name}
                          </h3>
                          <div className="mt-1 w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${project.progress.percentComplete}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">
                        {project.progress.percentComplete}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t.dashboard.noActiveProjects}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  to: string;
  color: string;
  bg: string;
}

function StatCard({ title, value, icon: Icon, to, color, bg }: StatCardProps) {
  return (
    <Link
      to={to}
      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Link>
  );
}