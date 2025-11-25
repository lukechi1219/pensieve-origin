import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi, notesApi } from '../api';
import type { Project, Note } from '../types';
import { ArrowLeft, Calendar, TrendingUp, CheckCircle, Circle } from 'lucide-react';

export default function ProjectDetail() {
  const { name } = useParams<{ name: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (name) {
      loadProject(name);
    }
  }, [name]);

  const loadProject = async (projectName: string) => {
    setLoading(true);
    setError(null);
    try {
      const projectData = await projectsApi.getByName(projectName);
      setProject(projectData);

      // Load notes for this project
      // For now, we'll filter notes by checking if their filePath contains the project folder
      // This is a temporary solution until we have a proper API endpoint for project notes
      const allNotes = await notesApi.list({ folder: 'projects' });
      const projectNotes = allNotes.items.filter(note =>
        note.filePath?.includes(`/project-${projectName}/`)
      );
      setNotes(projectNotes);
    } catch (err) {
      console.error('Failed to load project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
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

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link
          to="/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回專案列表
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error || '找不到專案'}</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    'on-hold': 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  const statusLabels = {
    active: '活躍',
    completed: '已完成',
    'on-hold': '暫停',
    archived: '已封存',
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/projects"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回專案列表
      </Link>

      {/* Project header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
          {project.deadline && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              截止日期: {new Date(project.deadline).toLocaleDateString('zh-TW')}
            </div>
          )}
          {project.created && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              建立於: {new Date(project.created).toLocaleDateString('zh-TW')}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">專案進度</span>
            <span className="text-sm font-semibold text-gray-900">{project.progress.percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${project.progress.percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestones */}
      {project.progress.milestones && project.progress.milestones.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">里程碑</h2>
          <div className="space-y-3">
            {project.progress.milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex items-start p-3 border border-gray-200 rounded-lg"
              >
                <div className="mr-3 mt-1">
                  {milestone.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {milestone.name || milestone.title}
                  </h3>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                  )}
                  {milestone.due_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      截止: {new Date(milestone.due_date).toLocaleDateString('zh-TW')}
                    </p>
                  )}
                  {milestone.completed && milestone.completed_date && (
                    <p className="text-xs text-green-600 mt-1">
                      完成於: {new Date(milestone.completed_date).toLocaleDateString('zh-TW')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          相關筆記 ({notes.length})
        </h2>
        {notes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">這個專案還沒有筆記</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
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
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
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

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            新增筆記
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            更新進度
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            編輯專案
          </button>
          {project.status === 'active' && (
            <button className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              標記為完成
            </button>
          )}
          <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            封存專案
          </button>
        </div>
      </div>
    </div>
  );
}
