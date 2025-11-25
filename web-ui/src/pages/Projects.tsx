import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api';
import type { Project } from '../types';
import { FolderKanban, TrendingUp } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function Projects() {
  const { t, locale } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsApi.list();
      setProjects(response.items);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t.projects.loading}</div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const otherProjects = projects.filter(p => p.status !== 'active' && p.status !== 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t.projects.title}</h1>
        <p className="mt-2 text-gray-600">
          {locale === 'zh_Hant' ? '管理您的短期目標（2-3個月期限）' : 'Manage your short-term goals (2-3 month timeframe)'}
        </p>
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.projects.active}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.projects.completed}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedProjects.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.projects.archived}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherProjects.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </section>
      )}

      {projects.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t.projects.noProjects}</h3>
          <p className="text-gray-600">{t.projects.createFirst}</p>
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  const { t, locale } = useI18n();

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    'on-hold': 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return t.projects.active;
      case 'completed':
        return t.projects.completed;
      case 'on-hold':
        return locale === 'zh_Hant' ? '暫停' : 'On Hold';
      case 'archived':
        return t.projects.archived;
      default:
        return status;
    }
  };

  return (
    <Link
      to={`/projects/${project.name}`}
      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
        <span className={`px-2 py-1 text-xs rounded ${statusColors[project.status]}`}>
          {getStatusLabel(project.status)}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">{project.description}</p>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t.projects.progress}</span>
          <span className="font-medium text-gray-900">{project.progress.percentComplete}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${project.progress.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Deadline */}
      {project.deadline && (
        <div className="mt-4 text-sm text-gray-500">
          {locale === 'zh_Hant' ? '截止日期' : 'Deadline'}: {new Date(project.deadline).toLocaleDateString(locale === 'zh_Hant' ? 'zh-TW' : 'en-US')}
        </div>
      )}
    </Link>
  );
}
