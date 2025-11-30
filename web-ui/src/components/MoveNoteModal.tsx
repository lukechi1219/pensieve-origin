import React, { useState, useEffect } from 'react';
import { X, Folder } from 'lucide-react';
import { projectsApi, notesApi } from '../api';
import type { ProjectListItem } from '../types';

interface MoveNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: string;
  onMove: (targetFolder: string, subPath?: string) => void;
}

const MoveNoteModal: React.FC<MoveNoteModalProps> = ({ isOpen, onClose, currentFolder, onMove }) => {
  const [selectedFolder, setSelectedFolder] = useState<string>(currentFolder);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [subfolders, setSubfolders] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>('');
  const [loadingSubfolders, setLoadingSubfolders] = useState(false);

  const folders = [
    { value: 'inbox', label: '收件匣 (Inbox)' },
    { value: 'projects', label: '專案 (Projects)' },
    { value: 'areas', label: '領域 (Areas)' },
    { value: 'resources', label: '資源 (Resources)' },
    { value: 'people', label: '人脈 (People)' },
    { value: 'archive', label: '封存 (Archive)' },
  ];

  useEffect(() => {
    if (selectedFolder === 'projects' && projects.length === 0) {
      setLoadingProjects(true);
      projectsApi.list()
        .then(res => setProjects(res.items))
        .catch(console.error)
        .finally(() => setLoadingProjects(false));
    }

    // Load subfolders for areas and resources
    if (selectedFolder === 'areas' || selectedFolder === 'resources') {
      setLoadingSubfolders(true);
      notesApi.listSubfolders(selectedFolder)
        .then(res => setSubfolders(res.subfolders))
        .catch(console.error)
        .finally(() => setLoadingSubfolders(false));
    } else {
      setSubfolders([]);
      setSelectedSubfolder('');
    }
  }, [selectedFolder]);

  const handleMove = () => {
    if (selectedFolder === 'projects' && selectedProject) {
      // Format: project-name/notes
      const subPath = `project-${selectedProject}/notes`;
      onMove(selectedFolder, subPath);
    } else if ((selectedFolder === 'areas' || selectedFolder === 'resources') && selectedSubfolder) {
      // Format: subfolder-name
      onMove(selectedFolder, selectedSubfolder);
    } else {
      onMove(selectedFolder);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">移動筆記到...</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {folders.map(folder => (
              <div key={folder.value} className="space-y-2">
                <label className={`flex items-center space-x-3 cursor-pointer p-3 border rounded-lg transition-colors ${
                  selectedFolder === folder.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="targetFolder"
                    value={folder.value}
                    checked={selectedFolder === folder.value}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <Folder className={`h-5 w-5 ${selectedFolder === folder.value ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`font-medium ${selectedFolder === folder.value ? 'text-blue-900' : 'text-gray-800'}`}>
                    {folder.label}
                    {folder.value === currentFolder && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        目前位置
                      </span>
                    )}
                  </span>
                </label>

                {/* Sub-selection for Projects */}
                {folder.value === 'projects' && selectedFolder === 'projects' && (
                  <div className="ml-8 pl-4 border-l-2 border-gray-100 animate-in slide-in-from-top-2">
                    {loadingProjects ? (
                      <p className="text-sm text-gray-500 py-2">載入專案中...</p>
                    ) : projects.length > 0 ? (
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">選擇專案...</option>
                        {projects.map((project: ProjectListItem) => (
                          <option key={project.name} value={project.name}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500 py-2">沒有可用的專案</p>
                    )}
                  </div>
                )}

                {/* Sub-selection for Areas and Resources */}
                {(folder.value === 'areas' || folder.value === 'resources') &&
                 selectedFolder === folder.value && (
                  <div className="ml-8 pl-4 border-l-2 border-gray-100 animate-in slide-in-from-top-2">
                    {loadingSubfolders ? (
                      <p className="text-sm text-gray-500 py-2">載入子資料夾中...</p>
                    ) : subfolders.length > 0 ? (
                      <select
                        value={selectedSubfolder}
                        onChange={(e) => setSelectedSubfolder(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">根目錄（不選擇子資料夾）</option>
                        {subfolders.map(subfolder => (
                          <option key={subfolder.name} value={subfolder.name}>
                            {subfolder.name} ({subfolder.count} 筆記)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500 py-2">沒有子資料夾</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-100 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleMove}
            disabled={
              // Can't move if folder is the same and no subfolder/project is selected
              (selectedFolder === currentFolder && !selectedProject && !selectedSubfolder) ||
              // Projects must have a project selected
              (selectedFolder === 'projects' && !selectedProject)
            }
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            移動
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveNoteModal;