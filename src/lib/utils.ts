// ============================================================
// ForgeAI — Utility Functions
// ============================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FileLanguage } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const icons: Record<string, string> = {
    ts: '🟦', tsx: '⚛️', js: '🟨', jsx: '⚛️',
    html: '🌐', css: '🎨', scss: '🎨', less: '🎨',
    json: '📋', md: '📝', yaml: '⚙️', yml: '⚙️',
    py: '🐍', java: '☕', cpp: '⚙️', c: '⚙️',
    sh: '💻', bash: '💻', sql: '🗄️', toml: '⚙️',
    env: '🔑', gitignore: '🔧', lock: '🔒',
    png: '🖼️', jpg: '🖼️', svg: '🖼️', gif: '🖼️',
  };
  return icons[ext] ?? '📄';
}

export function getLanguageFromFilename(filename: string): FileLanguage {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, FileLanguage> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
    html: 'html', css: 'css', scss: 'scss', less: 'less',
    json: 'json', md: 'markdown', py: 'python',
    sh: 'bash', bash: 'bash', sql: 'sql',
    yaml: 'yaml', yml: 'yaml', toml: 'toml',
  };
  return map[ext] ?? 'plaintext';
}

export function getMonacoLanguage(language: FileLanguage): string {
  const map: Record<FileLanguage, string> = {
    typescript: 'typescript', tsx: 'typescript', javascript: 'javascript', jsx: 'javascript',
    html: 'html', css: 'css', scss: 'scss', less: 'less',
    json: 'json', markdown: 'markdown', python: 'python',
    bash: 'shell', sql: 'sql', yaml: 'yaml', toml: 'toml',
    java: 'java', cpp: 'cpp', c: 'c', rust: 'rust', go: 'go',
    plaintext: 'plaintext',
  };
  return map[language] ?? 'plaintext';
}

export function buildFileTree(files: { path: string; id: string; name: string; content: string; language: any; isDirectory: boolean; createdAt: Date; updatedAt: Date }[]) {
  const tree: any[] = [];
  const map: Record<string, any> = {};

  // Sort files by path
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const parts = file.path.split('/').filter(Boolean);
    let current = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const existing = current.find((n: any) => n.name === part && n.isDirectory);
      if (existing) {
        current = existing.children;
      } else {
        const dir = { id: `dir-${parts.slice(0, i + 1).join('/')}`, name: part, path: parts.slice(0, i + 1).join('/'), isDirectory: true, children: [] };
        current.push(dir);
        current = dir.children;
      }
    }
    current.push(file);
  }

  return tree;
}

export function getDiffLines(oldContent: string, newContent: string) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const diff: { type: 'unchanged' | 'added' | 'removed'; content: string }[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length) {
      diff.push({ type: 'added', content: newLines[i] });
    } else if (i >= newLines.length) {
      diff.push({ type: 'removed', content: oldLines[i] });
    } else if (oldLines[i] !== newLines[i]) {
      diff.push({ type: 'removed', content: oldLines[i] });
      diff.push({ type: 'added', content: newLines[i] });
    } else {
      diff.push({ type: 'unchanged', content: oldLines[i] });
    }
  }
  return diff;
}

export function classifyCommand(command: string): 'SAFE' | 'CAUTION' | 'BLOCKED' {
  const normalized = command.trim().toLowerCase();

  const blocked = [
    /^(rm|del|rmdir|rd)\s+(-rf|-r|-f|\/s|\/q|\/f)?\s*\//, // rm -rf /
    /^format\s/, /^shutdown/, /^reboot/, /^mkfs/,
    /^dd\s/, /^:(){ :|: & };:/, // fork bomb
    /^curl.*\|\s*(bash|sh)/, /^wget.*\|\s*(bash|sh)/,
  ];

  const caution = [
    /^rm\s/, /^del\s/, /^rmdir\s/, /^rd\s/,
    /^git\s+push/, /^git\s+reset.*--hard/,
    /^npm\s+publish/, /^npm\s+unpublish/,
    /^sudo\s/, /^chmod\s/, /^chown\s/,
    /^mv\s/, /^cp\s/,
    /^kill\s/, /^pkill\s/,
  ];

  const safe = [
    /^npm\s+(install|run|test|start|build|ci)/,
    /^npx\s/,
    /^node\s/,
    /^python\s/, /^pip\s+install/,
    /^git\s+(status|diff|log|add|commit|branch|checkout|clone|pull|fetch|init)/,
    /^ls\s*/, /^dir\s*/, /^pwd/, /^echo\s/,
    /^cat\s/, /^head\s/, /^tail\s/,
    /^mkdir\s/, /^touch\s/,
    /^yarn\s/, /^pnpm\s/,
    /^tsc\s/, /^eslint\s/, /^prettier\s/,
  ];

  for (const pattern of blocked) {
    if (pattern.test(normalized)) return 'BLOCKED';
  }
  for (const pattern of caution) {
    if (pattern.test(normalized)) return 'CAUTION';
  }
  for (const pattern of safe) {
    if (pattern.test(normalized)) return 'SAFE';
  }

  return 'CAUTION';
}

export function parseCodeBlocks(text: string): { language: string; code: string }[] {
  const blocks: { language: string; code: string }[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ language: match[1] ?? 'plaintext', code: match[2] });
  }
  return blocks;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PROJECT_TEMPLATES = {
  'react-app': {
    name: 'React App',
    description: 'Modern React application with TypeScript and Vite',
    icon: '⚛️',
    stack: 'React + TypeScript + Vite',
    color: '#61DAFB',
  },
  'nextjs-app': {
    name: 'Next.js App',
    description: 'Full-stack Next.js application with App Router',
    icon: '▲',
    stack: 'Next.js + TypeScript',
    color: '#000000',
  },
  'python-app': {
    name: 'Python App',
    description: 'Python application or script',
    icon: '🐍',
    stack: 'Python',
    color: '#3776AB',
  },
  'nodejs-api': {
    name: 'Node.js API',
    description: 'RESTful API with Express.js',
    icon: '🟩',
    stack: 'Node.js + Express',
    color: '#339933',
  },
  'html-css-js': {
    name: 'HTML/CSS/JS',
    description: 'Simple static website',
    icon: '🌐',
    stack: 'HTML + CSS + JavaScript',
    color: '#E34F26',
  },
  'portfolio': {
    name: 'Portfolio',
    description: 'Personal portfolio website',
    icon: '💼',
    stack: 'React + TypeScript',
    color: '#7C3AED',
  },
  'dashboard': {
    name: 'Dashboard',
    description: 'Data dashboard with charts',
    icon: '📊',
    stack: 'React + Recharts',
    color: '#06B6D4',
  },
  'chrome-extension': {
    name: 'Chrome Extension',
    description: 'Browser extension for Chrome',
    icon: '🔌',
    stack: 'HTML + JS + Manifest V3',
    color: '#4285F4',
  },
  'cli-tool': {
    name: 'CLI Tool',
    description: 'Command-line interface tool',
    icon: '💻',
    stack: 'Node.js + Commander',
    color: '#F59E0B',
  },
  'rest-api': {
    name: 'REST API',
    description: 'RESTful API service',
    icon: '🔌',
    stack: 'Node.js + Express + TypeScript',
    color: '#10B981',
  },
};
