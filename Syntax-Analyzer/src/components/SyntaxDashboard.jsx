import React, { useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { PlayCircle, Trash2, Sun, Moon, Upload } from 'lucide-react';
import TextArea from './TextArea';
import ErrorConsole from './ErrorConsole';
import { useTheme } from '../hooks/useTheme';
import { useDashboard } from '../hooks/useDashboard';
import { getAllSamples } from '../data/codeSamples';

/**
 * =========================================
 * Syntax Dashboard – Main Application View
 * =========================================
 */

const SyntaxDashboard = () => {
  const { isDarkMode, handleThemeToggle } = useTheme();
  const {
    sourceCode,
    errors,
    analyzing,
    history,
    historyIndex,
    textareaRef,
    fileInputRef,
    selectedErrorLine,
    analysisMetrics,
    showCopiedTooltip,
    handleSourceCodeChange,
    handleAnalyze,
    handleClear,
    handleFileUpload,
    handleKeyDown,
    handleUndo,
    handleRedo,
    handleErrorClick,
    handleCopyToClipboard,
    handleFormatCode,
    handleExportFile,
    loadSample
  } = useDashboard();

  const codeSamples = getAllSamples();

  // Inject custom scrollbar styles for consistent appearance across browsers.
  useEffect(() => {
    const styleId = 'custom-vertical-scrollbar-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .custom-vertical-scrollbar,
      .custom-vertical-scrollbar textarea {
        overflow-y: auto !important;
      }
      .custom-vertical-scrollbar::-webkit-scrollbar,
      textarea.custom-vertical-scrollbar::-webkit-scrollbar {
        width: 12px;
        -webkit-appearance: none;
      }
      .custom-vertical-scrollbar::-webkit-scrollbar-track,
      textarea.custom-vertical-scrollbar::-webkit-scrollbar-track {
        background: rgba(148, 163, 184, 0.2);
        border-radius: 6px;
        margin: 4px;
      }
      .custom-vertical-scrollbar::-webkit-scrollbar-thumb,
      textarea.custom-vertical-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.5);
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .custom-vertical-scrollbar::-webkit-scrollbar-thumb:hover,
      textarea.custom-vertical-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(148, 163, 184, 0.7);
        background-clip: padding-box;
      }
      .dark .custom-vertical-scrollbar::-webkit-scrollbar-track,
      .dark textarea.custom-vertical-scrollbar::-webkit-scrollbar-track {
        background: rgba(71, 85, 105, 0.5);
        margin: 4px;
      }
      .dark .custom-vertical-scrollbar::-webkit-scrollbar-thumb,
      .dark textarea.custom-vertical-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.6);
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .dark .custom-vertical-scrollbar::-webkit-scrollbar-thumb:hover,
      .dark textarea.custom-vertical-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 116, 139, 0.8);
        background-clip: padding-box;
      }
      .custom-vertical-scrollbar,
      textarea.custom-vertical-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(148, 163, 184, 0.5) rgba(148, 163, 184, 0.2);
      }
      .dark .custom-vertical-scrollbar,
      .dark textarea.custom-vertical-scrollbar {
        scrollbar-color: rgba(100, 116, 139, 0.6) rgba(71, 85, 105, 0.5);
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-slate-900 dark:to-slate-950 p-6">
      <div className="w-full max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src="/LOGO.svg"
            alt="E.C.H.O logo"
            role="img"
            className="w-20 h-20 object-contain"
          />
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-emerald-600 dark:text-violet-400 leading-tight"
          >
            E.C.H.O Syntax Analyzer
          </motion.h1>
        </div>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-10 text-lg">
          Executable Code, Human Output
        </p>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Source Code Editor Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/30 dark:border-slate-700 flex flex-col h-[850px]"
          >
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                Source Code Editor
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleThemeToggle}
                  aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-700" />
                  )}
                </button>
                <select
                  onChange={(e) => e.target.value && loadSample(e.target.value)}
                  defaultValue=""
                  className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-violet-600 dark:to-purple-600 dark:hover:from-violet-700 dark:hover:to-purple-700 text-white rounded-md transition-colors text-xs sm:text-sm font-medium cursor-pointer border-none outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-violet-500"
                  title="Load a test case"
                >
                  <option value="" disabled className="bg-slate-800 text-slate-300">
                    Select a test case...
                  </option>
                  {codeSamples.map((sample) => (
                    <option 
                      key={sample.id} 
                      value={sample.id}
                      className="bg-slate-800 text-white hover:bg-slate-700"
                    >
                      {sample.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-violet-900/40 dark:hover:bg-violet-800/50 text-emerald-800 dark:text-violet-200 rounded-md transition-colors text-xs sm:text-sm font-medium flex items-center gap-1"
                >
                  <Upload size={14} />
                  Upload
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col min-w-0">
              <TextArea
                value={sourceCode}
                onChange={handleSourceCodeChange}
                textareaRef={textareaRef}
                onKeyDown={handleKeyDown}
                errors={errors}
                highlightedLine={selectedErrorLine}
                onCopy={handleCopyToClipboard}
                onFormat={handleFormatCode}
                onExport={handleExportFile}
                showCopiedTooltip={showCopiedTooltip}
                className="w-full h-full bg-transparent text-slate-900 dark:text-white font-mono text-sm leading-6 py-3 px-3 box-border rounded-md border border-emerald-300 dark:border-violet-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-violet-500 focus:border-emerald-500 dark:focus:border-violet-500 resize-none custom-vertical-scrollbar"
              />
            </div>

            <div className="flex justify-between items-center mt-4 flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 text-xs font-medium rounded transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 text-xs font-medium rounded transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  Redo
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={!sourceCode || analyzing}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-violet-600 dark:hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors text-sm"
                >
                  <PlayCircle size={18} />
                  <span>{analyzing ? "Analyzing..." : "Analyze Code"}</span>
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors text-sm"
                >
                  <Trash2 size={18} />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Error Console Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/30 dark:border-slate-700 flex flex-col h-[850px]"
          >
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex-shrink-0">
              Error Console
            </h2>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-vertical-scrollbar">
                <ErrorConsole 
                  errors={errors} 
                  onErrorClick={handleErrorClick}
                  metrics={analysisMetrics}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SyntaxDashboard;
