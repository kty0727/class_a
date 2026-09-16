import React, { useState, useEffect } from 'react';
import { Student, ActiveTab } from './types';
import { Navbar } from './components/Navbar';
import { RandomPicker } from './components/RandomPicker';
import { GroupMaker } from './components/GroupMaker';
import { RosterManager } from './components/RosterManager';
import { createStudentObjects, SAMPLE_STUDENTS } from './utils/csvParser';
import { soundEffects } from './utils/audio';

const STORAGE_KEY_STUDENTS = 'classroom_students_roster_v1';
const STORAGE_KEY_SOUND = 'classroom_sound_enabled_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('picker');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SOUND);
    return saved !== null ? saved === 'true' : true;
  });

  // Students state with persistent localStorage
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    // Default initial seed with sample students so the teacher immediately sees a working app
    return createStudentObjects(SAMPLE_STUDENTS);
  });

  // Save students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch {
      // Ignore storage quota
    }
  }, [students]);

  // Save sound preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, String(soundEnabled));
      soundEffects.enabled = soundEnabled;
    } catch {
      // Ignore storage quota
    }
  }, [soundEnabled]);

  // Toggle sound
  const handleToggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleLoadSample = () => {
    setStudents(createStudentObjects(SAMPLE_STUDENTS));
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        studentCount={students.length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Classroom Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'groups' && (
          <GroupMaker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={setStudents}
            onClearHistory={() => {}}
          />
        )}
      </main>

      {/* Classroom Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>課堂學生抽籤與分組工具 • 專為教學現場設計</span>
          <span>支援 CSV 匯入、即時音效、動畫、不重複抽取與自訂分組人數</span>
        </div>
      </footer>
    </div>
  );
}
