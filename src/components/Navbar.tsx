import React from 'react';
import { 
  Home,
  LayoutDashboard, 
  GraduationCap, 
  Radio, 
  FileText, 
  Video, 
  Sparkles, 
  BarChart3,
  ShieldCheck,
  BookOpen,
  Zap
} from 'lucide-react';
import { ActiveTab, AppUser } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isLiveActive: boolean;
  currentUser?: AppUser | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isLiveActive,
  currentUser,
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; icon: any; badge?: string; isLive?: boolean; adminOnly?: boolean }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'exams', label: 'National Exams', icon: GraduationCap },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'exam_prep', label: 'Practice Drill', icon: Zap },
    { id: 'live_classes', label: 'Live Classes', icon: Radio, isLive: isLiveActive },
    { id: 'documents', label: 'Notes & PDFs', icon: FileText },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'ai_lab', label: 'AI Tutor', icon: Sparkles },
    { id: 'analytics', label: 'My Scores', icon: BarChart3 },
  ];

  if (currentUser) {
    navItems.splice(1, 0, { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
  }

  // If currentUser is admin, append Admin Management Tab
  if (currentUser?.role === 'admin') {
    navItems.push({
      id: 'admin',
      label: 'Admin Panel',
      icon: ShieldCheck,
      badge: 'ADMIN',
      adminOnly: true,
    });
  }

  return (
    <nav className="bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 text-slate-600 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAdminItem = item.adminOnly;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                id={`nav-${item.id}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? isAdminItem
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-emerald-700 text-white shadow-xs'
                    : isAdminItem
                    ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-900 border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white bg-white/60 border border-slate-200/60 shadow-2xs'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${
                  isActive 
                    ? 'text-white' 
                    : item.isLive 
                    ? 'text-red-500 animate-pulse' 
                    : isAdminItem
                    ? 'text-purple-600'
                    : 'text-slate-500'
                }`} />
                <span>{item.label}</span>
                {item.isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                )}
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : isAdminItem
                      ? 'bg-purple-200 text-purple-900'
                      : 'bg-slate-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
