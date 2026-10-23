import React, { useMemo, useState } from 'react';
import type { VirtualStudioFile } from '../../shared/types.ts';

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children: FileNode[];
  file?: VirtualStudioFile;
}

function buildTree(files: VirtualStudioFile[]): FileNode {
  const root: FileNode = { name: '', path: '', isDir: true, children: [] };
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const parts = file.path.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, idx) => {
      const isLeaf = idx === parts.length - 1;
      let child = node.children.find((c) => c.name === part && c.isDir === !isLeaf);
      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, idx + 1).join('/'),
          isDir: !isLeaf,
          children: [],
          file: isLeaf ? file : undefined,
        };
        node.children.push(child);
      }
      node = child;
    });
  }
  const sortRec = (n: FileNode) => {
    n.children.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sortRec);
  };
  sortRec(root);
  return root;
}

function fileIcon(path: string): { icon: string; color: string } {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (ext === 'html' || ext === 'htm') return { icon: 'fa-brands fa-html5', color: '#FF790D' };
  if (ext === 'css') return { icon: 'fa-brands fa-css3-alt', color: '#078348' };
  if (ext === 'js' || ext === 'mjs') return { icon: 'fa-brands fa-js', color: '#EAB308' };
  if (ext === 'ts') return { icon: 'fa-solid fa-code', color: '#0F766E' };
  if (ext === 'json') return { icon: 'fa-solid fa-brackets-curly', color: '#77817F' };
  if (ext === 'svg' || ext === 'png' || ext === 'jpg') return { icon: 'fa-regular fa-image', color: '#C2410C' };
  if (ext === 'md') return { icon: 'fa-brands fa-markdown', color: '#078348' };
  return { icon: 'fa-regular fa-file-lines', color: '#77817F' };
}

interface StudioFileExplorerProps {
  files: VirtualStudioFile[];
  activePath?: string;
  onSelect: (path: string) => void;
  onCreateFile?: (path: string) => void;
  onDeleteFile?: (path: string) => void;
  onRenameFile?: (path: string, nextPath: string) => void;
  compact?: boolean;
}

