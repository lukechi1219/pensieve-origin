import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  FolderKanban,
  Inbox,
  Archive,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useI18n } from '../i18n/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useI18n();

  const navigation = [
    { name: t.nav.dashboard, href: '/', icon: LayoutDashboard },
    { name: t.nav.inbox, href: '/notes/inbox', icon: Inbox },
    { name: t.nav.projects, href: '/projects', icon: FolderKanban },
    { name: t.nav.areas, href: '/notes/areas', icon: FileText },
    { name: t.nav.resources, href: '/notes/resources', icon: Archive },
    { name: t.nav.journal, href: '/journals', icon: BookOpen },
    { name: t.nav.chat, href: '/chats', icon: MessageSquare },
  ];

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <div className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Pensieve</h1>
          <p className="text-sm text-gray-500 mt-1">第二大腦</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
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
        <div className="p-4 border-t border-gray-200 space-y-3">
          <LanguageSwitcher />
          <div className="text-xs text-gray-500 text-center">
            CODE 方法論
            <div className="mt-1">Capture • Organize • Distill • Express</div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar - slide from left */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col',
          'transform transition-transform duration-300 ease-in-out z-40',
          'md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Pensieve</h1>
          <p className="text-sm text-gray-500 mt-1">第二大腦</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onClose}
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
        <div className="p-4 border-t border-gray-200 space-y-3">
          <LanguageSwitcher />
          <div className="text-xs text-gray-500 text-center">
            CODE 方法論
            <div className="mt-1">Capture • Organize • Distill • Express</div>
          </div>
        </div>
      </div>
    </>
  );
}
