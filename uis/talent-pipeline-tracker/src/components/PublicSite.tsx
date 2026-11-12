'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Language = 'es' | 'en';

const copy = {
  es: {
    home: 'Inicio', services: 'Servicios', locations: 'Presencia', team: 'Equipo', getStarted: 'Empieza ahora',
    hero: 'Logística inteligente para tu', heroHighlight: 'e-commerce',
    heroText: 'Almacenamos tu inventario, preparamos y empaquetamos los pedidos, los enviamos a través de nuestra red de transportistas y gestionamos las devoluciones. Tú ocúpate de vender; de la logística nos encargamos nosotros.',
    work: 'Trabaja con nosotros', explore: 'Conoce nuestros servicios', servicesTitle: 'Nuestros servicios',
    serviceNames: ['Operaciones de almacén', 'Última milla', 'Logística inversa', 'Atención al cliente', 'Informes y dashboards', 'Automatización inteligente'],
    serviceDescriptions: [
      'Gestionamos inventario en nuestros almacenes de Los Ángeles y Zaragoza: recepción, picking, packing y preparación de envíos. La visibilidad global en tiempo real aún está pendiente de integración.',
      'Trabajamos con 8 transportistas en EE.UU. y España. La asignación y la consulta de seguimiento se realizan actualmente de forma manual en los portales de cada transportista.',
      'Gestionamos devoluciones que representan entre el 18% y el 25% del volumen, según cliente y país. La aprobación e inspección requieren revisión humana; la inspección con IA no está implementada.',
      '15 agentes en Los Ángeles y Zaragoza. Soporte B2B para marcas y B2C para consumidores finales en español e inglés.',
      'La información operativa se consolida actualmente de forma manual. Los dashboards integrados y los reportes PDF automáticos están pendientes de implementación.',
      'La aprobación automática, los agentes CX, la inspección asistida por IA y la recomendación de transportistas son capacidades propuestas; todavía no están implementadas.',
    ],
    locationsTitle: 'Presencia internacional',
    laTitle: '🇺🇸 Los Ángeles, EE.UU.', laText: 'Sede central y almacén principal. Fundada en 2009 por Thomas Harry.', laLaAddress: '📍 7423 S Alameda St, Los Angeles, CA 90001',
    zaTitle: '🇪🇸 Zaragoza, España', zaText: 'Oficina de tecnología liderada por el CTO Andrés Kim.', zaAddress: '📍 Calle María Zambrano 31, 50018 Zaragoza', map: 'Ver en Google Maps',
    teamTitle: 'Equipo directivo', contact: 'Contacto', links: 'Enlaces', tagline: 'Logística inteligente para e-commerce.', copyright: '© 2026 TrackFlow Logistics. Todos los derechos reservados.',
  },
  en: {
    home: 'Home', services: 'Services', locations: 'Locations', team: 'Team', getStarted: 'Get started',
    hero: 'Smart logistics for your', heroHighlight: 'e-commerce',
    heroText: 'We store your inventory, prepare and pack orders, ship them through our carrier network, and manage returns. You focus on selling; we handle the logistics.',
    work: 'Work with us', explore: 'Explore our services', servicesTitle: 'Our services',
    serviceNames: ['Warehouse operations', 'Last mile', 'Reverse logistics', 'Customer support', 'Reports & dashboards', 'Smart automation'],
    serviceDescriptions: [
      'We manage inventory across our Los Angeles and Zaragoza warehouses: receiving, picking, packing, and shipment preparation. Global real-time visibility is still pending integration.',
      'We work with 8 carriers in the US and Spain. Carrier assignment and tracking lookups are currently handled manually through each carrier portal.',
      'We manage returns representing 18% to 25% of volume, depending on client and country. Approvals and inspections require human review; AI-assisted inspection is not implemented.',
      '15 agents in Los Angeles and Zaragoza. B2B support for brands and B2C for end consumers in Spanish and English.',
      'Operational information is currently consolidated manually. Integrated dashboards and automated PDF reports are pending implementation.',
      'Automatic approvals, CX agents, AI-assisted inspection, and carrier recommendations are proposed capabilities; they are not implemented yet.',
    ],
    locationsTitle: 'International presence',
    laTitle: '🇺🇸 Los Angeles, USA', laText: 'Headquarters and main warehouse. Founded in 2009 by Thomas Harry.', laLaAddress: '📍 7423 S Alameda St, Los Angeles, CA 90001',
    zaTitle: '🇪🇸 Zaragoza, Spain', zaText: 'Technology office led by CTO Andrés Kim.', zaAddress: '📍 Calle María Zambrano 31, 50018 Zaragoza', map: 'View on Google Maps',
    teamTitle: 'Leadership team', contact: 'Contact', links: 'Links', tagline: 'Smart logistics for e-commerce.', copyright: '© 2026 TrackFlow Logistics. All rights reserved.',
  },
} as const;

