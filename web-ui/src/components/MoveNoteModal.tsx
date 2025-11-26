import React, { useState } from 'react';
import { X, Folder } from 'lucide-react';

interface MoveNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: string;
  onMove: (targetFolder: string) => void;
}

const MoveNoteModal: React.FC<MoveNoteModalProps> = ({ isOpen, onClose, currentFolder, onMove }) => {
  const [selectedFolder, setSelectedFolder] = useState<string>(currentFolder);

  const folders = [
    { value: 'inbox', label: '收件匣 (Inbox)' },
    { value: 'projects', label: '專案 (Projects)' },
    { value: 'areas', label: '領域 (Areas)' },
    { value: 'resources', label: '資源 (Resources)' },
    { value: 'archive', label: '封存 (Archive)' },
  ];

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
          <p className="text-gray-700">選擇一個目標資料夾：</p>
          <div className="space-y-3">
            {folders.map(folder => (
              <label key={folder.value} className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="targetFolder"
                  value={folder.value}
                  checked={selectedFolder === folder.value}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <Folder className="h-5 w-5 text-gray-500" />
                <span className="text-gray-800 font-medium">{folder.label}</span>
              </label>
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
            onClick={() => onMove(selectedFolder)}
            disabled={selectedFolder === currentFolder}
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
