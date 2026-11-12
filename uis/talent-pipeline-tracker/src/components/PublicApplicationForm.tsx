'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

type Language = 'es' | 'en';
type FormErrors = Record<string, string>;

const fields = {
  es: {
    home: 'Inicio', title: 'Empieza a enviar con TrackFlow', description: 'Cuéntanos sobre tu empresa. Este formulario es una demostración local: los datos no se envían ni se guardan.', demo: 'Prototipo de demostración: no introduzcas información personal o confidencial. La validación se ejecuta solo en este navegador; no se envía ni se almacena ninguna solicitud.', company: 'Datos de la empresa', business: 'Información comercial', services: 'Servicios que necesitas', additional: 'Información adicional',
    companyName: 'Nombre de la empresa', contact: 'Persona de contacto', position: 'Cargo', email: 'Correo electrónico corporativo', phone: 'Teléfono', country: 'País', city: 'Ciudad',
    volume: 'Volumen mensual estimado de pedidos', category: 'Categoría de productos', platform: 'Plataforma de e-commerce', provider: 'Proveedor logístico actual (opcional)', message: 'Cuéntanos sobre tus necesidades', referral: '¿Cómo nos conociste? (opcional)', terms: 'Confirmo que entiendo que este formulario es una demostración local y que mis datos no se enviarán ni guardarán.',
    volumePlaceholder: 'Selecciona un rango', categoryPlaceholder: 'Selecciona una categoría', platformPlaceholder: 'Selecciona una plataforma', referralPlaceholder: 'Selecciona una opción',
    volumes: ['< 1.000', '1.000 - 5.000', '5.000 - 20.000', '20.000 - 100.000', '> 100.000'], categories: ['Moda y accesorios', 'Electrónica y tecnología', 'Hogar y jardín', 'Salud y belleza', 'Alimentación', 'Libros y papelería', 'Deportes y ocio', 'Automoción', 'Mascotas', 'Otros'], platforms: ['Shopify', 'Magento / Adobe Commerce', 'WooCommerce', 'PrestaShop', 'Salesforce Commerce Cloud', 'BigCommerce', 'VTEX', 'Mercado Libre', 'Amazon', 'Tienda propia / CMS propio', 'Otra'], referrals: ['LinkedIn', 'Google', 'Recomendación de cliente', 'Feria / Evento', 'Redes sociales', 'Artículo / Blog', 'Otro'],
    serviceNames: ['Operaciones de almacén', 'Última milla', 'Logística inversa', 'Atención al cliente (CX)', 'Informes y dashboards', 'Automatización inteligente'], messagePlaceholder: 'Describe tu operación, volumen actual, desafíos logísticos y cualquier requisito especial (mín. 20 caracteres)',
    submit: 'Validar formulario', reset: 'Limpiar formulario', required: 'Este campo es obligatorio.', invalidEmail: 'Ingresa un correo electrónico válido.', invalidPhone: 'Ingresa un número de teléfono válido.', tooShort: 'Ingresa al menos 2 caracteres.', messageShort: 'El mensaje debe tener al menos 20 caracteres.', servicesError: 'Selecciona al menos un servicio.', termsError: 'Confirma que entiendes las condiciones de esta demostración.', successTitle: '✅ Validación de demostración completada', successDesc: 'El formulario solo se validó en este navegador. No se envió ni se guardó ninguna solicitud.', back: 'Volver al inicio',
  },
  en: {
    home: 'Home', title: 'Start shipping with TrackFlow', description: 'Tell us about your company. This is a local demonstration form: data is not sent or stored.', demo: 'Demo prototype: do not enter personal or confidential information. Validation runs only in this browser; no request is sent or stored.', company: 'Company information', business: 'Business information', services: 'Services you need', additional: 'Additional information',
    companyName: 'Company name', contact: 'Contact person', position: 'Position / Role', email: 'Corporate email', phone: 'Phone', country: 'Country', city: 'City',
    volume: 'Estimated monthly order volume', category: 'Product category', platform: 'E-commerce platform', provider: 'Current logistics provider (optional)', message: 'Tell us about your needs', referral: 'How did you hear about us? (optional)', terms: 'I understand this is a local demo form and my information will not be sent or stored.',
    volumePlaceholder: 'Select a range', categoryPlaceholder: 'Select a category', platformPlaceholder: 'Select a platform', referralPlaceholder: 'Select an option',
    volumes: ['< 1,000', '1,000 - 5,000', '5,000 - 20,000', '20,000 - 100,000', '> 100,000'], categories: ['Fashion & accessories', 'Electronics & technology', 'Home & garden', 'Health & beauty', 'Food & beverages', 'Books & stationery', 'Sports & leisure', 'Automotive', 'Pets', 'Other'], platforms: ['Shopify', 'Magento / Adobe Commerce', 'WooCommerce', 'PrestaShop', 'Salesforce Commerce Cloud', 'BigCommerce', 'VTEX', 'Mercado Libre', 'Amazon', 'Own / Custom CMS', 'Other'], referrals: ['LinkedIn', 'Google', 'Client referral', 'Fair / Event', 'Social media', 'Article / Blog', 'Other'],
    serviceNames: ['Warehouse operations', 'Last mile delivery', 'Reverse logistics', 'Customer support (CX)', 'Reports & dashboards', 'Smart automation'], messagePlaceholder: 'Describe your operation, current volume, logistics challenges, and any special requirements (min. 20 characters)',
    submit: 'Validate form', reset: 'Clear form', required: 'This field is required.', invalidEmail: 'Enter a valid email address.', invalidPhone: 'Enter a valid phone number.', tooShort: 'Enter at least 2 characters.', messageShort: 'Message must be at least 20 characters.', servicesError: 'Select at least one service.', termsError: 'Confirm you understand the terms of this demo.', successTitle: '✅ Demo validation complete', successDesc: 'The form was validated only in this browser. No request was sent or stored.', back: 'Back to home',
  },
} as const;

