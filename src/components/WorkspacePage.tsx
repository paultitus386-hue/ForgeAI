'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useForgeStore } from '@/lib/store';
import { AgentEngine } from '@/lib/agent-engine';
import { LLMService } from '@/lib/llm-service';
import { AgentTask, AgentPlan } from '@/lib/types';
import Sidebar from './workspace/Sidebar';
import ChatPanel from './workspace/ChatPanel';
import ActivityPanel from './workspace/ActivityPanel';
import BottomPanel from './workspace/BottomPanel';
import TopBar from './workspace/TopBar';
import EditorPanel from './workspace/EditorPanel';
import ModelComparisonModal from './ModelComparisonModal';

export default function WorkspacePage() {
  const {
    getActiveProject,
    settings,
    agentState,
    setAgentState,
    agentMode,
    currentPlan,
    setCurrentPlan,
    currentTasks,
    setCurrentTasks,
    updateTask,
    isAgentRunning,
    setIsAgentRunning,
    addMessage,
    updateLastMessage,
    addTerminalLine,
    addActivityLog,
    createFile,
    updateFile,
    setPendingDiffs,
    sidebarCollapsed,
    activePanel,
    activeModel,
    setActiveModelMetrics,
    modelComparisonOpen,
    setModelComparisonOpen,
  } = useForgeStore();

  const project = getActiveProject();
  const engineRef = useRef<AgentEngine | null>(null);
  const [chatInput, setChatInput] = useState('');

  // Initialize agent engine
  const getEngine = useCallback(() => {
    if (!project) return null;
    
    const llmService = new LLMService(settings.llm);
    
    const callbacks = {
      onStateChange: (state: string) => setAgentState(state as any),
      onTaskUpdate: (tasks: AgentTask[]) => setCurrentTasks(tasks),
      onPlanCreated: (plan: AgentPlan) => setCurrentPlan(plan),
      onMessageChunk: (content: string, isNew: boolean) => {
        if (isNew) {
          addMessage(project.id, { role: 'assistant', content, isStreaming: true });
        } else {
          updateLastMessage(project.id, { content, isStreaming: true });
        }
      },
      onMessageComplete: (content: string) => {
        updateLastMessage(project.id, { content, isStreaming: false });
      },
      onTerminalOutput: (type: string, content: string) => {
        addTerminalLine(project.id, { type: type as any, content });
      },
      onFileCreated: (path: string, content: string) => {
        createFile(project.id, path, content);
        addActivityLog(project.id, { message: `Created ${path}`, type: 'success' });
      },
      onFileUpdated: (path: string, content: string) => {
        const file = project.files.find((f) => f.path === path);
        if (file) {
          updateFile(project.id, file.id, content);
          addActivityLog(project.id, { message: `Updated ${path}`, type: 'info' });
        }
      },
      onDiffsReady: (diffs: any[]) => setPendingDiffs(diffs),
      onActivityLog: (message: string, type: string) => {
        addActivityLog(project.id, { message, type: type as any });
      },
      onToolCall: (tool: any) => {
        addActivityLog(project.id, { message: `Using tool: ${tool.name}`, type: 'info', toolUsed: tool.name });
      },
      onComplete: (success: boolean, summary: string) => {
        setIsAgentRunning(false);
        setAgentState(success ? 'completed' : 'failed');
      },
      onError: (message: string) => {
        setIsAgentRunning(false);
        setAgentState('failed');
        addMessage(project.id, { role: 'assistant', content: `❌ Error: ${message}` });
      },
      onModelSelected: (modelName: string, reason?: string) => {
        addActivityLog(project.id, {
          message: reason ? `Model selected: ${modelName} (${reason})` : `Model selected: ${modelName}`,
          type: 'info',
        });
      },
      onModelFallback: (fromModel: string, toModel: string, reason: string) => {
        addActivityLog(project.id, {
          message: `Model switched: ${fromModel} → ${toModel} (${reason})`,
          type: 'warning',
        });
        addMessage(project.id, {
          role: 'assistant',
          content: `⚠️ **Model Switched:** ${fromModel} unavailable. ForgeAI switched to **${toModel}**.\n\n*Reason: ${reason}*`,
        });
      },
      onMetricsUpdated: (metrics: any) => {
        setActiveModelMetrics({
          modelId: activeModel,
          provider: settings.llm.provider,
          inputTokens: metrics.inputTokens,
          outputTokens: metrics.outputTokens,
          totalTokens: metrics.totalTokens,
        });
      },
    };

    const engine = new AgentEngine(llmService, callbacks);
    engineRef.current = engine;
    return engine;
  }, [project, settings.llm, activeModel, setActiveModelMetrics]);

  const handleSendMessage = useCallback(async (message: string, mode?: string) => {
    if (!project || !message.trim() || isAgentRunning) return;

    const effectiveMode = mode ?? agentMode;

    // Add user message
    addMessage(project.id, { role: 'user', content: message });
    setChatInput('');
    setIsAgentRunning(true);
    setAgentState('planning');

    addActivityLog(project.id, { message: `Starting ${effectiveMode} mode...`, type: 'info' });
    addTerminalLine(project.id, { type: 'info', content: `ForgeAI: Starting ${effectiveMode} task...` });

    const engine = getEngine();
    if (!engine) return;

    const context = {
      projectId: project.id,
      projectName: project.name,
      stack: project.stack,
      files: project.files,
      preferredModel: project.preferredModel,
      conversationHistory: project.conversations.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      environmentVars: Object.fromEntries(
        project.environmentVariables.map((e) => [e.key, e.value])
      ),
    };

    await engine.run(message, context, effectiveMode, {
      modelId: activeModel === 'auto' ? undefined : activeModel,
      isAuto: activeModel === 'auto',
    });
  }, [project, agentMode, isAgentRunning, getEngine, activeModel]);

  const handleStop = () => {
    engineRef.current?.abort();
    setIsAgentRunning(false);
    setAgentState('paused');
    if (project) {
      addActivityLog(project.id, { message: 'Agent paused by user', type: 'warning' });
    }
  };

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">No active project</p>
          <button
            onClick={() => useForgeStore.getState().setCurrentView('home')}
            className="px-4 py-2 text-sm rounded-lg"
            style={{ background: 'var(--gradient-brand)', color: 'white' }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] overflow-hidden">
      <TopBar project={project} onStop={handleStop} />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          {!sidebarCollapsed && (
            <>
              <Panel defaultSize={18} minSize={12} maxSize={30}>
                <Sidebar project={project} />
              </Panel>
              <PanelResizeHandle className="w-px bg-[var(--border-subtle)] hover:bg-[var(--accent-violet)] transition-colors cursor-col-resize" />
            </>
          )}

          {/* Main Content */}
          <Panel defaultSize={sidebarCollapsed ? 60 : 50} minSize={30}>
            <PanelGroup direction="vertical" className="h-full">
              {/* Editor / Chat Area */}
              <Panel defaultSize={60} minSize={30}>
                <EditorPanel project={project} />
              </Panel>

              <PanelResizeHandle className="h-px bg-[var(--border-subtle)] hover:bg-[var(--accent-violet)] transition-colors cursor-row-resize" />

              {/* Bottom Panel */}
              <Panel defaultSize={40} minSize={20}>
                <BottomPanel project={project} />
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-px bg-[var(--border-subtle)] hover:bg-[var(--accent-violet)] transition-colors cursor-col-resize" />

          {/* Right Panel: Chat + Activity */}
          <Panel defaultSize={32} minSize={24} maxSize={50}>
            <PanelGroup direction="vertical" className="h-full">
              <Panel defaultSize={65} minSize={40}>
                <ChatPanel
                  project={project}
                  input={chatInput}
                  onInputChange={setChatInput}
                  onSend={handleSendMessage}
                  isRunning={isAgentRunning}
                  onStop={handleStop}
                />
              </Panel>
              <PanelResizeHandle className="h-px bg-[var(--border-subtle)] hover:bg-[var(--accent-violet)] transition-colors cursor-row-resize" />
              <Panel defaultSize={35} minSize={20}>
                <ActivityPanel
                  agentState={agentState}
                  tasks={currentTasks}
                  plan={currentPlan}
                  project={project}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      <ModelComparisonModal
        isOpen={modelComparisonOpen}
        onClose={() => setModelComparisonOpen(false)}
      />
    </div>
  );
}
