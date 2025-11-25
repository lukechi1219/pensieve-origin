import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  FolderKanban,
  Inbox,
  Archive
} from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: '儀表板', href: '/', icon: LayoutDashboard },
  { name: '收件匣', href: '/notes/inbox', icon: Inbox },
  { name: '專案', href: '/projects', icon: FolderKanban },
  { name: '領域', href: '/notes/areas', icon: FileText },
  { name: '資源', href: '/notes/resources', icon: Archive },
  { name: '日記', href: '/journals', icon: BookOpen },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Pensieve</h1>
        <p className="text-sm text-gray-500 mt-1">第二大腦</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          CODE 方法論
          <div className="mt-1">Capture • Organize • Distill • Express</div>
        </div>
      </div>
    </div>
  );
}
