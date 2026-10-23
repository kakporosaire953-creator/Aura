import React, { Suspense, lazy } from 'react';

const AuraSculpture = lazy(() =>
  import('./AuraSculpture').then((m) => ({ default: m.AuraSculpture })),
);

interface Props {
  className?: string;
  masquerSurMobile?: boolean;
}

/** Chargement paresseux de la sculpture 3D — jamais dans le bundle initial. */
export const AuraSculptureCanvas: React.FC<Props> = ({ className, masquerSurMobile = true }) => {
  const [ok, setOk] = React.useState(true);

  React.useEffect(() => {
    if (!masquerSurMobile) return;
    const mq = window.matchMedia('(max-width: 720px)');
    const maj = () => setOk(!mq.matches);
    maj();
    mq.addEventListener('change', maj);
    return () => mq.removeEventListener('change', maj);
  }, [masquerSurMobile]);

  if (!ok) return null;

  return (
    <Suspense fallback={null}>
      <AuraSculpture />
    </Suspense>
  );
};
