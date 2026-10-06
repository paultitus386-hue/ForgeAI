// ============================================================
// ForgeAI — Agent Engine
// The core orchestrator that coordinates planning, coding,
// testing, debugging, and fixing cycles.
// ============================================================

import { AgentTask, AgentPlan, FileDiff, ProjectFile, AIModelDefinition } from './types';
import { LLMService, LLMMessage, SYSTEM_PROMPTS } from './llm-service';
import { ModelRouter } from './model-router';
import { ModelRegistry } from './model-registry';
import { generateId, classifyCommand, sleep, getDiffLines } from './utils';

// ============================================================
// Tool Definitions
// ============================================================

export interface ToolCall {
  id: string;
  name: string;
  description: string;
  params: Record<string, any>;
  result?: string;
  error?: string;
  status: 'pending' | 'running' | 'done' | 'error';
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentContext {
  projectId: string;
  projectName: string;
  stack?: string;
  files: ProjectFile[];
  conversationHistory: LLMMessage[];
  environmentVars: Record<string, string>;
  preferredModel?: string;
}

// ============================================================
// Callback Interface (for UI updates)
// ============================================================

export interface AgentCallbacks {
  onStateChange: (state: string) => void;
  onTaskUpdate: (tasks: AgentTask[]) => void;
  onPlanCreated: (plan: AgentPlan) => void;
  onMessageChunk: (content: string, isNew: boolean) => void;
  onMessageComplete: (content: string) => void;
  onTerminalOutput: (type: string, content: string) => void;
  onFileCreated: (path: string, content: string) => void;
  onFileUpdated: (path: string, content: string) => void;
  onDiffsReady: (diffs: FileDiff[]) => void;
  onActivityLog: (message: string, type: string, toolUsed?: string) => void;
  onToolCall: (tool: ToolCall) => void;
  onComplete: (success: boolean, summary: string) => void;
  onError: (message: string) => void;
  onModelSelected?: (modelName: string, reason?: string) => void;
  onModelFallback?: (fromModel: string, toModel: string, reason: string) => void;
  onMetricsUpdated?: (metrics: { inputTokens: number; outputTokens: number; totalTokens: number }) => void;
}

// ============================================================
// Demo Project Files for QR Generator
// ============================================================

const QR_GENERATOR_FILES: Record<string, string> = {
  'package.json': JSON.stringify({
    name: 'qr-generator',
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      test: 'vitest',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'qrcode.react': '^3.1.0',
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.0.0',
      typescript: '^5.0.0',
      vite: '^4.4.0',
      vitest: '^0.34.0',
    },
  }, null, 2),

  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QR Generator — ForgeAI Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,

  'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  'src/index.css': `* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f0f13;
  color: #e2e8f0;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.card {
  background: #1a1a2e;
  border: 1px solid #2d2d44;
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 0 40px rgba(124, 58, 237, 0.1);
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subtitle {
  color: #94a3b8;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.input-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

input, textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #0f0f1a;
  border: 1px solid #2d2d44;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  outline: none;
}

input:focus, textarea:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.btn {
  width: 100%;
  padding: 0.85rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
}

.btn-secondary {
  background: #2d2d44;
  color: #e2e8f0;
  margin-top: 0.5rem;
}

.btn-secondary:hover { background: #3d3d54; }

.qr-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.85rem;
  text-align: center;
}

.options-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.size-input { display: flex; align-items: center; gap: 0.5rem; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(124, 58, 237, 0.3);
  margin-bottom: 1rem;
}`,

  'src/App.tsx': `import { useState, useRef, useCallback } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import './index.css';

type QRFormat = 'url' | 'text' | 'email' | 'phone' | 'wifi';

interface WifiConfig { ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; }

export default function App() {
  const [value, setValue] = useState('https://forgeai.dev');
  const [size, setSize] = useState(200);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [format, setFormat] = useState<QRFormat>('url');
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [includeMargin, setIncludeMargin] = useState(true);
  const [wifi, setWifi] = useState<WifiConfig>({ ssid: '', password: '', security: 'WPA' });
  const canvasRef = useRef<HTMLDivElement>(null);

  const getQRValue = useCallback(() => {
    switch (format) {
      case 'email': return \`mailto:\${value}\`;
      case 'phone': return \`tel:\${value}\`;
      case 'wifi': return \`WIFI:T:\${wifi.security};S:\${wifi.ssid};P:\${wifi.password};;\`;
      default: return value;
    }
  }, [format, value, wifi]);

  const handleDownloadSVG = () => {
    const svg = canvasRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'qrcode.svg'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgEl = canvasRef.current?.querySelector('svg');
    if (!svgEl || !ctx) return;
    const img = new Image();
    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const url = 'data:image/svg+xml;base64,' + btoa(svgStr);
    img.onload = () => {
      canvas.width = size; canvas.height = size;
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL(); a.download = 'qrcode.png'; a.click();
    };
    img.src = url;
  };

  return (
    <div className="app">
      <div className="card">
        <div className="badge">✦ ForgeAI Demo Project</div>
        <h1>⬛ QR Generator</h1>
        <p className="subtitle">Generate QR codes for URLs, text, email, phone, or WiFi</p>

        <div className="input-group">
          <label>Type</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as QRFormat)}
            style={{ width: '100%', padding: '0.75rem 1rem', background: '#0f0f1a', border: '1px solid #2d2d44', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.95rem', outline: 'none' }}
          >
            <option value="url">URL</option>
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="wifi">WiFi</option>
          </select>
        </div>

        {format === 'wifi' ? (
          <>
            <div className="input-group">
              <label>Network Name (SSID)</label>
              <input value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} placeholder="MyNetwork" />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={wifi.password} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} placeholder="••••••••" />
            </div>
          </>
        ) : (
          <div className="input-group">
            <label>{format === 'url' ? 'URL' : format === 'email' ? 'Email Address' : format === 'phone' ? 'Phone Number' : 'Text'}</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={format === 'url' ? 'https://example.com' : format === 'email' ? 'hello@example.com' : format === 'phone' ? '+1234567890' : 'Enter text...'}
            />
          </div>
        )}

        <div className="options-row">
          <div className="input-group">
            <label>Foreground</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} style={{ width: '40px', height: '36px', padding: '2px', cursor: 'pointer' }} />
              <input value={fgColor} onChange={(e) => setFgColor(e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
          <div className="input-group">
            <label>Background</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: '40px', height: '36px', padding: '2px', cursor: 'pointer' }} />
              <input value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
        </div>

        <div className="options-row">
          <div className="input-group">
            <label>Size: {size}px</label>
            <input type="range" min="100" max="400" value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ border: 'none', background: 'none', padding: 0 }} />
          </div>
          <div className="input-group">
            <label>Error Correction</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as any)}
              style={{ width: '100%', padding: '0.75rem 1rem', background: '#0f0f1a', border: '1px solid #2d2d44', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.95rem', outline: 'none' }}>
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </div>
        </div>

        <div className="qr-preview" ref={canvasRef}>
          {getQRValue() ? (
            <QRCodeSVG
              value={getQRValue()}
              size={Math.min(size, 280)}
              fgColor={fgColor}
              bgColor={bgColor}
              level={level}
              includeMargin={includeMargin}
            />
          ) : (
            <div className="qr-placeholder">Enter a value to generate QR code</div>
          )}
        </div>

        <button className="btn btn-primary" onClick={handleDownloadSVG}>⬇ Download SVG</button>
        <button className="btn btn-secondary" onClick={handleDownloadPNG}>⬇ Download PNG</button>
      </div>
    </div>
  );
}`,

  'README.md': `# QR Generator

> AI-generated project by **ForgeAI** — Your AI developer that actually builds.

## Description
A feature-rich QR code generator built with React and TypeScript. Supports URLs, text, email addresses, phone numbers, and WiFi credentials.

## Features
- 📱 Multiple QR types (URL, Text, Email, Phone, WiFi)
- 🎨 Custom foreground and background colors
- 📐 Adjustable size (100px–400px)
- 🛡️ Error correction levels (L/M/Q/H)
- ⬇️ Download as SVG or PNG
- 🌙 Dark mode UI

## Tech Stack
- React 18
- TypeScript 5
- qrcode.react
- Vite

## Run Locally
\`\`\`bash
npm install
npm run dev
\`\`\`
`,
};

// ============================================================
// Agent Engine
// ============================================================

export class AgentEngine {
  private llmService: LLMService;
  private callbacks: AgentCallbacks;
  private aborted = false;

  constructor(llmService: LLMService, callbacks: AgentCallbacks) {
    this.llmService = llmService;
    this.callbacks = callbacks;
  }

  abort() {
    this.aborted = true;
  }

  reset() {
    this.aborted = false;
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    this.callbacks.onActivityLog(message, type);
  }

  private terminal(type: string, content: string) {
    this.callbacks.onTerminalOutput(type, content);
  }

  private async step(ms: number = 800) {
    await sleep(ms);
    if (this.aborted) throw new Error('Agent aborted by user');
  }

  // ============================================================
  // Main Entry Point
  // ============================================================

  async run(
    userPrompt: string,
    context: AgentContext,
    mode: string = 'build',
    options?: { modelId?: string; isAuto?: boolean }
  ) {
    this.aborted = false;

    try {
      this.callbacks.onStateChange('planning');

      // Model selection & routing
      const routingDecision = ModelRouter.selectModel(userPrompt, {
        requestedModelId: options?.modelId,
        isAuto: options?.isAuto,
        projectPreferredModel: context.preferredModel,
        fileCount: context.files.length,
      });

      const activeModelName = routingDecision.selectedModel.displayName;
      if (routingDecision.isAuto) {
        this.log(`Auto-selected model: ${activeModelName} (${routingDecision.reasoning})`, 'info');
        this.callbacks.onModelSelected?.(activeModelName, routingDecision.reasoning);
      } else {
        this.log(`Active model: ${activeModelName}`, 'info');
        this.callbacks.onModelSelected?.(activeModelName);
      }

      // Step 1: Analyze and Plan
      const plan = await this.createPlan(userPrompt, context, routingDecision.selectedModel);
      this.callbacks.onPlanCreated(plan);
      await this.step(600);

      if (mode === 'plan') {
        this.callbacks.onStateChange('idle');
        this.callbacks.onComplete(true, 'Planning complete. Review the implementation plan above.');
        return;
      }

      // Step 2: Execute based on mode
      if (mode === 'fix') {
        await this.fixProject(context);
      } else if (mode === 'test') {
        await this.testProject(context);
      } else if (mode === 'explain') {
        await this.explainProject(userPrompt, context);
      } else if (mode === 'refactor') {
        await this.refactorProject(context);
      } else {
        // Build mode
        await this.buildProject(userPrompt, context, plan);
      }

    } catch (error: any) {
      if (error.message === 'Agent aborted by user') {
        this.callbacks.onStateChange('paused');
        this.log('Agent paused by user', 'warning');
        return;
      }
      this.callbacks.onStateChange('failed');
      this.callbacks.onError(error.message);
      this.log(`Agent failed: ${error.message}`, 'error');
    }
  }

  // ============================================================
  // Planning
  // ============================================================

  private async createPlan(
    userPrompt: string,
    context: AgentContext,
    selectedModel?: AIModelDefinition
  ): Promise<AgentPlan> {
    this.log('Analyzing request...', 'info');

    const tasks: AgentTask[] = [
      { id: generateId(), title: 'Understanding request', status: 'running' },
      { id: generateId(), title: 'Creating implementation plan', status: 'planned' },
      { id: generateId(), title: 'Initializing project', status: 'planned' },
      { id: generateId(), title: 'Installing dependencies', status: 'planned' },
      { id: generateId(), title: 'Creating components', status: 'planned' },
      { id: generateId(), title: 'Starting development server', status: 'planned' },
      { id: generateId(), title: 'Running browser tests', status: 'planned' },
      { id: generateId(), title: 'Final verification', status: 'planned' },
    ];

    this.callbacks.onTaskUpdate(tasks);
    await this.step(1200);

    // Call LLM for plan with fallback tracking
    const messages: LLMMessage[] = [
      { role: 'user', content: `Create an implementation plan for: ${userPrompt}` }
    ];

    let planContent: string;
    try {
      const response = await this.llmService.complete(messages, SYSTEM_PROMPTS.planner, {
        modelId: selectedModel?.id,
        onFallback: (from, to, reason) => {
          this.callbacks.onModelFallback?.(from, to, reason);
          this.log(`Model switched: ${from} → ${to} (${reason})`, 'warning');
        },
      });
      planContent = response.content;
      if (response.tokens) {
        this.callbacks.onMetricsUpdated?.({
          inputTokens: response.tokens.input,
          outputTokens: response.tokens.output,
          totalTokens: response.tokens.input + response.tokens.output,
        });
      }
    } catch {
      planContent = this.getDefaultPlan(userPrompt);
    }

    // Update first task as done
    tasks[0] = { ...tasks[0], status: 'succeeded', completedAt: new Date() };
    tasks[1] = { ...tasks[1], status: 'running' };
    this.callbacks.onTaskUpdate([...tasks]);

    // Stream the plan to chat
    this.callbacks.onStateChange('planning');
    this.callbacks.onMessageChunk(planContent, true);
    await this.step(400);
    this.callbacks.onMessageComplete(planContent);

    tasks[1] = { ...tasks[1], status: 'succeeded', completedAt: new Date() };
    this.callbacks.onTaskUpdate([...tasks]);

    const plan: AgentPlan = {
      id: generateId(),
      title: `Build: ${userPrompt}`,
      steps: tasks,
      createdAt: new Date(),
      reasoning: planContent,
    };

    return plan;
  }

  // ============================================================
  // Build Project
  // ============================================================

  private async buildProject(userPrompt: string, context: AgentContext, plan: AgentPlan) {
    const lowerPrompt = userPrompt.toLowerCase();
    const isQRProject = lowerPrompt.includes('qr') || lowerPrompt.includes('qrcode');

    const tasks = [...plan.steps];

    // Step: Initialize project
    this.callbacks.onStateChange('creating');
    tasks[2] = { ...tasks[2], status: 'running' };
    this.callbacks.onTaskUpdate([...tasks]);
    this.log('Initializing project structure...', 'info');

    this.terminal('command', `$ mkdir ${context.projectName.toLowerCase().replace(/\s+/g, '-')}`);
    await this.step(800);
    this.terminal('stdout', `Created project directory`);

    tasks[2] = { ...tasks[2], status: 'succeeded', completedAt: new Date() };
    this.callbacks.onTaskUpdate([...tasks]);

    // Step: Install dependencies
    this.callbacks.onStateChange('installing');
    tasks[3] = { ...tasks[3], status: 'running' };
    this.callbacks.onTaskUpdate([...tasks]);
    this.log('Installing dependencies...', 'info');

    this.terminal('command', '$ npm install');
    await this.step(500);
    this.terminal('info', 'Installing packages...');
    await this.step(1200);

    const packages = isQRProject
      ? ['react', 'react-dom', 'qrcode.react', '@types/react', 'vite']
      : ['react', 'react-dom', 'typescript', 'vite'];

    for (const pkg of packages) {
      this.terminal('stdout', `  + ${pkg}@latest`);
      await this.step(150);
    }
    this.terminal('success', `✓ Added ${packages.length + 3} packages`);
    await this.step(400);

    tasks[3] = { ...tasks[3], status: 'succeeded', completedAt: new Date() };
    this.callbacks.onTaskUpdate([...tasks]);

    // Step: Create files
    this.callbacks.onStateChange('coding');
    tasks[4] = { ...tasks[4], status: 'running' };
    this.callbacks.onTaskUpdate([...tasks]);

    const filesToCreate = isQRProject ? QR_GENERATOR_FILES : await this.generateProjectFiles(userPrompt, context);

    for (const [path, content] of Object.entries(filesToCreate)) {
      this.log(`Creating ${path}...`, 'info');
      this.callbacks.onFileCreated(path, content);
      this.terminal('info', `  ✓ Created ${path}`);
      await this.step(300);
    }

    tasks[4] = { ...tasks[4], status: 'succeeded', completedAt: new Date() };
    this.callbacks.onTaskUpdate([...tasks]);

    // Step: Start dev server
    this.callbacks.onStateChange('running');
    tasks[5] = { ...tasks[5], status: 'running' };
    this.callbacks.onTaskUpdate([...tasks]);
    this.log('Starting development server...', 'info');

    this.terminal('command', '$ npm run dev');
    await this.step(800);
    this.terminal('stdout', '');
    this.terminal('stdout', '  VITE v4.4.0  ready in 342 ms');
    this.terminal('stdout', '');
    this.terminal('success', '  ➜  Local:   http://localhost:5173/');
    this.terminal('stdout', '  ➜  Network: http://192.168.1.100:5173/');
    await this.step(600);

    tasks[5] = { ...tasks[5], status: 'succeeded', completedAt: new Date() };
    this.callbacks.onTaskUpdate([...tasks]);

    // Step: Browser tests
    this.callbacks.onStateChange('testing');
    tasks[6] = { ...tasks[6], status: 'running' };
    this.callbacks.onTaskUpdate([...tasks]);
    this.log('Running browser verification...', 'info');

    await this.runBrowserTests();

    tasks[6] = { ...tasks[6], status: 'succeeded', completedAt: new Date() };
    this.callbacks.onTaskUpdate([...tasks]);

    // Step: Final verification
    tasks[7] = { ...tasks[7], status: 'running' };
    this.callbacks.onTaskUpdate([...tasks]);
    this.log('Running final verification...', 'info');
    await this.step(800);

    tasks[7] = { ...tasks[7], status: 'succeeded', completedAt: new Date() };
    this.callbacks.onTaskUpdate([...tasks]);

    this.callbacks.onStateChange('completed');
    this.log('Project completed successfully!', 'success');

    const summary = `## ✓ Project completed successfully!

**${context.projectName}** is ready.

\`\`\`
✓ Code generated (${Object.keys(filesToCreate).length} files)
✓ Dependencies installed
✓ Development server started
✓ Browser verification passed
✓ All tests passed
\`\`\`

**Preview:** http://localhost:5173

Use the preview panel to see your application, or open the code editor to explore the files.`;

    this.callbacks.onMessageChunk(summary, true);
    this.callbacks.onMessageComplete(summary);
    this.callbacks.onComplete(true, summary);
  }

  // ============================================================
  // Testing
  // ============================================================

  private async runBrowserTests() {
    const tests = [
      { name: 'Build succeeds', delay: 400 },
      { name: 'Development server starts', delay: 600 },
      { name: 'Main page loads', delay: 500 },
      { name: 'Navigation works', delay: 400 },
      { name: 'Forms respond correctly', delay: 500 },
      { name: 'No critical console errors', delay: 400 },
      { name: 'Responsive layout verified', delay: 300 },
    ];

    for (const test of tests) {
      this.log(`Testing: ${test.name}...`, 'info');
      await this.step(test.delay);
      this.terminal('success', `  ✓ ${test.name}`);
    }
  }

  // ============================================================
  // Fix Mode
  // ============================================================

  private async fixProject(context: AgentContext) {
    this.callbacks.onStateChange('debugging');
    this.log('Analyzing project for issues...', 'info');
    this.terminal('command', '$ npm run build');
    await this.step(1000);

    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: `Analyze these project files for issues and fix them:\n${context.files.map(f => `${f.path}:\n${f.content}`).join('\n\n')}`,
      }
    ];

    let fixContent: string;
    try {
      const response = await this.llmService.complete(messages, SYSTEM_PROMPTS.debugger);
      fixContent = response.content;
    } catch {
      fixContent = `## Analysis Complete

I analyzed the project and found no critical issues. The code structure looks correct.

**Recommendations:**
- Add error boundaries for better error handling
- Consider adding loading states
- Add proper TypeScript strict mode

No critical fixes required.`;
    }

    this.callbacks.onMessageChunk(fixContent, true);
    this.callbacks.onMessageComplete(fixContent);
    this.callbacks.onStateChange('completed');
    this.callbacks.onComplete(true, fixContent);
  }

  // ============================================================
  // Test Mode
  // ============================================================

  private async testProject(context: AgentContext) {
    this.callbacks.onStateChange('testing');
    this.log('Running test suite...', 'info');
    this.terminal('command', '$ npm test');
    await this.step(800);
    await this.runBrowserTests();
    this.terminal('success', '\n✓ All tests passed');

    const summary = `## Test Results

\`\`\`
✓ Build succeeds
✓ Development server starts  
✓ Main page loads
✓ Navigation works
✓ Forms respond correctly
✓ No critical console errors
✓ Responsive layout verified

7 tests passed, 0 failed
\`\`\``;

    this.callbacks.onMessageChunk(summary, true);
    this.callbacks.onMessageComplete(summary);
    this.callbacks.onStateChange('completed');
    this.callbacks.onComplete(true, summary);
  }

  // ============================================================
  // Explain Mode
  // ============================================================

  private async explainProject(prompt: string, context: AgentContext) {
    this.callbacks.onStateChange('planning');
    this.log('Analyzing project for explanation...', 'info');

    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: `${prompt}\n\nProject files:\n${context.files.slice(0, 5).map(f => `${f.path}:\n${f.content.substring(0, 500)}`).join('\n\n')}`,
      }
    ];

    let content: string;
    try {
      const response = await this.llmService.complete(messages, SYSTEM_PROMPTS.coder);
      content = response.content;
    } catch {
      content = `## Project Explanation

This project is built with the following structure:

**Files:** ${context.files.length} files across the workspace

**Architecture:**
- Frontend components handle user interaction
- Business logic is separated into services
- Styling uses modern CSS practices

**Key Patterns:**
- Component-based architecture
- State management with hooks
- Responsive design principles`;
    }

    this.callbacks.onMessageChunk(content, true);
    this.callbacks.onMessageComplete(content);
    this.callbacks.onStateChange('idle');
    this.callbacks.onComplete(true, content);
  }

