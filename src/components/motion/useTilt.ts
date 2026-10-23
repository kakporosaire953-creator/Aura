import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Inclinaison 3D douce au survol : la carte suit le curseur en
 * perspective, un reflet lumineux la balaie, et elle revient en
 * douceur. Désactivée au tactile et en mouvement réduit.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tactile = window.matchMedia('(hover: none)').matches;
    if (reduit || tactile) return;

    gsap.set(el, { transformPerspective: 950, transformOrigin: 'center' });

    const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.55, ease: 'power3.out' });
    const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.55, ease: 'power3.out' });
    const lift = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });

    const brillance = el.querySelector<HTMLElement>('.tilt-brillance');

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rotY(px * 11);
      rotX(-py * 9);
      lift(-9);
      if (brillance) {
        brillance.style.setProperty('--tilt-x', `${(px + 0.5) * 100}%`);
        brillance.style.setProperty('--tilt-y', `${(py + 0.5) * 100}%`);
      }
    };

    const onLeave = () => {
      rotX(0);
      rotY(0);
      lift(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}
