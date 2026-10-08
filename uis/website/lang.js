/* =========================================
   lang.js - Traducciones ES/EN
   ========================================= */

const i18n = {
    es: {
        /* Header */
        'header.title': 'TrackFlow',
        'nav.inicio': 'Inicio',
        'nav.servicios': 'Servicios',
        'nav.presencia': 'Presencia',
        'nav.equipo': 'Equipo',
        'nav.unete': 'Únete',
        'nav.contacto': 'Contacto',

        /* Hero */
        'hero.title': 'Logística inteligente para tu',
        'hero.title.highlight': 'e-commerce',
        'hero.subtitle': 'Almacenamos tu inventario, preparamos y empaquetamos los pedidos, los enviamos a través de nuestra red de transportistas y gestionamos las devoluciones. Tú ocúpate de vender; de la logística nos encargamos nosotros.',
        'hero.cta.primary': 'Trabaja con nosotros',
        'hero.cta.secondary': 'Conoce nuestros servicios',

        /* Servicios */
        'servicios.title': 'Nuestros servicios',
        'servicios.almacen.title': 'Operaciones de almacén',
        'servicios.almacen.desc': 'Gestionamos tu inventario en nuestros almacenes de Los Ángeles y Zaragoza. Recepción, picking, packing y envío con seguimiento en tiempo real.',
        'servicios.ultimamilla.title': 'Última milla',
        'servicios.ultimamilla.desc': 'Red de 8 transportistas en EE.UU. y España. Asignación inteligente según destino, peso y urgencia. Tracking unificado para cada envío.',
        'servicios.logistica.title': 'Logística inversa',
        'servicios.logistica.desc': 'Gestión completa de devoluciones: aprobación, recogida, inspección asistida por IA y reacondicionamiento. Entre el 18 y 25% del volumen gestionado.',
        'servicios.cx.title': 'Atención al cliente',
        'servicios.cx.desc': '15 agentes en Los Ángeles y Zaragoza. Soporte B2B para marcas y B2C para consumidores finales en español e inglés.',
        'servicios.dashboards.title': 'Informes y dashboards',
        'servicios.dashboards.desc': 'Reportes PDF automáticos para clientes, dashboards de operaciones, rendimiento de transportistas y salud de cuenta.',
        'servicios.automatizacion.title': 'Automatización inteligente',
        'servicios.automatizacion.desc': 'Motores de aprobación automática, agentes CX para consultas frecuentes, inspección asistida por IA y recomendación de transportista.',

        /* Presencia */
        'presencia.title': 'Presencia internacional',
        'presencia.la.title': '🇺🇸 Los Ángeles, EE.UU.',
        'presencia.la.desc': 'Sede central y almacén principal. Fundada en 2009 por Thomas Harry.',
        'presencia.la.address': '📍 7423 S Alameda St, Los Angeles, CA 90001',
        'presencia.la.map': 'Ver en Google Maps',
        'presencia.zaragoza.title': '🇪🇸 Zaragoza, España',
        'presencia.zaragoza.desc': 'Oficina de tecnología liderada por el CTO Andrés Kim.',
        'presencia.zaragoza.address': '📍 Calle María Zambrano 31, 50018 Zaragoza',
        'presencia.zaragoza.map': 'Ver en Google Maps',

        /* Equipo */
        'equipo.title': 'Equipo directivo',

        /* Footer */
        'footer.tagline': 'Logística inteligente para e-commerce.',
        'footer.contacto': 'Contacto',
        'footer.enlaces': 'Enlaces',
        'footer.copyright': '© 2026 TrackFlow Logistics. Todos los derechos reservados.',

        /* Application page */
        'app.title': 'Empieza a enviar con TrackFlow',
        'app.subtitle': 'Cuéntanos sobre tu empresa y te enviaremos una propuesta personalizada en menos de 48 horas.',
        'app.success.title': '✅ ¡Solicitud enviada con éxito!',
        'app.success.desc': 'Gracias por confiar en TrackFlow. Nuestro equipo comercial se pondrá en contacto contigo en menos de 48 horas.',
        'app.success.back': 'Volver al inicio',

        /* Form - Company section */
        'form.company.legend': 'Datos de la empresa',
        'form.company.name': 'Nombre de la empresa *',
        'form.company.name.placeholder': 'Ej. Mi Tienda Online S.L.',
        'form.company.name.error': 'El nombre de la empresa es obligatorio (mín. 2 caracteres).',
        'form.company.contact': 'Persona de contacto *',
        'form.company.contact.placeholder': 'Ej. María López',
        'form.company.contact.error': 'El nombre de contacto es obligatorio.',
        'form.company.position': 'Cargo *',
        'form.company.position.placeholder': 'Ej. Directora de Operaciones',
        'form.company.position.error': 'El cargo es obligatorio.',
        'form.company.email': 'Correo electrónico corporativo *',
        'form.company.email.placeholder': 'ejemplo@miempresa.com',
        'form.company.email.error': 'Ingresa un correo electrónico válido.',
        'form.company.phone': 'Teléfono *',
        'form.company.phone.placeholder': '+1 213 555 0100',
        'form.company.phone.error': 'Ingresa un número de teléfono válido.',
        'form.company.country': 'País *',
        'form.company.country.placeholder': 'Selecciona tu país',
        'form.company.country.error': 'Selecciona un país.',
        'form.company.city': 'Ciudad *',
        'form.company.city.placeholder': 'Ej. Los Ángeles',
        'form.company.city.error': 'La ciudad es obligatoria.',

        /* Form - Business section */
        'form.business.legend': 'Información comercial',
        'form.business.volume': 'Volumen mensual estimado de pedidos *',
        'form.business.volume.placeholder': 'Ej. 5000',
        'form.business.volume.error': 'Ingresa un número de pedidos válido.',
        'form.business.volume.options': ['< 1.000', '1.000 - 5.000', '5.000 - 20.000', '20.000 - 100.000', '> 100.000'],
        'form.business.category': 'Categoría de productos *',
        'form.business.category.placeholder': 'Selecciona una categoría',
        'form.business.category.error': 'Selecciona una categoría.',
        'form.business.category.options': ['Moda y accesorios', 'Electrónica y tecnología', 'Hogar y jardín', 'Salud y belleza', 'Alimentación', 'Libros y papelería', 'Deportes y ocio', 'Automoción', 'Mascotas', 'Otros'],
        'form.business.platform': 'Plataforma de e-commerce *',
        'form.business.platform.placeholder': 'Selecciona una plataforma',
        'form.business.platform.error': 'Selecciona una plataforma.',
        'form.business.platform.options': ['Shopify', 'Magento / Adobe Commerce', 'WooCommerce', 'PrestaShop', 'Salesforce Commerce Cloud', 'BigCommerce', 'VTEX', 'Mercado Libre', 'Amazon', 'Tienda propia / CMS propio', 'Otra'],
        'form.business.provider': 'Proveedor logístico actual',
        'form.business.provider.placeholder': 'Ej. DHL, MRW, Ninguno...',

        /* Form - Services section */
        'form.services.legend': 'Servicios que necesitas',
        'form.services.warehouse': 'Operaciones de almacén',
        'form.services.lastmile': 'Última milla',
        'form.services.reverselogistics': 'Logística inversa',
        'form.services.cx': 'Atención al cliente (CX)',
        'form.services.reports': 'Informes y dashboards',
        'form.services.automation': 'Automatización inteligente',
        'form.services.error': 'Selecciona al menos un servicio.',

        /* Form - Additional section */
        'form.additional.legend': 'Información adicional',
        'form.additional.message': 'Cuéntanos sobre tus necesidades *',
        'form.additional.message.placeholder': 'Describe tu operación, volumen actual, desafíos logísticos y cualquier requisito especial (mín. 20 caracteres)',
        'form.additional.message.error': 'El mensaje debe tener al menos 20 caracteres.',
        'form.additional.referral': '¿Cómo nos conociste?',
        'form.additional.referral.placeholder': 'Selecciona una opción',
        'form.additional.referral.options': ['LinkedIn', 'Google', 'Recomendación de cliente', 'Feria / Evento', 'Redes sociales', 'Artículo / Blog', 'Otro'],

        /* Form - Terms */
        'form.terms.text': 'Acepto los',
        'form.terms.terms': 'términos y condiciones',
        'form.terms.and': 'y la',
        'form.terms.privacy': 'política de privacidad',
        'form.terms.suffix': '*',
        'form.terms.error': 'Debes aceptar los términos y condiciones.',

        /* Form - Buttons */
        'form.submit': 'Enviar solicitud',
        'form.submit.sending': 'Enviando...',
        'form.reset': 'Limpiar formulario',
    },

    en: {
        /* Header */
        'header.title': 'TrackFlow',
        'nav.inicio': 'Home',
        'nav.servicios': 'Services',
        'nav.presencia': 'Locations',
        'nav.equipo': 'Team',
        'nav.unete': 'Get Started',
        'nav.contacto': 'Contact',

        /* Hero */
        'hero.title': 'Smart logistics for your',
        'hero.title.highlight': 'e-commerce',
        'hero.subtitle': 'We store your inventory, prepare and pack orders, ship them through our carrier network, and manage returns. You focus on selling; we handle the logistics.',
        'hero.cta.primary': 'Work with us',
        'hero.cta.secondary': 'Our services',

        /* Servicios */
        'servicios.title': 'Our services',
        'servicios.almacen.title': 'Warehouse operations',
        'servicios.almacen.desc': 'We manage your inventory in our Los Angeles and Zaragoza warehouses. Receiving, picking, packing, and shipping with real-time tracking.',
        'servicios.ultimamilla.title': 'Last mile',
        'servicios.ultimamilla.desc': 'Network of 8 carriers in the US and Spain. Smart assignment based on destination, weight, and urgency. Unified tracking for every shipment.',
        'servicios.logistica.title': 'Reverse logistics',
        'servicios.logistica.desc': 'Complete returns management: approval, pickup, AI-assisted inspection, and refurbishment. Between 18% and 25% of managed volume.',
        'servicios.cx.title': 'Customer support',
        'servicios.cx.desc': '15 agents in Los Angeles and Zaragoza. B2B support for brands and B2C for end consumers in Spanish and English.',
        'servicios.dashboards.title': 'Reports & dashboards',
        'servicios.dashboards.desc': 'Automated PDF reports for clients, operations dashboards, carrier performance, and account health.',
        'servicios.automatizacion.title': 'Smart automation',
        'servicios.automatizacion.desc': 'Automatic approval engines, CX agents for FAQs, AI-assisted inspection, and carrier recommendation.',

        /* Presencia */
        'presencia.title': 'International presence',
        'presencia.la.title': '🇺🇸 Los Angeles, USA',
        'presencia.la.desc': 'Headquarters and main warehouse. Founded in 2009 by Thomas Harry.',
        'presencia.la.address': '📍 7423 S Alameda St, Los Angeles, CA 90001',
        'presencia.la.map': 'View on Google Maps',
        'presencia.zaragoza.title': '🇪🇸 Zaragoza, Spain',
        'presencia.zaragoza.desc': 'Technology office led by CTO Andrés Kim.',
        'presencia.zaragoza.address': '📍 Calle María Zambrano 31, 50018 Zaragoza',
        'presencia.zaragoza.map': 'View on Google Maps',

        /* Equipo */
        'equipo.title': 'Leadership team',

        /* Footer */
        'footer.tagline': 'Smart logistics for e-commerce.',
        'footer.contacto': 'Contact',
        'footer.enlaces': 'Links',
        'footer.copyright': '© 2026 TrackFlow Logistics. All rights reserved.',

        /* Application page */
        'app.title': 'Start shipping with TrackFlow',
        'app.subtitle': 'Tell us about your company and we\'ll send you a custom proposal within 48 hours.',
        'app.success.title': '✅ Request sent successfully!',
        'app.success.desc': 'Thank you for trusting TrackFlow. Our sales team will contact you within 48 hours.',
        'app.success.back': 'Back to home',

        /* Form - Company section */
        'form.company.legend': 'Company information',
        'form.company.name': 'Company name *',
        'form.company.name.placeholder': 'E.g. My Online Store LLC',
        'form.company.name.error': 'Company name is required (min. 2 characters).',
        'form.company.contact': 'Contact person *',
        'form.company.contact.placeholder': 'E.g. Maria Lopez',
        'form.company.contact.error': 'Contact name is required.',
        'form.company.position': 'Position / Role *',
        'form.company.position.placeholder': 'E.g. Operations Director',
        'form.company.position.error': 'Position is required.',
        'form.company.email': 'Corporate email *',
        'form.company.email.placeholder': 'hello@mycompany.com',
        'form.company.email.error': 'Enter a valid email address.',
        'form.company.phone': 'Phone *',
        'form.company.phone.placeholder': '+1 213 555 0100',
        'form.company.phone.error': 'Enter a valid phone number.',
        'form.company.country': 'Country *',
        'form.company.country.placeholder': 'Select your country',
        'form.company.country.error': 'Select a country.',
        'form.company.city': 'City *',
        'form.company.city.placeholder': 'E.g. Los Angeles',
        'form.company.city.error': 'City is required.',

        /* Form - Business section */
        'form.business.legend': 'Business information',
        'form.business.volume': 'Estimated monthly order volume *',
        'form.business.volume.placeholder': 'E.g. 5000',
        'form.business.volume.error': 'Enter a valid number of orders.',
        'form.business.volume.options': ['< 1,000', '1,000 - 5,000', '5,000 - 20,000', '20,000 - 100,000', '> 100,000'],
        'form.business.category': 'Product category *',
        'form.business.category.placeholder': 'Select a category',
        'form.business.category.error': 'Select a category.',
        'form.business.category.options': ['Fashion & accessories', 'Electronics & technology', 'Home & garden', 'Health & beauty', 'Food & beverages', 'Books & stationery', 'Sports & leisure', 'Automotive', 'Pets', 'Other'],
        'form.business.platform': 'E-commerce platform *',
        'form.business.platform.placeholder': 'Select a platform',
        'form.business.platform.error': 'Select a platform.',
        'form.business.platform.options': ['Shopify', 'Magento / Adobe Commerce', 'WooCommerce', 'PrestaShop', 'Salesforce Commerce Cloud', 'BigCommerce', 'VTEX', 'Mercado Libre', 'Amazon', 'Own / Custom CMS', 'Other'],
        'form.business.provider': 'Current logistics provider',
        'form.business.provider.placeholder': 'E.g. DHL, MRW, None...',

        /* Form - Services section */
        'form.services.legend': 'Services you need',
        'form.services.warehouse': 'Warehouse operations',
        'form.services.lastmile': 'Last mile delivery',
        'form.services.reverselogistics': 'Reverse logistics',
        'form.services.cx': 'Customer support (CX)',
        'form.services.reports': 'Reports & dashboards',
        'form.services.automation': 'Smart automation',
        'form.services.error': 'Select at least one service.',

        /* Form - Additional section */
        'form.additional.legend': 'Additional information',
        'form.additional.message': 'Tell us about your needs *',
        'form.additional.message.placeholder': 'Describe your operation, current volume, logistics challenges, and any special requirements (min. 20 characters)',
        'form.additional.message.error': 'Message must be at least 20 characters.',
        'form.additional.referral': 'How did you hear about us?',
        'form.additional.referral.placeholder': 'Select an option',
        'form.additional.referral.options': ['LinkedIn', 'Google', 'Client referral', 'Fair / Event', 'Social media', 'Article / Blog', 'Other'],

        /* Form - Terms */
        'form.terms.text': 'I accept the',
        'form.terms.terms': 'terms and conditions',
        'form.terms.and': 'and the',
        'form.terms.privacy': 'privacy policy',
        'form.terms.suffix': '*',
        'form.terms.error': 'You must accept the terms and conditions.',

        /* Form - Buttons */
        'form.submit': 'Send request',
        'form.submit.sending': 'Sending...',
        'form.reset': 'Clear form',
    }
};

