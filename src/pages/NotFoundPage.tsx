import React from 'react';
import { Link } from 'react-router-dom';
import { AuraLogo } from '../components/brand/AuraLogo';

export const NotFoundPage: React.FC = () => (
  <main className="oops">
    <div className="wrap-etroit">
      <img src="/assets/aura-symbol-white.jpg" alt="" aria-hidden />
      <span className="kicker" style={{ justifyContent: 'center' }}>
        Perdu dans les rubans
      </span>
      <h1 className="display-xl" style={{ margin: '1.2rem 0' }}>
        Cette page s'est <em className="italique-vif">évaporée</em>.
      </h1>
      <p className="sous-titre" style={{ marginInline: 'auto' }}>
        Le fil se rompt ici — reprenons-le au commencement.
      </p>
      <Link to="/" className="btn btn-encre" style={{ marginTop: '2.2rem' }}>
        <span>Revenir à l'accueil</span>
      </Link>
    </div>
  </main>
);