export const StudioFileExplorer: React.FC<StudioFileExplorerProps> = ({
  files,
  activePath,
  onSelect,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  compact = false,
}) => {
  const tree = useMemo(() => buildTree(files), [files]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNode = (node: FileNode, depth: number): React.ReactNode => {
    if (node.isDir) {
      const isCollapsed = collapsed.has(node.path);
      return (
        <div key={`dir-${node.path}`}>
          <button
            type="button"
            onClick={() => toggle(node.path)}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-[5px] text-left text-[11.5px] font-semibold text-[#5B6664] hover:bg-[#F1EFE6] dark:text-[#9AA5A3] dark:hover:bg-[#1B292D]"
            style={{ paddingLeft: 8 + depth * 12 }}
          >
            <i
              className={`fa-solid fa-chevron-${isCollapsed ? 'right' : 'down'} text-[8px] text-[#B4BCBA]`}
            />
            <i className="fa-solid fa-folder text-[#EAB308]" />
            <span className="truncate">{node.name}</span>
          </button>
          {!isCollapsed &&
            node.children.map((child) =>
              child.isDir
                ? renderNode(child, depth + 1)
                : renderLeaf(child, depth + 1)
            )}
        </div>
      );
    }
    return renderLeaf(node, depth);
  };

  const renderLeaf = (node: FileNode, depth: number): React.ReactNode => {
    const icon = fileIcon(node.path);
    const isActive = activePath === node.path;
    const isRenaming = renaming === node.path;
    return (
      <div
        key={`file-${node.path}`}
        className={`group flex items-center gap-1.5 rounded-md px-2 py-[5px] text-[11.5px] ${
          isActive
            ? 'bg-[#EAF1E8] text-[#078348] dark:bg-[#182E24] dark:text-[#8CCB4A]'
            : 'text-[#14282D] hover:bg-[#F1EFE6] dark:text-[#D8D9D2] dark:hover:bg-[#1B292D]'
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => {
              if (renameValue.trim() && renameValue !== node.path && onRenameFile) {
                onRenameFile(node.path, renameValue.trim());
              }
              setRenaming(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') setRenaming(null);
            }}
            className="min-w-0 flex-1 rounded border border-[#E8E6DE] bg-white px-1 py-0.5 text-[11px] outline-none dark:border-[#243337] dark:bg-[#152023]"
          />
        ) : (
          <button
            type="button"
            onClick={() => onSelect(node.path)}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
            title={node.path}
          >
            <i className={`${icon.icon} w-3 text-center`} style={{ color: icon.color }} />
            <span className="truncate">{node.name}</span>
          </button>
        )}
        {!isRenaming && (onRenameFile || onDeleteFile) && (
          <span className="hidden items-center gap-1 group-hover:flex">
            {onRenameFile && (
              <button
                type="button"
                title="Renommer"
                onClick={() => {
                  setRenaming(node.path);
                  setRenameValue(node.path);
                }}
                className="text-[9px] text-[#77817F] hover:text-[#078348]"
              >
                <i className="fa-solid fa-pen" />
              </button>
            )}
            {onDeleteFile && node.path !== 'index.html' && (
              <button
                type="button"
                title="Supprimer le fichier"
                onClick={() => onDeleteFile(node.path)}
                className="text-[9px] text-[#77817F] hover:text-[#C2410C]"
              >
                <i className="fa-solid fa-trash-can" />
              </button>
            )}
          </span>
        )}
      </div>
    );
  };

  const filtered = query.trim()
    ? files.filter((f) => f.path.toLowerCase().includes(query.trim().toLowerCase()))
    : null;

  return (
    <div className="flex h-full flex-col">
      {!compact && (
        <div className="space-y-2 border-b border-[#E8E6DE] p-2.5 dark:border-[#243337]">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#B4BCBA]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un fichier…"
              className="w-full rounded-lg border border-[#E8E6DE] bg-[#FBFAF5] py-[6px] pl-7 pr-2 text-[11px] text-[#14282D] outline-none transition-colors placeholder:text-[#B4BCBA] focus:border-[#8CCB4A] dark:border-[#243337] dark:bg-[#152023] dark:text-[#F3F2EC]"
            />
          </div>
          {onCreateFile && (
            <div>
              {creating ? (
                <div className="flex gap-1">
                  <input
                    autoFocus
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    placeholder="dossier/fichier.ext"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPath.trim()) {
                        onCreateFile(newPath.trim());
                        setNewPath('');
                        setCreating(false);
                      }
                      if (e.key === 'Escape') setCreating(false);
                    }}
                    className="min-w-0 flex-1 rounded border border-[#E8E6DE] bg-white px-2 py-1 text-[11px] outline-none dark:border-[#243337] dark:bg-[#152023]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPath.trim()) {
                        onCreateFile(newPath.trim());
                        setNewPath('');
                        setCreating(false);
                      }
                    }}
                    className="rounded bg-[#078348] px-2 text-[10px] font-semibold text-white"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-[#77817F] hover:bg-[#F1EFE6] hover:text-[#078348] dark:hover:bg-[#1B292D]"
                >
                  <i className="fa-solid fa-plus text-[9px]" />
                  Nouveau fichier
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-1.5">
        {files.length === 0 ? (
          <p className="px-2 py-6 text-center text-[11px] text-[#77817F]">
            Aucun fichier dans ce projet.
          </p>
        ) : filtered ? (
          filtered.map((f) => renderLeaf({ name: f.path, path: f.path, isDir: false, children: [], file: f }, 0))
        ) : (
          tree.children.map((child) =>
            child.isDir ? renderNode(child, 0) : renderLeaf(child, 0)
          )
        )}
      </div>
    </div>
  );
};