let currentLang = localStorage.getItem('trackflow-lang') || 'es';

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('trackflow-lang', lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'es';
    translatePage();
    updateLangSwitcher(lang);
}

function t(key) {
    return i18n[currentLang]?.[key] || i18n['es']?.[key] || key;
}

function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.getAttribute('data-i18n-placeholder') === key) {
                el.placeholder = translation;
            }
        } else if (el.tagName === 'SELECT' && el.getAttribute('data-i18n-options')) {
            // Handled by specific logic
        } else if (el.tagName === 'OPTION') {
            el.textContent = translation;
        } else {
            // Handle innerHTML with highlights
            const highlightKey = key + '.highlight';
            if (i18n[currentLang]?.[highlightKey]) {
                el.innerHTML = translation + ' <span class="' + (el.querySelector('span')?.className || 'text-indigo-700') + '">' + t(highlightKey) + '</span>';
            } else {
                el.textContent = translation;
            }
        }
    });

    // Update error messages
    document.querySelectorAll('.error-msg[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        el.textContent = t(key);
    });
}

function updateLangSwitcher(lang) {
    document.querySelectorAll('.lang-switcher button').forEach(btn => {
        const code = btn.getAttribute('data-lang');
        if (code === lang) {
            btn.classList.add('bg-indigo-700', 'text-white');
            btn.classList.remove('text-gray-500', 'border', 'border-gray-300');
        } else {
            btn.classList.remove('bg-indigo-700', 'text-white');
            btn.classList.add('text-gray-500', 'border', 'border-gray-300');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setLang(currentLang);
});