const countryOptions = [
  ['AR', 'Argentina'], ['AU', 'Australia'], ['BR', 'Brasil'], ['CA', 'Canadá'], ['CL', 'Chile'], ['CN', 'China'], ['CO', 'Colombia'], ['KR', 'Corea del Sur'], ['CR', 'Costa Rica'], ['EC', 'Ecuador'], ['EG', 'Egipto'], ['SV', 'El Salvador'], ['AE', 'Emiratos Árabes Unidos'], ['ES', 'España'], ['US', 'Estados Unidos'], ['FR', 'Francia'], ['GT', 'Guatemala'], ['HN', 'Honduras'], ['IN', 'India'], ['GB', 'Inglaterra / Reino Unido'], ['JP', 'Japón'], ['MX', 'México'], ['NI', 'Nicaragua'], ['PA', 'Panamá'], ['PY', 'Paraguay'], ['PE', 'Perú'], ['PT', 'Portugal'], ['PR', 'Puerto Rico'], ['DO', 'República Dominicana'], ['UY', 'Uruguay'], ['VE', 'Venezuela'], ['other', 'Otro'],
] as const;

type FieldChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

function Choice({ id, label, placeholder, options, error, onChange }: { id: string; label: string; placeholder: string; options: readonly string[]; error?: string; onChange: (event: FieldChangeEvent) => void }) {
  return <div className="public-field"><label htmlFor={id}>{label} <span aria-hidden="true">*</span></label><select id={id} name={id} defaultValue="" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={onChange}><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{error && <span id={`${id}-error`} className="public-field-error">{error}</span>}</div>;
}

