import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi, notesApi } from '../api';
import type { Project, Note } from '../types';
import { ArrowLeft, Calendar, TrendingUp, CheckCircle, Circle, Plus, Flag, Filter, ArrowUpDown } from 'lucide-react';

export default function ProjectDetail() {
  const { name } = useParams<{ name: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Add Milestone State
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  
  // Milestone Filter & Sort
  const [milestoneFilter, setMilestoneFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [milestoneSort, setMilestoneSort] = useState<'date' | 'name'>('date');

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

  const handleStatusChange = async (newStatus: Project['status']) => {
    if (!project || !name) return;
    try {
      await projectsApi.update(name, { status: newStatus });
      setProject({ ...project, status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('更新狀態失敗');
    }
  };

  const handleProgressChange = async (newProgress: number) => {
    if (!project || !name) return;
    // Optimistic update
    setProject({
      ...project,
      progress: { ...project.progress, percentComplete: newProgress }
    });
    
    try {
      await projectsApi.updateProgress(name, newProgress);
    } catch (err) {
      console.error('Failed to update progress:', err);
      // Revert on error (reload project)
      loadProject(name);
    }
  };

  const handleMilestoneToggle = async (milestoneName: string, isCompleted: boolean) => {
    if (!project || !name || isCompleted) return; // Can only mark as complete for now

    try {
      await projectsApi.completeMilestone(name, milestoneName);
      // Reload to get updated state
      loadProject(name);
    } catch (err) {
      console.error('Failed to complete milestone:', err);
      alert('更新里程碑失敗');
    }
  };

  const handleAddMilestone = async () => {
    if (!project || !name || !newMilestoneName.trim()) return;

    setUpdating(true);
    try {
      await projectsApi.addMilestone(name, {
        title: newMilestoneName,
        due_date: newMilestoneDate || undefined
      });
      setNewMilestoneName('');
      setNewMilestoneDate('');
      setShowAddMilestone(false);
      loadProject(name);
    } catch (err) {
      console.error('Failed to add milestone:', err);
      alert('新增里程碑失敗');
    } finally {
      setUpdating(false);
    }
  };

  // Filter and sort milestones
  const filteredMilestones = (project?.progress.milestones || [])
    .filter(m => {
      if (milestoneFilter === 'all') return true;
      if (milestoneFilter === 'pending') return !m.completed;
      if (milestoneFilter === 'completed') return m.completed;
      return true;
    })
    .sort((a, b) => {
      if (milestoneSort === 'date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else {
        const nameA = a.name || a.title || '';
        const nameB = b.name || b.title || '';
        return nameA.localeCompare(nameB);
      }
    });

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
    active: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    'on-hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    archived: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden">
      {/* Header and Main Info - Fixed at top */}
      <div className="flex-shrink-0 space-y-6">
        <Link
          to="/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回專案列表
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value as Project['status'])}
                  className={`px-3 py-1 text-sm rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${statusColors[project.status]}`}
                >
                  <option value="active">活躍 (Active)</option>
                  <option value="on-hold">暫停 (On Hold)</option>
                  <option value="completed">完成 (Completed)</option>
                  <option value="archived">封存 (Archived)</option>
                </select>
              </div>
              <p className="text-gray-600 text-lg">{project.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-600 border-t border-gray-100 pt-4">
            {project.deadline && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">截止日期:</span>
                <span className="ml-2">{new Date(project.deadline).toLocaleDateString('zh-TW')}</span>
              </div>
            )}
            {project.created && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">建立於:</span>
                <span className="ml-2">{new Date(project.created).toLocaleDateString('zh-TW')}</span>
              </div>
            )}
          </div>

          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-base font-semibold text-gray-900">專案進度</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{project.progress.percentComplete}%</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={project.progress.percentComplete}
              onChange={(e) => handleProgressChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid - Scrollable Area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Milestones Column */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow flex flex-col min-h-0">
          {/* Sticky Header */}
          <div className="p-6 border-b border-gray-100 flex-shrink-0 bg-white rounded-t-lg z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">里程碑</h2>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {filteredMilestones.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Filter */}
                <div className="relative inline-flex items-center">
                  <Filter className="absolute left-2.5 h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={milestoneFilter}
                    onChange={(e) => setMilestoneFilter(e.target.value as any)}
                    className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <option value="all">全部顯示</option>
                    <option value="pending">未完成</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="relative inline-flex items-center">
                  <ArrowUpDown className="absolute left-2.5 h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={milestoneSort}
                    onChange={(e) => setMilestoneSort(e.target.value as any)}
                    className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <option value="date">按日期</option>
                    <option value="name">按名稱</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowAddMilestone(true)}
                  className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm ml-2"
                  title="新增里程碑"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add Milestone Form */}
            {showAddMilestone && (
              <div className="mt-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <h3 className="text-sm font-medium text-gray-900 mb-3">新增里程碑</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="里程碑名稱"
                    value={newMilestoneName}
                    onChange={(e) => setNewMilestoneName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setShowAddMilestone(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddMilestone}
                      disabled={!newMilestoneName.trim() || updating}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                    >
                      {updating ? '新增中...' : '新增'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

                    {/* Scrollable Milestones List */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-3 max-w-xl mx-auto"> {/* Adjusted max-w to xl */}
                        {filteredMilestones.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p>沒有符合條件的里程碑</p>
                          </div>
                        ) : (
                          filteredMilestones.map((milestone, index) => (
                            <div
                              key={index}
                              className={`flex items-start p-4 border rounded-lg transition-all group ${
                                milestone.completed 
                                  ? 'bg-gray-50 border-gray-100 opacity-75' 
                                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                              }`}
                            >
                              <button
                                onClick={() => handleMilestoneToggle(milestone.name || milestone.title || '', milestone.completed)}
                                disabled={milestone.completed}
                                className={`mr-4 mt-1 flex-shrink-0 transition-colors ${
                                  milestone.completed ? 'cursor-default' : 'cursor-pointer hover:text-green-600'
                                }`}
                              >
                                {milestone.completed ? (
                                  <CheckCircle className="h-6 w-6 text-green-500" />
                                ) : (
                                  <Circle className="h-6 w-6 text-gray-300 group-hover:text-blue-400" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                  <h3 className={`font-medium truncate text-base ${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                    {milestone.name || milestone.title}
                                  </h3>
                                  {milestone.due_date && (
                                    <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium ${
                                      new Date(milestone.due_date) < new Date() && !milestone.completed
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {new Date(milestone.due_date).toLocaleDateString('zh-TW')}
                                    </span>
                                  )}
                                </div>
                                {milestone.description && (
                                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{milestone.description}</p>
                                )}
                                {milestone.completed && milestone.completed_date && (
                                  <p className="text-xs text-green-600 mt-2 flex items-center bg-green-50 w-fit px-2 py-0.5 rounded">
                                    <CheckCircle className="h-3 w-3 mr-1.5" />
                                    完成於 {new Date(milestone.completed_date).toLocaleDateString('zh-TW')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>        </div>

        {/* Notes Sidebar - Scrollable */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow flex flex-col min-h-0 h-full">
          <div className="p-6 border-b border-gray-100 flex-shrink-0 bg-white rounded-t-lg z-10">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs font-bold">
                {notes.length}
              </span>
              相關筆記
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {notes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500 text-sm">這個專案還沒有筆記</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Link
                    key={note.id}
                    to={`/note/${note.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-200 hover:shadow-sm transition-all group bg-white"
                  >
                    <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
                      {note.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(note.created).toLocaleDateString('zh-TW')}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-[10px] text-gray-400 self-center">+{note.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
