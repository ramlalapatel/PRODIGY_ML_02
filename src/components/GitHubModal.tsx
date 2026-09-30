import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Globe, GitBranch, Sparkles } from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveUrl: string;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose, liveUrl }) => {
  const [username, setUsername] = useState<string>('patelramlala414');
  const [repoName, setRepoName] = useState<string>('customer-segmentation-kmeans');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const badgeMarkdown = `[![Live Demo](https://img.shields.io/badge/Live%20Demo-Interactive%20Studio-6366f1?style=for-the-badge&logo=google-cloud&logoColor=white)](${liveUrl})`;

  const gitCommands = `git init
git add .
git commit -m "feat: customer segmentation ml studio with live demo link"
git branch -M main
git remote add origin https://github.com/${username || '<USERNAME>'}/${repoName || '<REPO-NAME>'}.git
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">GitHub par Live Link Show Karne ka Guide</h3>
              <p className="text-xs text-slate-400">
                Aapki project ka live link aur GitHub repository setup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto font-sans text-xs">
          {/* Section 1: The Live App URL */}
          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aapka Permanent Live Web App URL</span>
              </span>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <span>Open App</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={liveUrl}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-xs text-emerald-400 select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(liveUrl, 'url')}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'url' ? 'Copied URL!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Step-by-Step GitHub Setup */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              📌 GitHub par Link Kaha aur Kaise Show Karein:
            </h4>

            {/* Method A: In GitHub "About" Website Section */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-mono text-indigo-400">
                  1
                </span>
                <span>GitHub Repository ke &quot;About&quot; box me Link dalein (Sabse Best Tarika):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-2 leading-relaxed">
                <li>Apne GitHub repo page par jayein (<code className="text-slate-300">github.com/{username}/{repoName}</code>).</li>
                <li>Right side me <strong className="text-slate-200">&quot;About&quot;</strong> ke bagal me <strong>⚙️ (Settings gear icon)</strong> par click karein.</li>
                <li><strong className="text-slate-200">Website</strong> field me ye link paste karein aur <strong className="text-slate-200">&quot;Save changes&quot;</strong> dabayein.</li>
              </ol>
            </div>

            {/* Method B: In README.md with Badges */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-mono text-indigo-400">
                    2
                  </span>
                  <span>README.md me Clickable Live Demo Badge:</span>
                </div>
                <button
                  onClick={() => copyToClipboard(badgeMarkdown, 'badge')}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {copiedKey === 'badge' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'badge' ? 'Copied Badge!' : 'Copy Badge Code'}</span>
                </button>
              </div>

              <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-indigo-300 overflow-x-auto">
                {badgeMarkdown}
              </pre>
            </div>
          </div>

          {/* Section 3: Push to GitHub Commands Generator */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <span>Terminal Git Commands (Apna Repo Name customize karein):</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">GitHub Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. patelramlala414"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Repository Name:</label>
                <input
                  type="text"
                  value={repoName}
                  onChange={e => setRepoName(e.target.value)}
                  placeholder="customer-segmentation-kmeans"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="relative">
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {gitCommands}
              </pre>
              <button
                onClick={() => copyToClipboard(gitCommands, 'git')}
                className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-md text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                {copiedKey === 'git' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'git' ? 'Copied Commands!' : 'Copy Commands'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Direct Link: ais-pre-m6ged3numqdvjurljbj4m7-5834640671.asia-southeast1.run.app
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
