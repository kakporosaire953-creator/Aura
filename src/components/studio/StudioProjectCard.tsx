import React from 'react';
import { Link } from 'react-router-dom';
import type { StudioProjectSummary } from '../../shared/types.ts';
import { STUDIO_PROJECT_TYPE_LABELS } from '../../shared/types.ts';
import { StudioPreviewFrame } from './StudioPreviewFrame.tsx';

const STATUS_META: Record<
  StudioProjectSummary['status'],
  { label: string; classes: string; icon: string }
> = {
  ready: {
    label: 'Prêt',
    classes: 'bg-[#EAF1E8] text-[#078348] dark:bg-[#182E24] dark:text-[#8CCB4A]',
    icon: 'fa-solid fa-circle-check',
  },
  generating: {
    label: 'En génération',
    classes: 'bg-[#FBF3D9] text-[#A16207] dark:bg-[#2A2614] dark:text-[#EACB37]',
    icon: 'fa-solid fa-spinner fa-spin',
  },
  failed: {
    label: 'Échec',
    classes: 'bg-[#FCEBDD] text-[#C2410C] dark:bg-[#2B1B12] dark:text-[#FF790D]',
    icon: 'fa-solid fa-triangle-exclamation',
  },
  draft: {
    label: 'Brouillon',
    classes: 'bg-[#EFEEF6] text-[#5B6664] dark:bg-[#1B292D] dark:text-[#9AA5A3]',
    icon: 'fa-regular fa-pen-to-square',
  },
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

interface StudioProjectCardProps {
  project: StudioProjectSummary;
  onDelete: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onSelect?: (id: string) => void;
  index?: number;
}

export const StudioProjectCard: React.FC<StudioProjectCardProps> = ({
  project,
  onDelete,
  onDuplicate,
  onSelect,
  index = 0,
}) => {
  const status = STATUS_META[project.status] || STATUS_META.draft;
  const typeLabel = STUDIO_PROJECT_TYPE_LABELS[project.type]?.fr || project.type;

  return (
    <div
      data-studio-card={index}
      className="group relative flex flex-col overflow-hidden rounded-[18px] border border-[#E8E6DE] bg-[#FFFDF8] transition-all duration-300 hover:-translate-y-[3px] hover:border-[#D9D4C5] hover:shadow-[0_18px_46px_rgba(20,40,45,0.10)] dark:border-[#243337] dark:bg-[#152023] dark:hover:border-[#2E4044]"
    >
      <Link
        to={`/app/studio/${project.id}/preview`}
        className="relative block h-[190px] overflow-hidden bg-[#F1EFE6] dark:bg-[#0E1618]"
        onClick={() => onSelect?.(project.id)}
        aria-label={`Ouvrir l'aperçu de ${project.name}`}
      >
        {project.hasIndexHtml && project.status === 'ready' && project.previewHtml ? (
          <div className="pointer-events-none h-full w-full origin-top scale-[0.42] [&>div]:!h-[452px] [&>div]:!max-h-none [&>div]:!w-[1280px] [&>div]:!max-w-none [&>div]:!rounded-none [&>div]:!border-0 [&>div]:!shadow-none [&_iframe]:!rounded-none">
            <StudioPreviewFrame
              files={[]}
              previewHtml={project.previewHtml}
              viewport="desktop"
              title={`Miniature de ${project.name}`}
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F4F2EA] via-[#EEF5E4] to-[#FBF3D9] dark:from-[#152023] dark:via-[#182E24] dark:to-[#2A2614]">
            <i className="fa-solid fa-table-cells-large text-[30px] text-[#078348]/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77817F]">
              {typeLabel}
            </span>
          </div>
        )}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[10px] font-bold ${status.classes}`}
        >
          <i className={`${status.icon} text-[9px]`} />
          {status.label}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-bold leading-snug text-[#14282D] dark:text-[#F3F2EC]">
            {project.name}
          </h3>
          <span className="mt-0.5 shrink-0 rounded-full bg-[#F1EFE6] px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-wide text-[#77817F] dark:bg-[#1B292D] dark:text-[#9AA5A3]">
            {typeLabel}
          </span>
        </div>
        {project.description && (
          <p className="line-clamp-2 text-[11.5px] leading-relaxed text-[#77817F]">
            {project.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2.5 text-[10px] text-[#9AA5A3]">
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-regular fa-clock" />
            Modifié le {formatDate(project.updatedAt)}
          </span>
          <span>
            {project.fileCount} fichier{project.fileCount > 1 ? 's' : ''} ·{' '}
            {project.versionCount} version{project.versionCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-[#EFEBE0] px-3 py-2 dark:border-[#243337]">
        <Link
          to={`/app/studio/${project.id}/preview`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-[7px] text-[11px] font-semibold text-[#078348] transition-colors hover:bg-[#EAF1E8] dark:text-[#8CCB4A] dark:hover:bg-[#182E24]"
        >
          <i className="fa-solid fa-play text-[9px]" />
          Aperçu
        </Link>
        <Link
          to={`/app/studio/${project.id}/develop`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-[7px] text-[11px] font-semibold text-[#14282D] transition-colors hover:bg-[#F1EFE6] dark:text-[#D8D9D2] dark:hover:bg-[#1B292D]"
        >
          <i className="fa-solid fa-code text-[9px]" />
          Code
        </Link>
        <button
          type="button"
          title="Dupliquer"
          onClick={() => onDuplicate(project.id)}
          className="rounded-lg px-2.5 py-[7px] text-[11px] text-[#77817F] transition-colors hover:bg-[#F1EFE6] hover:text-[#14282D] dark:hover:bg-[#1B292D]"
        >
          <i className="fa-regular fa-copy" />
        </button>
        <button
          type="button"
          title="Supprimer"
          onClick={() => onDelete(project.id, project.name)}
          className="rounded-lg px-2.5 py-[7px] text-[11px] text-[#77817F] transition-colors hover:bg-[#FCEBDD] hover:text-[#C2410C] dark:hover:bg-[#2B1B12]"
        >
          <i className="fa-regular fa-trash-can" />
        </button>
      </div>
    </div>
  );
};
