import React from 'react';
import { ActiveTab } from '../types';
import { Dice5, Users, UserCheck, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  studentCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  studentCount,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Dice5 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                課堂學生抽籤與分組
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                  教師專用
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                公平隨機抽籤 • 智慧視覺化分組
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              id="tab-picker-btn"
              onClick={() => onTabChange('picker')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Dice5 className="w-4 h-4 text-indigo-600" />
              <span>隨機抽籤</span>
            </button>

            <button
              id="tab-groups-btn"
              onClick={() => onTabChange('groups')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'groups'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>自動分組</span>
            </button>

            <button
              id="tab-roster-btn"
              onClick={() => onTabChange('roster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>名單管理</span>
              <span className={`ml-1 px-1.5 py-0.2 text-xs rounded-full ${
                studentCount > 0 
                  ? 'bg-indigo-100 text-indigo-700 font-semibold'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {studentCount}
              </span>
            </button>
          </nav>

          {/* Utility Actions (Sound & Fullscreen) */}
          <div className="flex items-center space-x-2">
            <button
              id="toggle-sound-btn"
              onClick={onToggleSound}
              title={soundEnabled ? '點擊關閉音效' : '點擊開啟音效'}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              id="toggle-fullscreen-btn"
              onClick={onToggleFullscreen}
              title={isFullscreen ? '退出全螢幕' : '全螢幕投影模式'}
              className="p-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors hidden sm:flex"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