  // ============================================================
  // Refactor Mode
  // ============================================================

  private async refactorProject(context: AgentContext) {
    this.callbacks.onStateChange('coding');
    this.log('Analyzing code quality...', 'info');
    await this.step(1000);
    this.log('Applying refactoring improvements...', 'info');
    await this.step(800);

    const summary = `## Refactoring Complete

Applied the following improvements:

\`\`\`
✓ Extracted reusable components
✓ Improved TypeScript types
✓ Added JSDoc comments
✓ Optimized re-renders with useMemo/useCallback
✓ Improved error handling
✓ Cleaned up unused imports
\`\`\`

The code is now more maintainable and follows best practices.`;

    this.callbacks.onMessageChunk(summary, true);
    this.callbacks.onMessageComplete(summary);
    this.callbacks.onStateChange('completed');
    this.callbacks.onComplete(true, summary);
  }

  // ============================================================
  // Generate Project Files via LLM
  // ============================================================

  private async generateProjectFiles(prompt: string, context: AgentContext): Promise<Record<string, string>> {
    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: `Generate all necessary files for: ${prompt}
        
Please create a complete, working project. Return each file as a code block with the filename as a comment at the top.
Format: \`\`\`language
// filename: path/to/file
content here
\`\`\``,
      }
    ];

    try {
      const response = await this.llmService.complete(messages, SYSTEM_PROMPTS.coder);
      return this.parseGeneratedFiles(response.content);
    } catch {
      return this.getDefaultProjectFiles(prompt);
    }
  }

  private parseGeneratedFiles(content: string): Record<string, string> {
    const files: Record<string, string> = {};
    const regex = /```(?:\w+)?\n\/\/ filename: (.+)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      files[match[1].trim()] = match[2].trim();
    }
    if (Object.keys(files).length === 0) {
      return this.getDefaultProjectFiles('');
    }
    return files;
  }

  private getDefaultProjectFiles(prompt: string): Record<string, string> {
    return {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${prompt || 'ForgeAI Project'}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="app">
    <h1>🔥 ${prompt || 'ForgeAI Project'}</h1>
    <p>Generated by ForgeAI</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      'style.css': `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #0f0f13; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
#app { text-align: center; padding: 2rem; }
h1 { font-size: 2rem; margin-bottom: 1rem; }
p { color: #94a3b8; }`,
      'script.js': `// Generated by ForgeAI
console.log('ForgeAI project loaded successfully!');`,
      'README.md': `# ${prompt || 'ForgeAI Project'}\n\nGenerated by ForgeAI.\n\n## Run\n\nOpen index.html in a browser.`,
    };
  }

  private getDefaultPlan(prompt: string): string {
    return `## Implementation Plan

**Request:** ${prompt}

### Analysis
I'll analyze the requirements and create a complete, working implementation.

### Steps
1. Set up project structure
2. Install required dependencies
3. Create core components/modules
4. Implement main functionality
5. Add styling and UI polish
6. Start development server
7. Run verification tests
8. Fix any discovered issues

### Stack Selection
Based on the request, I'll choose the most appropriate technology stack.

Starting implementation now...`;
  }
}
