import React, { useState, useEffect } from 'react';
import { runAllTests, TestResult } from '../lib/selfTest';

export const SelfTestPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const execute = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllTests();
      setResults(res);
      setIsRunning(false);
    }, 50);
  };

  useEffect(() => {
    execute();
  }, []);

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  const allPassed = results.length > 0 && failedCount === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Compass Engine Self-Test</h1>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  allPassed
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                    : 'bg-rose-950/80 text-rose-400 border-rose-700'
                }`}
              >
                {allPassed ? 'ALL TESTS PASSED' : `${failedCount} FAILURES`}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Automated validation suite for Tracks A, B, C, D scoring algorithms, navigation, and security.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={execute}
              disabled={isRunning}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              {isRunning ? 'Running...' : 'Re-run Tests'}
            </button>
            <a
              href="#/"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-lg transition-colors"
            >
              Back to App
            </a>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tests</div>
            <div className="text-2xl font-bold text-white mt-1">{results.length}</div>
          </div>
          <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-4">
            <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Passed</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{passedCount}</div>
          </div>
          <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-4">
            <div className="text-xs font-medium text-rose-400 uppercase tracking-wider">Failed</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{failedCount}</div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-20">ID</th>
                  <th className="py-3 px-4 w-60">Test Name</th>
                  <th className="py-3 px-4 w-24">Status</th>
                  <th className="py-3 px-4">Expected vs Actual</th>
                  <th className="py-3 px-4 w-72">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {results.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">{test.id}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-300">{test.name}</td>
                    <td className="py-3 px-4">
                      {test.passed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-900/50 text-emerald-300 border border-emerald-700/60">
                          PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-900/50 text-rose-300 border border-rose-700/60">
                          FAIL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {test.expected && (
                        <div className="text-slate-400">
                          <span className="text-slate-500 font-semibold">Exp:</span> {test.expected}
                        </div>
                      )}
                      {test.actual && (
                        <div className="text-slate-200 mt-1">
                          <span className="text-emerald-500 font-semibold">Act:</span> {test.actual}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">{test.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
