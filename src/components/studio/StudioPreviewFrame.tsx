import React from 'react';
import type { VirtualStudioFile } from '../../shared/types.ts';
import { composePreviewHtml } from '../../shared/studio.ts';

export type StudioViewport = 'desktop' | 'tablet' | 'mobile';

export const STUDIO_VIEWPORTS: Record<
  StudioViewport,
  { label: string; width: number; height: number; icon: string }
> = {
  desktop: { label: 'Ordinateur', width: 1280, height: 800, icon: 'fa-solid fa-desktop' },
  tablet: { label: 'Tablette', width: 768, height: 1024, icon: 'fa-solid fa-tablet-screen-button' },
  mobile: { label: 'Mobile', width: 390, height: 844, icon: 'fa-solid fa-mobile-screen-button' },
};

interface StudioPreviewFrameProps {
  files: VirtualStudioFile[];
  /** Fournir previewHtml du serveur pour éviter de recomposer côté client. */
  previewHtml?: string;
  viewport: StudioViewport;
  refreshKey?: number;
  title?: string;
  className?: string;
  onIframeLoad?: () => void;
}

/**
 * Aperçu isolé d'un projet généré.
 *
 * Sécurité : iframe sandboxée SANS `allow-same-origin` ni `allow-top-navigation` :
 * le code généré ne peut pas accéder au stockage, aux cookies, aux jetons de
 * session Aura, ni piloter l'application parente.
 */
export const StudioPreviewFrame: React.FC<StudioPreviewFrameProps> = ({
  files,
  previewHtml,
  viewport,
  refreshKey = 0,
  title = 'Aperçu du projet Aura Studio',
  className = '',
  onIframeLoad,
}) => {
  const html = React.useMemo(
    () => previewHtml || composePreviewHtml(files || []),
    [previewHtml, files]
  );
  const vp = STUDIO_VIEWPORTS[viewport];

  return (
    <div
      className={`relative flex items-center justify-center overflow-auto bg-[#EDEAE0] dark:bg-[#0A1113] ${className}`}
    >
      <div
        className="relative my-auto rounded-[14px] border border-[#E8E6DE] dark:border-[#243337] bg-white shadow-[0_18px_50px_rgba(20,40,45,0.14)] transition-[width,height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: vp.width,
          maxWidth: '100%',
          height: vp.height,
          maxHeight: '100%',
        }}
      >
        <iframe
          key={`${refreshKey}-${html.length}`}
          title={title}
          srcDoc={html}
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
          className="h-full w-full rounded-[13px] bg-white"
          referrerPolicy="no-referrer"
          onLoad={onIframeLoad}
        />
      </div>
    </div>
  );
};
