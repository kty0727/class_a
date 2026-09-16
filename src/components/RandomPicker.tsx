import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Student, PickHistoryItem } from '../types';
import { soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  History, 
  Undo2, 
  Copy, 
  Check, 
  Users, 
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  onNavigateToRoster: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLoadSample?: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onNavigateToRoster,
  soundEnabled,
  onToggleSound,
  onLoadSample,
}) => {
  // Mode: allow duplicates or no duplicates
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  
  // State for candidates in "no duplicates" mode
  const [drawnStudentIds, setDrawnStudentIds] = useState<string[]>([]);
  
  // History of picks in current session
  const [history, setHistory] = useState<PickHistoryItem[]>([]);
  
  // Rolling animation state
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [displayedName, setDisplayedName] = useState<string>('準備抽籤');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Animation interval refs
  const rollIntervalRef = useRef<number | null>(null);
  const rollTimeoutRef = useRef<number | null>(null);

  // Available candidate pool depending on allowDuplicates
  const availableCandidates = allowDuplicates
    ? students
    : students.filter((s) => !drawnStudentIds.includes(s.id));

  // Sync sound setting to audio manager
  useEffect(() => {
    soundEffects.enabled = soundEnabled;
  }, [soundEnabled]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    };
  }, []);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      // Dual side burst confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.3 }
      });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.7 }
      });
    } catch {
      // Confetti fallback
    }
  };

  // Perform random pick animation
  const handleStartPick = useCallback(() => {
    if (isRolling) return;
    if (availableCandidates.length === 0) return;

    setIsRolling(true);
    setSelectedStudent(null);
    setCopied(false);

    // Pick target winner immediately
    const winnerIndex = Math.floor(Math.random() * availableCandidates.length);
    const targetWinner = availableCandidates[winnerIndex];

    const startTime = Date.now();
    const duration = 2800; // total roll duration in ms
    let currentInterval = 40; // initial fast tick speed (ms)
    let tickCount = 0;

    const rollStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Random name flash during roll
      const randomIdx = Math.floor(Math.random() * students.length);
      setDisplayedName(students[randomIdx]?.name || '...');

      // Deceleration easing calculation: pitch and interval
      const pitchMultiplier = 1.3 - progress * 0.5;
      soundEffects.playTick(pitchMultiplier);
      tickCount++;

      if (progress < 1) {
        // Decelerate non-linearly
        currentInterval = 40 + Math.pow(progress, 2.5) * 280;
        rollTimeoutRef.current = window.setTimeout(rollStep, currentInterval);
      } else {
        // Roll complete! Settle on targetWinner
        setDisplayedName(targetWinner.name);
        setSelectedStudent(targetWinner);
        setIsRolling(false);

        // Sound fanfare & visual celebration
        soundEffects.playFanfare();
        triggerConfetti();

        // Record history & remove from candidate pool if no duplicates
        setHistory((prev) => [
          {
            id: `pick-${Date.now()}`,
            student: targetWinner,
            timestamp: new Date(),
            roundNumber: prev.length + 1,
          },
          ...prev,
        ]);

        if (!allowDuplicates) {
          setDrawnStudentIds((prev) => [...prev, targetWinner.id]);
        }
      }
    };

    rollStep();
  }, [isRolling, availableCandidates, students, allowDuplicates]);

  // Reset candidate pool
  const handleResetPool = () => {
    soundEffects.playShuffle();
    setDrawnStudentIds([]);
    setSelectedStudent(null);
    setDisplayedName('準備抽籤');
  };

  // Reset entire history
  const handleResetHistory = () => {
    if (window.confirm('確定要清除本次所有抽籤記錄嗎？')) {
      setHistory([]);
      setDrawnStudentIds([]);
      setSelectedStudent(null);
      setDisplayedName('準備抽籤');
    }
  };

  // Put a specific student back into pool (e.g. if absent)
  const handlePutBack = (studentId: string) => {
    soundEffects.playShuffle();
    setDrawnStudentIds((prev) => prev.filter((id) => id !== studentId));
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(null);
      setDisplayedName('已放回候選池');
    }
  };

  // Copy winner name
  const handleCopyWinner = () => {
    if (!selectedStudent) return;
    navigator.clipboard.writeText(selectedStudent.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard shortcut: spacebar to roll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isRolling && availableCandidates.length > 0) {
          handleStartPick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRolling, availableCandidates, handleStartPick]);

  // Empty state when no students uploaded
  if (students.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">名單尚未建立</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
          請先前往「名單管理」建立名冊，或直接載入預設模擬名單體驗隨機抽籤。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onLoadSample && (
            <button
              id="picker-load-sample-btn"
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              載入示範名單 (30人)
            </button>
          )}
          <button
            id="picker-go-to-roster-btn"
            onClick={onNavigateToRoster}
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all border border-slate-200"
          >
            前往名單管理
          </button>
        </div>
      </div>
    );
  }

  const isExhausted = !allowDuplicates && availableCandidates.length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Control Configuration Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Mode Toggle: Allow Duplicate vs No Duplicate */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            抽取模式
          </span>
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="mode-no-repeat-btn"
              onClick={() => setAllowDuplicates(false)}
              disabled={isRolling}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                !allowDuplicates
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>不重複抽取（抽出後移出）</span>
            </button>
            <button
              id="mode-allow-repeat-btn"
              onClick={() => setAllowDuplicates(true)}
              disabled={isRolling}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                allowDuplicates
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>允許重複抽取</span>
            </button>
          </div>
        </div>

        {/* Candidate Stats & Sound */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-sm">
          {!allowDuplicates ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">候選池：</span>
              <span
                id="remaining-count-badge"
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  availableCandidates.length > 0
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                剩餘 {availableCandidates.length} / {students.length} 人
              </span>
              {drawnStudentIds.length > 0 && (
                <button
                  id="reset-pool-btn"
                  onClick={handleResetPool}
                  disabled={isRolling}
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-medium ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  全員重置
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-medium">
              全班共 {students.length} 人（每次均等機率）
            </div>
          )}

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Sound Toggle */}
          <button
            id="picker-sound-toggle"
            onClick={onToggleSound}
            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? '音效已開' : '靜音'}</span>
          </button>
        </div>
      </div>

      {/* Primary Random Drawing Stage (Blackboard / Classroom Display) */}
      <div className="relative bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 text-white shadow-xl overflow-hidden flex flex-col items-center justify-center min-h-[360px]">
        {/* Subtle decorative glow circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badge: Mode Status */}
        <div className="mb-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-sm">
            {allowDuplicates ? '🔄 模式：重複抽取' : '🎯 模式：不重複抽取'}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            • 按空白鍵（Space）亦可抽籤
          </span>
        </div>

        {/* Central Animated Display Box */}
        <div className="w-full max-w-xl my-4 text-center">
          {isExhausted ? (
            <div className="py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-300 mx-auto flex items-center justify-center mb-3 border border-emerald-400/30">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                所有學生皆已抽出完畢！
              </h3>
              <p className="text-slate-300 text-sm mb-6">
                全班 {students.length} 位學生都已輪過一次。
              </p>
              <button
                id="exhausted-restart-btn"
                onClick={handleResetPool}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all text-base"
              >
                <RotateCcw className="w-5 h-5" />
                重新開始下一輪
              </button>
            </div>
          ) : (
            <div className="relative py-6 sm:py-10 px-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              {/* Rolling or Winner Display */}
              <div
                id="picker-display-name"
                className={`font-black tracking-wide transition-transform ${
                  isRolling
                    ? 'text-4xl sm:text-6xl text-amber-300 scale-105 select-none animate-pulse'
                    : selectedStudent
                    ? 'text-5xl sm:text-7xl text-white scale-100 drop-shadow-[0_4px_24px_rgba(255,255,255,0.3)]'
                    : 'text-3xl sm:text-5xl text-slate-400 font-medium'
                }`}
              >
                {displayedName}
              </div>

              {/* Extra Details when winner selected */}
              {selectedStudent && !isRolling && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    座號 #{selectedStudent.originalIndex || '-'}
                  </span>
                  <button
                    id="copy-winner-btn"
                    onClick={handleCopyWinner}
                    title="複製學生姓名"
                    className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已複製！' : '複製'}</span>
                  </button>
                  {!allowDuplicates && (
                    <button
                      id="put-back-winner-btn"
                      onClick={() => handlePutBack(selectedStudent.id)}
                      title="若學生缺席或不計入，可將其放回候選名單"
                      className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-100 bg-rose-500/20 hover:bg-rose-500/30 px-2.5 py-1 rounded-full transition-colors"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>缺席放回</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button: Start Pick */}
        {!isExhausted && (
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <button
              id="start-pick-btn"
              onClick={handleStartPick}
              disabled={isRolling}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-extrabold shadow-2xl transition-all ${
                isRolling
                  ? 'bg-amber-500 text-slate-950 cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isRolling ? (
                <>
                  <Sparkles className="w-6 h-6 animate-spin" />
                  <span>正在緊張抽出...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" />
                  <span>{selectedStudent ? '抽取下一位學生' : '開始隨機抽籤'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Pick History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-800">
              抽籤歷史記錄
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              已抽 {history.length} 次
            </span>
          </div>

          {history.length > 0 && (
            <button
              id="clear-history-btn"
              onClick={handleResetHistory}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center gap-1"
            >
              清空抽籤記錄
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6 min-h-[120px]">
          {history.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-400">
              尚未有抽籤記錄，點擊上方按鈕開始抽出第一位幸運學生！
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {history.map((item, idx) => (
                <div
                  key={item.id}
                  id={`history-item-${item.id}`}
                  className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-mono font-bold text-indigo-600">
                      #{history.length - idx}
                    </span>
                    <span className="text-[10px]">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-800">
                      {item.student.name}
                    </span>
                    {!allowDuplicates && drawnStudentIds.includes(item.student.id) && (
                      <button
                        onClick={() => handlePutBack(item.student.id)}
                        title="放回候選名單"
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
