import React from 'react';
import { Link } from 'react-router-dom';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useT } from '../app/prefs';

export const NotFoundPage: React.FC = () => {
  const t = useT();
  return (
    <main className="oops">
      <div className="wrap-etroit">
        <img src="/assets/aura-symbol-white.jpg" alt="" aria-hidden />
        <span className="kicker" style={{ justifyContent: 'center' }}>
          {t.oops.kicker}
        </span>
        <h1 className="display-xl" style={{ margin: '1.2rem 0' }}>
          {t.oops.titre1} <em className="italique-vif">{t.oops.titre2}</em>.
        </h1>
        <p className="sous-titre" style={{ marginInline: 'auto' }}>
          {t.oops.sous}
        </p>
        <Link to="/" className="btn btn-encre" style={{ marginTop: '2.2rem' }}>
          <span>{t.oops.btn}</span>
        </Link>
      </div>
    </main>
  );
};
