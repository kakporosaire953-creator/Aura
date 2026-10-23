import React from 'react';

/**
 * Le logo officiel d'Aura — l'asset fourni, jamais redessiné,
 * recoloré ni déformé. Seul un halo peut être animé AUTOUR.
 */
type Taille = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const TAILLES: Record<Taille, { symbole: number; police: string }> = {
  xs: { symbole: 28, police: '1.05rem' },
  sm: { symbole: 38, police: '1.45rem' },
  md: { symbole: 52, police: '1.95rem' },
  lg: { symbole: 76, police: '2.6rem' },
  xl: { symbole: 132, police: '4.2rem' },
};

interface AuraLogoProps {
  taille?: Taille;
  variante?: 'complet' | 'symbole';
  avecHalo?: boolean;
  surFondSombre?: boolean;
  className?: string;
}

export const AuraLogo: React.FC<AuraLogoProps> = ({
  taille = 'sm',
  variante = 'complet',
  avecHalo = false,
  surFondSombre = false,
  className = '',
}) => {
  const cfg = TAILLES[taille];
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: `${cfg.symbole * 0.32}px` }}
    >
      <span
        style={{
          position: 'relative',
          width: cfg.symbole,
          height: cfg.symbole,
          flexShrink: 0,
          borderRadius: '24%',
          overflow: 'hidden',
          background: '#FFFDF8',
          boxShadow: avecHalo
            ? '0 18px 50px -12px rgba(234, 203, 55, 0.55)'
            : '0 10px 28px -12px rgba(18, 33, 27, 0.28)',
        }}
      >
        <img
          src="/assets/aura-symbol.svg"
          alt="Logo AURA — trois rubans verts, dorés et orange tissés en flamme"
          width={cfg.symbole}
          height={cfg.symbole}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </span>
      {variante === 'complet' && (
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: cfg.police,
            fontWeight: 520,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: surFondSombre ? '#FFFDF8' : '#12211B',
            paddingBottom: '0.06em',
          }}
        >
          Aura
        </span>
      )}
    </span>
  );
};
