'use client';

import { useState, useCallback } from 'react';
import { useForgeStore } from '@/lib/store';
import { Project, ProjectFile } from '@/lib/types';
import { buildFileTree, getFileIcon, generateId } from '@/lib/utils';
import {
  ChevronRight, ChevronDown, Plus, Trash2, Edit3,
  FolderOpen, Folder, Search, X, RefreshCw, File
} from 'lucide-react';

interface FileNodeProps {
  node: ProjectFile & { children?: any[] };
  depth: number;
  projectId: string;
  onFileClick: (file: ProjectFile) => void;
  activeFileId: string | null;
}

function FileNode({ node, depth, projectId, onFileClick, activeFileId }: FileNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const { deleteFile, openTab } = useForgeStore();

  const handleClick = () => {
    if (node.isDirectory) {
      setExpanded(!expanded);
    } else {
      onFileClick(node);
      openTab(node.id);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className="group flex items-center gap-1.5 px-2 py-1 cursor-pointer rounded-md transition-all text-sm hover:bg-[var(--bg-hover)]"
        style={{
          paddingLeft: `${(depth + 1) * 12}px`,
          background: activeFileId === node.id ? 'var(--bg-active)' : '',
          color: activeFileId === node.id ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {node.isDirectory ? (
          <>
            {expanded ? (
              <ChevronDown className="w-3 h-3 flex-shrink-0 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronRight className="w-3 h-3 flex-shrink-0 text-[var(--text-tertiary)]" />
            )}
            {expanded ? (
              <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent-violet)]" />
            ) : (
              <Folder className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent-violet)]" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs flex-shrink-0">{getFileIcon(node.name)}</span>
          </>
        )}

        {isRenaming ? (
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => setIsRenaming(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsRenaming(false);
              if (e.key === 'Escape') { setRenameValue(node.name); setIsRenaming(false); }
            }}
            className="flex-1 bg-[var(--bg-elevated)] rounded px-1 text-xs outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-xs">{node.name}</span>
        )}

        {!node.isDirectory && (
          <div className="hidden group-hover:flex items-center gap-1 ml-auto flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
              className="p-0.5 rounded hover:text-white"
              title="Rename"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteFile(projectId, node.id); }}
              className="p-0.5 rounded hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {node.isDirectory && expanded && node.children && (
        <div>
          {node.children.map((child: any) => (
            <FileNode
              key={child.id}
              node={child}
              depth={depth + 1}
              projectId={projectId}
              onFileClick={onFileClick}
              activeFileId={activeFileId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ project }: { project: Project }) {
  const { activeFileId, setActiveFile, openTab, createFile } = useForgeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const fileTree = buildFileTree(project.files);

  const filteredFiles = searchQuery
    ? project.files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  const handleFileClick = useCallback((file: ProjectFile) => {
    setActiveFile(file.id);
  }, [setActiveFile]);

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const newFile = createFile(project.id, newFileName.trim(), '');
    openTab(newFile.id);
    setIsCreatingFile(false);
    setNewFileName('');
  };

  return (
    <div
      className="h-full flex flex-col border-r border-[var(--border-subtle)] overflow-hidden"
      style={{ background: 'var(--bg-panel)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] flex-shrink-0">
        <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Files</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreatingFile(true)}
            className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] rounded-md px-2 py-1">
          <Search className="w-3 h-3 text-[var(--text-tertiary)]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X className="w-3 h-3 text-[var(--text-tertiary)]" />
            </button>
          )}
        </div>
      </div>

      {/* New File Input */}
      {isCreatingFile && (
        <div className="px-3 py-1.5 border-b border-[var(--border-subtle)] flex-shrink-0">
          <input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFile();
              if (e.key === 'Escape') { setIsCreatingFile(false); setNewFileName(''); }
            }}
            placeholder="filename.tsx"
            className="w-full bg-[var(--bg-elevated)] border border-[var(--accent-violet)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
            autoFocus
          />
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {project.files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <File className="w-8 h-8 text-[var(--text-disabled)]" />
            <p className="text-xs text-[var(--text-tertiary)]">No files yet. Start a build to generate files.</p>
          </div>
        ) : filteredFiles ? (
          // Flat search results
          filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => { handleFileClick(file); openTab(file.id); }}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[var(--bg-hover)] text-xs"
              style={{ color: activeFileId === file.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <span>{getFileIcon(file.name)}</span>
              <span className="truncate">{file.path}</span>
            </div>
          ))
        ) : (
          // Tree view
          fileTree.map((node) => (
            <FileNode
              key={node.id}
              node={node}
              depth={0}
              projectId={project.id}
              onFileClick={handleFileClick}
              activeFileId={activeFileId}
            />
          ))
        )}
      </div>

      {/* Project Info */}
      <div className="px-3 py-2 border-t border-[var(--border-subtle)] flex-shrink-0">
        <p className="text-xs text-[var(--text-tertiary)] truncate">{project.name}</p>
        <p className="text-xs text-[var(--text-disabled)]">{project.files.length} files</p>
      </div>
    </div>
  );
}
