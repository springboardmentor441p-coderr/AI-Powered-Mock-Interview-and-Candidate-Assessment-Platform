import React, { useState } from 'react';
import { Code2, Play, CheckCircle2, RefreshCw } from 'lucide-react';

export const CodeEditor = ({ initialCode, onSubmit }) => {
  const [code, setCode] = useState(
    initialCode ||
`function twoSum(nums, target) {
  // Write your O(N) optimized solution below
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`
  );

  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setOutput({
        passed: true,
        testCases: [
          { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]', actual: '[0,1]', passed: true },
          { input: 'nums = [3,2,4], target = 6', expected: '[1,2]', actual: '[1,2]', passed: true },
          { input: 'nums = [3,3], target = 6', expected: '[0,1]', actual: '[0,1]', passed: true }
        ],
        runtime: '42 ms',
        memory: '41.8 MB'
      });
    }, 600);
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
      {/* Editor Header */}
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200">Interactive Coding Sandbox (JS / Python)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="glow-cyan-btn px-3.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Run Test Cases
          </button>
        </div>
      </div>

      {/* Code Textarea */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-52 bg-slate-950 p-4 font-mono text-xs text-cyan-300 focus:outline-none resize-none leading-relaxed"
        spellCheck="false"
      />

      {/* Test Execution Output */}
      {output && (
        <div className="bg-slate-900/90 border-t border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> All Test Cases Passed
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Runtime: <strong className="text-cyan-300">{output.runtime}</strong> | Memory: <strong className="text-purple-300">{output.memory}</strong>
            </span>
          </div>

          <div className="space-y-1.5">
            {output.testCases.map((tc, idx) => (
              <div key={idx} className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300">Test {idx + 1}: {tc.input}</span>
                <span className="text-emerald-400 font-bold">Passed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
