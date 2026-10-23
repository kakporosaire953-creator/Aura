import React from 'react';
import { useTilt } from './useTilt';

interface TiltProps {
  className?: string;
  children: React.ReactNode;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  role?: string;
  'aria-label'?: string;
}

/**
 * Carte à inclinaison 3D douce : suit le curseur en perspective,
 * un reflet la balaie, elle revient en douceur. Accessible au
 * clavier (focus net) et neutre au tactile.
 */
export const Tilt: React.FC<TiltProps> = ({ className = '', children, ...rest }) => {
  const ref = useTilt<HTMLDivElement>();
  return (
    <div ref={ref} className={`tilt ${className}`} {...rest}>
      {children}
      <div className="tilt-brillance" aria-hidden />
    </div>
  );
};
