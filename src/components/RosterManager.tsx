import React, { useState, useRef, useMemo } from 'react';
import { Student } from '../types';
import { 
  parseRawStudentText, 
  createStudentObjects, 
  SIMULATION_PRESETS,
  SimulationPreset 
} from '../utils/csvParser';
import { 
  Upload, 
  Clipboard, 
  Trash2, 
  UserPlus, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  X,
  AlertTriangle,
  UserCheck,
  Check,
  BookOpen,
  Filter
} from 'lucide-react';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onClearHistory: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onClearHistory,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [singleName, setSingleName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ 
    type: 'success' | 'error' | 'warning'; 
    text: string 
  } | null>(null);
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Duplicate names detection
  const nameCounts = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      const trimmed = s.name.trim();
      map.set(trimmed, (map.get(trimmed) || 0) + 1);
    });
    return map;
  }, [students]);

  const duplicateEntries = useMemo(() => {
    const duplicates: { name: string; count: number }[] = [];
    nameCounts.forEach((count, name) => {
      if (count > 1) {
        duplicates.push({ name, count });
      }
    });
    return duplicates;
  }, [nameCounts]);

  const totalExtraDuplicates = useMemo(() => {
    return duplicateEntries.reduce((sum, item) => sum + (item.count - 1), 0);
  }, [duplicateEntries]);

  // One-click remove duplicates (retains first occurrence)
  const handleRemoveDuplicates = () => {
    if (duplicateEntries.length === 0) return;

    const seen = new Set<string>();
    const uniqueStudents: Student[] = [];
    let removedCount = 0;

    students.forEach((s) => {
      const trimmed = s.name.trim();
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        uniqueStudents.push({
          ...s,
          originalIndex: uniqueStudents.length + 1,
        });
      } else {
        removedCount++;
      }
    });

    onUpdateStudents(uniqueStudents);
    onClearHistory();
    setShowOnlyDuplicates(false);
    showNotification(`已成功一次性移除 ${removedCount} 筆重複姓名！現有名單共 ${uniqueStudents.length} 位不重複學生。`, 'success');
  };

  // Process and import name array
  const importNameList = (names: string[], sourceName: string) => {
    if (names.length === 0) {
      showNotification('未找到任何有效學生姓名，請確認內容格式', 'error');
      return;
    }

    const uniqueSet = new Set(names.map(n => n.trim()));
    const duplicateCount = names.length - uniqueSet.size;

    const newStudents = createStudentObjects(names);
    onUpdateStudents(newStudents);
    onClearHistory();

    if (duplicateCount > 0) {
      showNotification(
        `成功從 ${sourceName} 匯入 ${newStudents.length} 位學生！偵測到有 ${duplicateCount} 筆重複姓名，已為您在下方高亮標記。`,
        'warning'
      );
    } else {
      showNotification(`成功從 ${sourceName} 匯入 ${newStudents.length} 位學生名單！`, 'success');
    }
  };

  // Handle CSV file upload
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        showNotification('讀取檔案失敗，請檢查檔案內容', 'error');
        return;
      }
      const names = parseRawStudentText(content);
      importNameList(names, file.name);
    };

    reader.onerror = () => {
      showNotification('讀取檔案時發生錯誤', 'error');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle pasted text
  const handleApplyPaste = () => {
    if (!pasteText.trim()) {
      showNotification('請先貼上學生名單文字', 'error');
      return;
    }
    const names = parseRawStudentText(pasteText);
    importNameList(names, '剪貼簿貼上文字');
    setPasteText('');
  };

  // Load a simulation preset
  const handleLoadPreset = (preset: SimulationPreset) => {
    const newStudents = createStudentObjects(preset.names);
    onUpdateStudents(newStudents);
    onClearHistory();

    const uniqueSet = new Set(preset.names.map(n => n.trim()));
    const duplicates = preset.names.length - uniqueSet.size;

    if (duplicates > 0) {
      showNotification(`已載入模擬名單「${preset.title}」（${preset.names.length}人，含 ${duplicates} 筆重複姓名以供測試）！`, 'warning');
    } else {
      showNotification(`已成功套用模擬名單「${preset.title}」（共 ${preset.names.length} 人）！`, 'success');
    }
  };

  // Add single student
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = singleName.trim();
    if (!clean) return;
    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: clean,
      originalIndex: students.length + 1,
    };
    onUpdateStudents([...students, newStudent]);
    setSingleName('');

    if (nameCounts.has(clean)) {
      showNotification(`已新增學生「${clean}」（名單內已有同名學生，已標記為重複）`, 'warning');
    } else {
      showNotification(`已新增學生「${clean}」`, 'success');
    }
  };

  // Remove single student
  const handleRemoveStudent = (id: string) => {
    const filtered = students.filter(s => s.id !== id);
    onUpdateStudents(filtered);
  };

  // Clear all students
  const handleClearAll = () => {
    if (students.length === 0) return;
    if (window.confirm('確定要清空所有學生名單嗎？')) {
      onUpdateStudents([]);
      onClearHistory();
      showNotification('名單已清空', 'success');
    }
  };

  // Export current roster to CSV
  const handleExportCsv = () => {
    if (students.length === 0) {
      showNotification('目前名單為空，無法匯出', 'error');
      return;
    }
    const header = '座號,姓名\n';
    const rows = students.map((s, idx) => `${idx + 1},${s.name}`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('學生名冊 CSV 已下載！', 'success');
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (showOnlyDuplicates) {
      const count = nameCounts.get(s.name.trim()) || 0;
      return matchesSearch && count > 1;
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner Notice */}
      {statusMessage && (
        <div
          id="status-notification-banner"
          className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : statusMessage.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Feature 1: Simulation Lists Banner (模擬名單功能) */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 p-5 sm:p-6 rounded-2xl border border-indigo-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                模擬名單（新手教師快速體驗）
                <span className="text-xs font-normal text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                  一鍵載入
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                可點擊下方預設名單快速熟悉「隨機抽籤」與「自動分組」功能，無需自行建立名冊。
              </p>
            </div>
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SIMULATION_PRESETS.map((preset) => {
            const isWithDuplicates = preset.id === 'with_duplicates';

            return (
              <button
                key={preset.id}
                id={`load-preset-${preset.id}`}
                onClick={() => handleLoadPreset(preset)}
                className={`text-left p-3.5 rounded-xl border bg-white hover:shadow-md transition-all group flex flex-col justify-between ${
                  isWithDuplicates
                    ? 'border-amber-200 hover:border-amber-400 bg-amber-50/20'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {preset.title}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isWithDuplicates
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>套用此名單</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Import Grid: CSV Upload & Paste Text */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: CSV File Upload */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-base font-bold text-slate-800">上傳 CSV / 文字檔案</h2>
              </div>
              <span className="text-xs text-slate-500">支援 .csv, .txt</span>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              支援學校常見的班級名冊 CSV 檔（包含「姓名」欄位），或每行一個姓名的文字檔。
            </p>

            <div
              id="csv-dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                點擊選擇檔案 或 拖曳 CSV 檔案至此處
              </p>
              <p className="text-xs text-slate-500 mt-1">
                自動解析欄位與 UTF-8 編碼
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>範例格式：座號,姓名 或 直接單列姓名</span>
            <button
              onClick={() => handleLoadPreset(SIMULATION_PRESETS[0])}
              id="load-sample-btn"
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              載入示範 30 人名單
            </button>
          </div>
        </div>

        {/* Method 2: Direct Textarea Paste */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  2
                </div>
                <h2 className="text-base font-bold text-slate-800">直接貼上學生名單</h2>
              </div>
              <span className="text-xs text-slate-500">分行或逗點皆可</span>
            </div>

            <p className="text-sm text-slate-600 mb-2">
              可直接從 Excel、Word、Line 或郵件中複製學生姓名貼入：
            </p>

            <textarea
              id="roster-paste-textarea"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="例：&#10;陳冠宇&#10;林志豪&#10;張雅筑&#10;李承翰&#10;王柏宇..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400 resize-none font-mono"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              id="apply-paste-btn"
              onClick={handleApplyPaste}
              disabled={!pasteText.trim()}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pasteText.trim()
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Clipboard className="w-4 h-4" />
              確認匯入貼上名單
            </button>
          </div>
        </div>
      </div>

      {/* Roster Current List & Duplicate Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">
              目前班級名單
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              共 {students.length} 位學生
            </span>
            {duplicateEntries.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                ⚠️ 含重複姓名
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {students.length > 0 && (
              <>
                <button
                  id="export-csv-btn"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  匯出名冊 CSV
                </button>
                <button
                  id="clear-roster-btn"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  清空名單
                </button>
              </>
            )}
          </div>
        </div>

        {/* Feature 2: Prominent Duplicate Warning & One-Click Deduplication Action */}
        {duplicateEntries.length > 0 && (
          <div 
            id="duplicate-warning-banner"
            className="p-4 sm:p-5 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  名單中發現重複姓名（共 {duplicateEntries.length} 個姓名重複，多出 {totalExtraDuplicates} 筆資料）
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  已在下方名單以黃色標籤標註重複項目（如：{duplicateEntries.slice(0, 3).map(d => `「${d.name}」出現 ${d.count} 次`).join('、')}{duplicateEntries.length > 3 ? ' 等' : ''}）。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                id="toggle-filter-duplicates-btn"
                onClick={() => setShowOnlyDuplicates(prev => !prev)}
                className={`text-xs px-3 py-2 rounded-xl font-semibold border transition-all ${
                  showOnlyDuplicates
                    ? 'bg-amber-200/80 border-amber-400 text-amber-950 shadow-sm'
                    : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100/50'
                }`}
              >
                <Filter className="w-3.5 h-3.5 inline mr-1" />
                {showOnlyDuplicates ? '顯示全部名單' : '只看重複姓名'}
              </button>

              <button
                id="remove-duplicates-btn"
                onClick={handleRemoveDuplicates}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all active:scale-[0.98]"
              >
                <UserCheck className="w-4 h-4" />
                <span>一鍵移除重複姓名</span>
              </button>
            </div>
          </div>
        )}

        {/* Add single student & Search filter */}
        <div className="p-4 sm:p-6 bg-slate-50/60 border-b border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
          <form onSubmit={handleAddSingle} className="md:col-span-7 flex gap-2">
            <input
              id="single-student-input"
              type="text"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              placeholder="新增單一學生姓名（例：王小明）"
              className="flex-1 px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
            />
            <button
              id="add-single-student-btn"
              type="submit"
              disabled={!singleName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              新增
            </button>
          </form>

          <div className="md:col-span-5 flex items-center gap-2">
            <input
              id="search-roster-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋名單內學生..."
              className="flex-1 px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
            />
            {showOnlyDuplicates && (
              <button
                onClick={() => setShowOnlyDuplicates(false)}
                className="px-2.5 py-2 bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl whitespace-nowrap hover:bg-amber-200"
                title="清除篩選"
              >
                重置篩選
              </button>
            )}
          </div>
        </div>

        {/* Student Chips Container with Duplicate Badging */}
        <div className="p-6 min-h-[220px]">
          {students.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">尚未匯入任何學生名單</p>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                您可以在上方的「模擬名單」選擇任一範本快速試用，或是自行上傳 CSV、貼上文字。
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handleLoadPreset(SIMULATION_PRESETS[0])}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-semibold transition-colors border border-indigo-200"
                >
                  <Sparkles className="w-4 h-4" />
                  載入標準 30 人模擬名單
                </button>
                <button
                  onClick={() => handleLoadPreset(SIMULATION_PRESETS[2])}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-sm font-semibold transition-colors border border-amber-200"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  載入含重複姓名測試名單
                </button>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              {showOnlyDuplicates 
                ? '目前沒有任何重複姓名的學生'
                : `查無符合「${searchTerm}」的學生`}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {filteredStudents.map((student, idx) => {
                const count = nameCounts.get(student.name.trim()) || 1;
                const isDuplicate = count > 1;

                return (
                  <div
                    key={student.id}
                    id={`student-chip-${student.id}`}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                      isDuplicate
                        ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300/60 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className={`text-xs font-mono flex-shrink-0 w-5 text-center ${
                        isDuplicate ? 'text-amber-700 font-bold' : 'text-slate-400'
                      }`}>
                        {student.originalIndex || idx + 1}
                      </span>
                      <span 
                        className={`text-sm font-semibold truncate ${
                          isDuplicate ? 'text-amber-950 font-bold' : 'text-slate-800'
                        }`} 
                        title={student.name}
                      >
                        {student.name}
                      </span>
                      {isDuplicate && (
                        <span 
                          className="px-1.5 py-0.2 text-[10px] font-extrabold bg-amber-200/90 text-amber-900 rounded-md flex-shrink-0"
                          title={`姓名重複出現 ${count} 次`}
                        >
                          重複
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      title="移除該學生"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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