const services = ['🏭', '🚚', '🔄', '📞', '📊', '🤖'];
const people = [
  { name: 'Thomas Harry', role: 'Fundador & CEO', roleEn: 'Founder & CEO', image: 11, slug: 'thomasharry' },
  { name: 'Andrés Kim', role: 'CTO', roleEn: 'CTO', image: 12, slug: 'andreskim' },
  { name: 'Ana Whitfield', role: 'Operaciones de Almacén', roleEn: 'Warehouse Operations', image: 5, slug: 'anawhitfield' },
  { name: 'Carlos Vega', role: 'Última Milla', roleEn: 'Last Mile', image: 33, slug: 'carlosvega' },
  { name: 'Sofía Ramos', role: 'Logística Inversa', roleEn: 'Reverse Logistics', image: 16, slug: 'sofiaramos' },
  { name: 'Valentina Cruz', role: 'Atención al Cliente', roleEn: 'Customer Support', image: 9, slug: 'valentinacruz' },
];

function LanguageButtons({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return <div className="public-language-switch" aria-label="Language">
    {(['es', 'en'] as const).map((item) => <button key={item} type="button" onClick={() => onChange(item)} aria-pressed={language === item} className={language === item ? 'is-active' : ''}>{item.toUpperCase()}</button>)}
  </div>;
}

export default function PublicSite() {
  const [language, setLanguage] = useState<Language>('es');
  const [menuOpen, setMenuOpen] = useState(false);
  const text = copy[language];

  useEffect(() => {
    const saved = window.localStorage.getItem('trackflow-lang');
    // The saved preference is external browser state; restore it after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'es' || saved === 'en') setLanguage(saved);
  }, []);

  function changeLanguage(next: Language) {
    setLanguage(next);
    window.localStorage.setItem('trackflow-lang', next);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return <div className="public-site" lang={language}>
    <header className="public-header">
      <div className="public-header-inner">
        <Link href="/" className="public-brand" aria-label="TrackFlow inicio"><span aria-hidden="true">📦</span>TrackFlow</Link>
        <nav className="public-nav" aria-label="Navegación principal">
          <a href="#servicios">{text.services}</a><a href="#presencia">{text.locations}</a><a href="#equipo">{text.team}</a>
          <LanguageButtons language={language} onChange={changeLanguage} />
          <Link href="/application" className="public-button public-button-small">{text.getStarted}</Link>
        </nav>
        <button className="public-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="public-mobile-menu" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
      </div>
      {menuOpen && <nav id="public-mobile-menu" className="public-mobile-nav" aria-label="Navegación móvil">
        <a href="#servicios" onClick={closeMenu}>{text.services}</a><a href="#presencia" onClick={closeMenu}>{text.locations}</a><a href="#equipo" onClick={closeMenu}>{text.team}</a>
        <LanguageButtons language={language} onChange={changeLanguage} />
        <Link href="/application" className="public-button" onClick={closeMenu}>{text.getStarted}</Link>
      </nav>}
    </header>
    <main>
      <section className="public-hero" aria-label="Presentación de TrackFlow">
        <span className="public-eyebrow">TRACKFLOW LOGISTICS · US + ES</span>
        <h1>{text.hero} <span>{text.heroHighlight}</span></h1>
        <p>{text.heroText}</p>
        <div className="public-hero-actions"><Link href="/application" className="public-button">{text.work}<span aria-hidden="true"> ↗</span></Link><a className="public-button public-button-secondary" href="#servicios">{text.explore}</a></div>
        <div className="public-hero-footnote"><span aria-hidden="true">✳</span> Warehousing <span>·</span> Fulfillment <span>·</span> Last mile</div>
      </section>
      <section id="servicios" className="public-section public-services">
        <div className="public-section-heading"><span className="public-eyebrow">WHAT WE DO</span><h2>{text.servicesTitle}</h2></div>
        <div className="public-service-grid">{text.serviceNames.map((name, index) => <article className="public-service-card" key={name}><span className="public-service-icon" aria-hidden="true">{services[index]}</span><h3>{name}</h3><p>{text.serviceDescriptions[index]}</p></article>)}</div>
      </section>
      <section id="presencia" className="public-section public-locations">
        <div className="public-section-heading"><span className="public-eyebrow">OUR FOOTPRINT</span><h2>{text.locationsTitle}</h2></div>
        <div className="public-location-grid">
          <article className="public-location-card"><img src="https://placehold.co/900x480/243e7a/ffffff?text=Los+Angeles" alt="Almacén de TrackFlow en Los Ángeles, California" loading="lazy" /><div><h3>{text.laTitle}</h3><p>{text.laText}</p><p className="public-address">{text.laLaAddress}</p><a href="https://www.google.com/maps?q=7423+S+Alameda+St+Los+Angeles+CA+90001" target="_blank" rel="noopener noreferrer">{text.map} ↗</a></div></article>
          <article className="public-location-card"><img src="https://placehold.co/900x480/52747a/ffffff?text=Zaragoza" alt="Oficina de tecnología de TrackFlow en Zaragoza, España" loading="lazy" /><div><h3>{text.zaTitle}</h3><p>{text.zaText}</p><p className="public-address">{text.zaAddress}</p><a href="https://www.google.com/maps?q=Calle+María+Zambrano+31+50018+Zaragoza" target="_blank" rel="noopener noreferrer">{text.map} ↗</a></div></article>
        </div>
      </section>
      <section id="equipo" className="public-section public-team">
        <div className="public-section-heading"><span className="public-eyebrow">THE PEOPLE BEHIND THE FLOW</span><h2>{text.teamTitle}</h2></div>
        <div className="public-team-grid">{people.map((person) => <article className="public-person" key={person.slug}><img src={`https://i.pravatar.cc/240?img=${person.image}`} alt={`${person.name}, ${language === 'es' ? person.role : person.roleEn} de TrackFlow`} loading="lazy" /><h3>{person.name}</h3><p>{language === 'es' ? person.role : person.roleEn}</p><div><a href={`https://www.linkedin.com/in/${person.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${person.name}`}>in</a><a href={`https://github.com/${person.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`GitHub de ${person.name}`}>⌘</a></div></article>)}</div>
      </section>
    </main>
    <footer className="public-footer"><div className="public-footer-grid"><div><Link href="/" className="public-brand public-footer-brand"><span aria-hidden="true">📦</span>TrackFlow</Link><p>{text.tagline}</p></div><div><h2>{text.contact}</h2><p><a href="mailto:hola@trackflow-logistics.com">hola@trackflow-logistics.com</a></p><p><a href="tel:+12135550100">+1 (213) 555-0100</a></p><p>Los Ángeles, CA · Zaragoza, España</p></div><div><h2>{text.links}</h2><a href="#servicios">{text.services}</a><Link href="/application">{text.getStarted}</Link></div></div><div className="public-copyright">{text.copyright}</div></footer>
  </div>;
}
