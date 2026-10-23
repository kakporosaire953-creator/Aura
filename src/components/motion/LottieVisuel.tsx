import React, { useEffect, useRef, useState } from 'react';
import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';

/**
 * Visuel animé Lottie des cadres du fil narratif.
 *
 * - montage différé : le fichier n'est chargé qu'à l'approche du viewport ;
 * - pause de rendu hors écran (freezeOnOffscreen) ;
 * - prefers-reduced-motion → première image figée, sans autoplay ;
 * - échec de chargement → retrait discret (le motif du ruban reste visible),
 *   jamais de faux rendu.
 */
export const LottieVisuel: React.FC<{ src: string; className?: string; label: string }> = ({
  src,
  className,
  label,
}) => {
  const hote = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [echec, setEchec] = useState(false);
  const [reduit] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [instance, setInstance] = useState<DotLottie | null>(null);

  // Montage différé : on ne charge l'animation qu'à l'approche du viewport.
  useEffect(() => {
    const el = hote.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '220px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Écoute honnête des erreurs de chargement du fichier Lottie.
  useEffect(() => {
    if (!instance) return;
    const onErreur = () => setEchec(true);
    instance.addEventListener('loadError', onErreur);
    return () => instance.removeEventListener('loadError', onErreur);
  }, [instance]);

  return (
    <div ref={hote} className={className} data-lottie="">
      {visible && !echec && (
        <DotLottieReact
          src={src}
          loop
          autoplay={!reduit}
          renderConfig={{ freezeOnOffscreen: true, autoResize: true }}
          dotLottieRefCallback={setInstance}
          role="img"
          aria-label={label}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};