function TextField({ id, label, type = 'text', placeholder, error, onChange, required = true }: { id: string; label: string; type?: string; placeholder?: string; error?: string; onChange: (event: FieldChangeEvent) => void; required?: boolean }) {
  return <div className="public-field"><label htmlFor={id}>{label}{required && <> <span aria-hidden="true">*</span></>}</label><input id={id} name={id} type={type} placeholder={placeholder} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={onChange} />{error && <span id={`${id}-error`} className="public-field-error">{error}</span>}</div>;
}

export default function PublicApplicationForm() {
  const [language, setLanguage] = useState<Language>('es');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const text = fields[language];

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

  function clearFieldError(event: FieldChangeEvent) {
    const { name } = event.currentTarget;
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextErrors: FormErrors = {};
    const requiredText = ['empresa', 'contacto', 'cargo', 'ciudad'];
    requiredText.forEach((name) => {
      const value = String(data.get(name) ?? '').trim();
      if (!value) nextErrors[name] = text.required;
      else if (value.length < 2) nextErrors[name] = text.tooShort;
    });
    const email = String(data.get('email') ?? '').trim();
    if (!email) nextErrors.email = text.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = text.invalidEmail;
    const phone = String(data.get('telefono') ?? '').trim();
    if (!phone) nextErrors.telefono = text.required;
    else if (!/^[\d\s\-+()]{7,20}$/.test(phone)) nextErrors.telefono = text.invalidPhone;
    ['pais', 'volumen', 'categoria', 'plataforma'].forEach((name) => { if (!data.get(name)) nextErrors[name] = text.required; });
    if (data.getAll('servicios').length === 0) nextErrors.servicios = text.servicesError;
    const message = String(data.get('mensaje') ?? '').trim();
    if (message.length < 20) nextErrors.mensaje = message ? text.messageShort : text.required;
    if (!data.get('terminos')) nextErrors.terminos = text.termsError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }
    setSubmitted(true);
  }

  function resetForm() {
    setSubmitted(false);
    setErrors({});
  }

  return <div className="public-site public-application" lang={language}>
    <header className="public-header"><div className="public-header-inner"><Link href="/" className="public-brand" aria-label="TrackFlow inicio"><span aria-hidden="true">📦</span>TrackFlow</Link><nav className="public-nav"><Link href="/">{text.home}</Link><Link href="/#servicios">{text.services}</Link><div className="public-language-switch" aria-label="Language">{(['es', 'en'] as const).map((item) => <button key={item} type="button" onClick={() => changeLanguage(item)} aria-pressed={language === item} className={language === item ? 'is-active' : ''}>{item.toUpperCase()}</button>)}</div></nav></div></header>
    <main className="public-form-main">
      <div className="public-form-heading"><span className="public-eyebrow">TRACKFLOW · B2B</span><h1>{text.title}</h1><p>{text.description}</p></div>
      <div className="public-demo-notice" role="note"><span aria-hidden="true">ⓘ</span><p>{text.demo}</p></div>
      {submitted ? <section className="public-form-success" role="status"><div aria-hidden="true">✓</div><h2>{text.successTitle}</h2><p>{text.successDesc}</p><Link href="/" className="public-button">{text.back}</Link><button className="public-reset-link" type="button" onClick={resetForm}>{text.reset}</button></section> : <form className="public-form-card" onSubmit={handleSubmit} noValidate>
        <fieldset><legend>{text.company}</legend><div className="public-form-grid"><TextField id="empresa" label={text.companyName} placeholder={language === 'es' ? 'Ej. Mi Tienda Online S.L.' : 'E.g. My Online Store LLC'} error={errors.empresa} onChange={clearFieldError} /><TextField id="contacto" label={text.contact} placeholder={language === 'es' ? 'Ej. María López' : 'E.g. Maria Lopez'} error={errors.contacto} onChange={clearFieldError} /><TextField id="cargo" label={text.position} placeholder={language === 'es' ? 'Ej. Directora de Operaciones' : 'E.g. Operations Director'} error={errors.cargo} onChange={clearFieldError} /><TextField id="email" label={text.email} type="email" placeholder={language === 'es' ? 'ejemplo@miempresa.com' : 'hello@mycompany.com'} error={errors.email} onChange={clearFieldError} /><TextField id="telefono" label={text.phone} type="tel" placeholder="+1 213 555 0100" error={errors.telefono} onChange={clearFieldError} /><div className="public-field"><label htmlFor="pais">{text.country} <span aria-hidden="true">*</span></label><select id="pais" name="pais" defaultValue="" aria-invalid={Boolean(errors.pais)} aria-describedby={errors.pais ? 'pais-error' : undefined} onChange={clearFieldError}><option value="">{language === 'es' ? 'Selecciona tu país' : 'Select your country'}</option>{countryOptions.map(([value, country]) => <option key={value} value={value}>{country}</option>)}</select>{errors.pais && <span id="pais-error" className="public-field-error">{errors.pais}</span>}</div><TextField id="ciudad" label={text.city} placeholder={language === 'es' ? 'Ej. Los Ángeles' : 'E.g. Los Angeles'} error={errors.ciudad} onChange={clearFieldError} /></div></fieldset>
        <fieldset><legend>{text.business}</legend><div className="public-form-grid"><Choice id="volumen" label={text.volume} placeholder={text.volumePlaceholder} options={text.volumes} error={errors.volumen} onChange={clearFieldError} /><Choice id="categoria" label={text.category} placeholder={text.categoryPlaceholder} options={text.categories} error={errors.categoria} onChange={clearFieldError} /><Choice id="plataforma" label={text.platform} placeholder={text.platformPlaceholder} options={text.platforms} error={errors.plataforma} onChange={clearFieldError} /><TextField id="proveedor" label={text.provider} required={false} onChange={clearFieldError} /></div></fieldset>
        <fieldset><legend>{text.services}</legend><div className="public-checkbox-grid">{text.serviceNames.map((service, index) => <label className="public-checkbox" key={service}><input type="checkbox" name="servicios" value={index} onChange={() => setErrors((current) => ({ ...current, servicios: '' }))} /><span>{service}</span></label>)}</div>{errors.servicios && <span className="public-field-error">{errors.servicios}</span>}</fieldset>
        <fieldset><legend>{text.additional}</legend><div className="public-form-grid"><div className="public-field public-field-wide"><label htmlFor="mensaje">{text.message} <span aria-hidden="true">*</span></label><textarea id="mensaje" name="mensaje" rows={5} placeholder={text.messagePlaceholder} aria-invalid={Boolean(errors.mensaje)} aria-describedby={errors.mensaje ? 'mensaje-error' : undefined} onChange={clearFieldError} />{errors.mensaje && <span id="mensaje-error" className="public-field-error">{errors.mensaje}</span>}</div><Choice id="referral" label={text.referral} placeholder={text.referralPlaceholder} options={text.referrals} onChange={clearFieldError} /></div></fieldset>
        <div className="public-terms"><label><input id="terminos" name="terminos" type="checkbox" aria-invalid={Boolean(errors.terminos)} aria-describedby={errors.terminos ? 'terminos-error' : undefined} onChange={clearFieldError} /><span>{text.terms} <span aria-hidden="true">*</span></span></label>{errors.terminos && <span id="terminos-error" className="public-field-error">{errors.terminos}</span>}</div>
        <div className="public-form-actions"><button type="submit" className="public-button">{text.submit}<span aria-hidden="true"> →</span></button><button type="reset" className="public-button public-button-secondary" onClick={resetForm}>{text.reset}</button></div>
      </form>}
      <p className="public-required-note">* {language === 'es' ? 'Campos obligatorios' : 'Required fields'}</p>
    </main>
    <footer className="public-form-footer"><Link href="/">TrackFlow Logistics</Link><span> · </span>{text.demo}</footer>
  </div>;
}
