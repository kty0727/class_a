import React, { useState, useEffect } from 'react';
import { Student, StudentGroup } from '../types';
import { soundEffects } from '../utils/audio';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Check, 
  Download, 
  Minus, 
  Plus, 
  Printer, 
  ArrowRightLeft,
  Sparkles,
  Layers
} from 'lucide-react';

interface GroupMakerProps {
  students: Student[];
  onNavigateToRoster: () => void;
  onLoadSample?: () => void;
}

// Visually distinct theme colors for groups
const GROUP_PALETTES = [
  { name: 'Indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-600 text-white', accent: 'border-indigo-400' },
  { name: 'Emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-600 text-white', accent: 'border-emerald-400' },
  { name: 'Amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-600 text-white', accent: 'border-amber-400' },
  { name: 'Rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', badge: 'bg-rose-600 text-white', accent: 'border-rose-400' },
  { name: 'Cyan', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', badge: 'bg-cyan-600 text-white', accent: 'border-cyan-400' },
  { name: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-600 text-white', accent: 'border-purple-400' },
  { name: 'Teal', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', badge: 'bg-teal-600 text-white', accent: 'border-teal-400' },
  { name: 'Orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-600 text-white', accent: 'border-orange-400' },
  { name: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-600 text-white', accent: 'border-blue-400' },
  { name: 'Fuchsia', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-900', badge: 'bg-fuchsia-600 text-white', accent: 'border-fuchsia-400' },
];

export const GroupMaker: React.FC<GroupMakerProps> = ({
  students,
  onNavigateToRoster,
  onLoadSample,
}) => {
  // Config: Target members per group (as requested: "可以設定要幾個人一組")
  const [membersPerGroup, setMembersPerGroup] = useState<number>(4);
  
  // Remainder handling: 'separate' (餘數自成一組) or 'distribute' (餘數平均分配至各組)
  const [remainderStrategy, setRemainderStrategy] = useState<'separate' | 'distribute'>('separate');
  
  // Generated groups
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [csvDownloaded, setCsvDownloaded] = useState<boolean>(false);

  // Quick preset sizes
  const presets = [2, 3, 4, 5, 6];

  // Helper to shuffle array randomly (Fisher-Yates)
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Perform group generation
  const handleGenerateGroups = () => {
    if (students.length === 0) return;
    
    setIsShuffling(true);
    soundEffects.playShuffle();

    setTimeout(() => {
      const shuffled: Student[] = shuffleArray<Student>(students);
      const total = shuffled.length;
      const size = Math.max(1, Math.min(membersPerGroup, total));

      let resultGroups: StudentGroup[] = [];

      if (remainderStrategy === 'separate') {
        // Simple chunking: last group takes the remainder
        const numGroups = Math.ceil(total / size);
        for (let i = 0; i < numGroups; i++) {
          const start = i * size;
          const end = Math.min(start + size, total);
          const chunk = shuffled.slice(start, end);
          resultGroups.push({
            id: `grp-${i + 1}-${Date.now()}`,
            groupNumber: i + 1,
            name: `第 ${i + 1} 組`,
            members: chunk,
            color: GROUP_PALETTES[i % GROUP_PALETTES.length].name,
          });
        }
      } else {
        // Distribute remainder: determine base number of groups, then distribute remainder items one-by-one
        const baseGroupCount = Math.max(1, Math.floor(total / size));
        const groupLists: Student[][] = Array.from({ length: baseGroupCount }, (): Student[] => []);

        shuffled.forEach((student, index) => {
          const targetGroupIndex = index % baseGroupCount;
          groupLists[targetGroupIndex].push(student);
        });

        resultGroups = groupLists.map((members, idx) => ({
          id: `grp-${idx + 1}-${Date.now()}`,
          groupNumber: idx + 1,
          name: `第 ${idx + 1} 組`,
          members,
          color: GROUP_PALETTES[idx % GROUP_PALETTES.length].name,
        }));
      }

      setGroups(resultGroups);
      setIsShuffling(false);
      soundEffects.playFanfare();
    }, 400);
  };

  // Auto-generate on first load if groups are empty and students exist
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      handleGenerateGroups();
    }
  }, [students.length]);

  // Adjust group size
  const handleSetSize = (newSize: number) => {
    const clamped = Math.max(1, Math.min(newSize, students.length || 1));
    setMembersPerGroup(clamped);
  };

  // Copy formatted grouping results for LINE / Google Classroom / Teams
  const handleCopyResults = () => {
    if (groups.length === 0) return;

    let text = `【分組結果】共 ${students.length} 位學生，分成 ${groups.length} 組\n`;
    text += `----------------------------------------\n`;
    groups.forEach((g) => {
      const memberNames = g.members.map((m) => m.name).join('、');
      text += `${g.name} (${g.members.length} 人)：${memberNames}\n`;
    });
    text += `----------------------------------------\n`;
    text += `產生時間：${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Export grouping to CSV
  const handleExportCsv = () => {
    if (groups.length === 0) return;

    let csvContent = '\uFEFF組別,組名,組內座號,學生姓名,原始名冊座號\n';
    groups.forEach((g) => {
      g.members.forEach((m, memberIdx) => {
        csvContent += `${g.groupNumber},"${g.name}",${memberIdx + 1},"${m.name}",${m.originalIndex || ''}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `課堂學生分組名單_${groups.length}組_每組${membersPerGroup}人_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCsvDownloaded(true);
    setTimeout(() => {
      setCsvDownloaded(false);
    }, 3000);
  };

  // Print friendly view
  const handlePrint = () => {
    window.print();
  };

  // Mathematical summary
  const totalStudents = students.length;
  const targetSize = Math.max(1, membersPerGroup);
  const calculatedGroups = remainderStrategy === 'separate' 
    ? Math.ceil(totalStudents / targetSize)
    : Math.max(1, Math.floor(totalStudents / targetSize));
  const remainder = totalStudents % targetSize;

  if (students.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">名單尚未建立</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
          請先前往「名單管理」建立學生名冊，或直接載入預設模擬名單體驗自動分組。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onLoadSample && (
            <button
              id="groups-load-sample-btn"
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              載入示範名單 (30人)
            </button>
          )}
          <button
            id="groups-go-to-roster-btn"
            onClick={onNavigateToRoster}
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all border border-slate-200"
          >
            前往名單管理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Settings Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Group Size Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                設定每組人數
              </h2>
              <span className="text-xs text-slate-500 font-normal">
                （全班目前共 {totalStudents} 人）
              </span>
            </div>

            {/* Stepper + Presets */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Counter Input */}
              <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 p-1">
                <button
                  id="decrease-group-size-btn"
                  onClick={() => handleSetSize(membersPerGroup - 1)}
                  disabled={membersPerGroup <= 1}
                  className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 disabled:opacity-40 rounded-lg text-slate-700 shadow-sm transition-all"
                  title="減少人數"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <div className="px-4 text-center">
                  <span className="text-lg font-black text-indigo-700" id="current-group-size-val">
                    {membersPerGroup}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">人 / 組</span>
                </div>

                <button
                  id="increase-group-size-btn"
                  onClick={() => handleSetSize(membersPerGroup + 1)}
                  disabled={membersPerGroup >= totalStudents}
                  className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 disabled:opacity-40 rounded-lg text-slate-700 shadow-sm transition-all"
                  title="增加人數"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Pills */}
              <div className="flex items-center gap-1.5">
                {presets.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSetSize(size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      membersPerGroup === size
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {size} 人
                  </button>
                ))}
              </div>
            </div>

            {/* Remainder Strategy Selection */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 font-medium">餘數處理方式：</span>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  id="remainder-separate-btn"
                  onClick={() => setRemainderStrategy('separate')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    remainderStrategy === 'separate'
                      ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  餘數自成一組
                </button>
                <button
                  id="remainder-distribute-btn"
                  onClick={() => setRemainderStrategy('distribute')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    remainderStrategy === 'distribute'
                      ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  餘數均分入各組（最平均）
                </button>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="generate-groups-btn"
              onClick={handleGenerateGroups}
              disabled={isShuffling}
              className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-base font-bold transition-all shadow-md ${
                isShuffling
                  ? 'bg-emerald-500 text-white cursor-wait animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Shuffle className={`w-5 h-5 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{isShuffling ? '正在隨機分組...' : '隨機重新分組'}</span>
            </button>
          </div>
        </div>

        {/* Calculation Details Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">預計分配：</span>
            <span>
              {totalStudents} 位學生 ÷ 每組 {membersPerGroup} 人 ＝ 共分為{' '}
              <strong className="text-emerald-700 font-bold">{calculatedGroups} 組</strong>
              {remainder > 0 && remainderStrategy === 'separate' && (
                <span className="text-amber-700 ml-1">
                  （前 {calculatedGroups - 1} 組各 {membersPerGroup} 人，最後 1 組 {remainder} 人）
                </span>
              )}
              {remainder > 0 && remainderStrategy === 'distribute' && (
                <span className="text-indigo-700 ml-1">
                  （{remainder} 組各有 {membersPerGroup + 1} 人，其餘組各有 {membersPerGroup} 人）
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Group Cards Visual Display Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Visualizer Header Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">
              分組視覺化展示
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              已產生 {groups.length} 組
            </span>
          </div>

          {/* Action buttons: Copy & Download */}
          <div className="flex items-center gap-2">
            <button
              id="copy-groups-btn"
              onClick={handleCopyResults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">已複製名單！</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>複製文字結果</span>
                </>
              )}
            </button>

            <button
              id="export-groups-csv-btn"
              onClick={handleExportCsv}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                csvDownloaded
                  ? 'bg-emerald-800 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
              title="下載分組結果為 CSV 檔案（支援 Excel UTF-8 開啟）"
            >
              {csvDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>分組 CSV 下載成功！</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-100" />
                  <span>下載分組 CSV 檔案</span>
                </>
              )}
            </button>

            <button
              id="print-groups-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors hidden sm:inline-flex"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>列印 / 投影</span>
            </button>
          </div>
        </div>

        {/* Visualized Grid of Group Cards */}
        <div className="p-4 sm:p-6 min-h-[300px]">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">尚未產生分組</p>
              <p className="text-sm text-slate-400 mt-1">
                設定上方人數後點擊「隨機重新分組」即可查看
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groups.map((group, groupIdx) => {
                const palette = GROUP_PALETTES[groupIdx % GROUP_PALETTES.length];

                return (
                  <div
                    key={group.id}
                    id={`group-card-${group.groupNumber}`}
                    className={`rounded-2xl border ${palette.border} bg-white shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:scale-[1.01]`}
                  >
                    {/* Group Header */}
                    <div className={`px-4 py-3 border-b ${palette.border} ${palette.bg} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${palette.badge}`}>
                          {group.groupNumber}
                        </span>
                        <h4 className={`font-bold text-sm ${palette.text}`}>
                          {group.name}
                        </h4>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                        {group.members.length} 人
                      </span>
                    </div>

                    {/* Group Members List */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-start">
                      {group.members.map((member, memberIdx) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-500 flex items-center justify-center flex-shrink-0">
                              {memberIdx + 1}
                            </span>
                            <span className="text-sm font-semibold text-slate-800 truncate" title={member.name}>
                              {member.name}
                            </span>
                          </div>
                          {member.originalIndex && (
                            <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                              #{member.originalIndex}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
