import React, { memo } from 'react';
import { FileText, CheckCircle2, Zap, FileCode, Clock } from 'lucide-react';

/**
 * =========================================
 * Error Console – Syntax Error Display
 * =========================================
 */

const ErrorConsole = memo(function ErrorConsole({ errors, onErrorClick, metrics }) {
  const hasMetrics = metrics && (metrics.totalTokens > 0 || metrics.linesOfCode > 0);
  
  return (
    <div className="w-full p-4 flex justify-center items-start">
      {errors.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
          {/* Success Badge */}
          {hasMetrics && (
            <div className="mb-6 px-6 py-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-xl flex items-center gap-3 shadow-lg">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-green-700 dark:text-green-300">
                  Syntax Validated
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  Your code is error-free!
                </span>
              </div>
            </div>
          )}
          
          {/* Stats Bar for Success */}
          {hasMetrics && (
            <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center gap-6 text-sm font-mono">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-emerald-600 dark:text-violet-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Tokens:</strong> {metrics.totalTokens}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-purple-500 dark:text-purple-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Lines:</strong> {metrics.linesOfCode}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-500 dark:text-yellow-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Speed:</strong> {metrics.performanceTime}ms
                </span>
              </div>
            </div>
          )}
          
          {/* Empty state when no analysis yet */}
          {!hasMetrics && (
            <div className="text-center px-4">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-base text-gray-500 dark:text-gray-400 mb-2 font-semibold">
                No analysis performed yet
              </p>
              <p className="text-sm text-gray-400">Click "Analyze Code" to begin</p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full border border-red-300 dark:border-red-700 rounded-lg bg-white/50 dark:bg-slate-900/50 shadow-sm overflow-hidden">
          <div className="bg-red-100 dark:bg-red-900/40 px-4 py-3 border-b-2 border-red-300 dark:border-red-700">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-200">
              Syntax Errors ({errors.length})
            </h3>
          </div>
          
          {/* Stats Bar for Errors */}
          {hasMetrics && (
            <div className="px-4 py-2.5 bg-red-50/50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 flex items-center justify-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <FileCode size={14} className="text-emerald-600 dark:text-violet-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Tokens:</strong> {metrics.totalTokens}
                </span>
              </div>
              <div className="h-3 w-px bg-red-300 dark:bg-red-700" />
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="text-purple-500 dark:text-purple-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Lines:</strong> {metrics.linesOfCode}
                </span>
              </div>
              <div className="h-3 w-px bg-red-300 dark:bg-red-700" />
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-orange-500 dark:text-orange-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Speed:</strong> {metrics.performanceTime}ms
                </span>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto custom-vertical-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-red-50/80 dark:bg-red-900/30 sticky top-0 z-10 backdrop-blur border-b-2 border-red-300 dark:border-red-700">
                <tr>
                  <th className="px-4 py-4 font-semibold text-red-900 dark:text-red-200 text-center border-r border-red-200 dark:border-red-700 whitespace-nowrap w-20">
                    Line
                  </th>
                  <th className="px-4 py-4 font-semibold text-red-900 dark:text-red-200 text-center border-r border-red-200 dark:border-red-700 whitespace-nowrap w-24">
                    Column
                  </th>
                  <th className="px-6 py-4 font-semibold text-red-900 dark:text-red-200 text-left min-w-[200px]">
                    Error Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {errors.map((error) => (
                  <tr
                    key={error.id}
                    onClick={() => onErrorClick && onErrorClick(error.line, error.column)}
                    className="border-b border-red-200 dark:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                    title="Click to navigate to this error in the editor"
                  >
                    <td className="px-4 py-3 text-center text-red-900 dark:text-red-200 font-bold border-r border-red-200 dark:border-red-800 whitespace-nowrap">
                      {error.line}
                    </td>
                    <td className="px-4 py-3 text-center text-red-900 dark:text-red-200 font-bold border-r border-red-200 dark:border-red-800 whitespace-nowrap">
                      {error.column}
                    </td>
                    <td className="px-6 py-3 text-left font-mono text-sm text-slate-900 dark:text-gray-200 break-words">
                      {error.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

export default ErrorConsole;
