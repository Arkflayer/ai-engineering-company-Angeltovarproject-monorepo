/* =========================================
   validation.js - Validación de formularios
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       Soporte para ambos formularios
       ========================================= */

    const forms = [
        { id: 'applicationForm', type: 'jobs' },
        { id: 'clientForm', type: 'clients' }
    ];

    forms.forEach(({ id, type }) => {
        const form = document.getElementById(id);
        if (!form) return;

        const successMsg = document.getElementById('successMessage');
        const resetBtn = document.getElementById('resetBtn');

        /* =========================================
           Utilidades de error
           ========================================= */

        function showError(fieldId) {
            const input = document.getElementById(fieldId);
            const errorSpan = document.querySelector(`.error-msg[data-field="${fieldId}"]`);
            if (input) input.classList.add('input-error');
            if (errorSpan) {
                errorSpan.classList.remove('hidden');
                errorSpan.classList.add('visible');
            }
        }

        function clearError(fieldId) {
            const input = document.getElementById(fieldId);
            const errorSpan = document.querySelector(`.error-msg[data-field="${fieldId}"]`);
            if (input) input.classList.remove('input-error');
            if (errorSpan) {
                errorSpan.classList.add('hidden');
                errorSpan.classList.remove('visible');
            }
        }

        function clearAllErrors() {
            document.querySelectorAll('.error-msg').forEach(el => {
                el.classList.add('hidden');
                el.classList.remove('visible');
            });
            document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        }

        /* =========================================
           Validación de un solo campo
           ========================================= */

        function validateField(fieldId) {
            const field = document.getElementById(fieldId);
            if (!field) return true;

            let valid = true;

            switch (fieldId) {
                /* --- Campos comunes --- */
                case 'email': {
                    const val = field.value.trim();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!val || !emailRegex.test(val)) valid = false;
                    break;
                }
                case 'telefono': {
                    const val = field.value.trim();
                    const telRegex = /^[\d\s\-\+\(\)]{7,20}$/;
                    if (!val || !telRegex.test(val)) valid = false;
                    break;
                }
                case 'pais': {
                    if (!field.value) valid = false;
                    break;
                }
                case 'ciudad': {
                    const val = field.value.trim();
                    if (!val || val.length < 2) valid = false;
                    break;
                }
                case 'mensaje': {
                    const val = field.value.trim();
                    if (!val || val.length < 20) valid = false;
                    break;
                }
                case 'terminos': {
                    if (!field.checked) valid = false;
                    break;
                }

                /* --- Campos formulario de empleo (jobs) --- */
                case 'nombre': {
                    const val = field.value.trim();
                    if (!val || val.length < 2) valid = false;
                    break;
                }
                case 'departamento': {
                    if (!field.value) valid = false;
                    break;
                }
                case 'experiencia': {
                    const val = field.value;
                    const num = parseInt(val, 10);
                    if (!val || isNaN(num) || num < 0 || num > 50) valid = false;
                    break;
                }
                case 'url': {
                    const val = field.value.trim();
                    if (val && !/^https?:\/\/.+/.test(val)) valid = false;
                    break;
                }
                case 'disponibilidad': {
                    if (!field.value) valid = false;
                    break;
                }

                /* --- Campos formulario de clientes (clients) --- */
                case 'empresa': {
                    const val = field.value.trim();
                    if (!val || val.length < 2) valid = false;
                    break;
                }
                case 'contacto': {
                    const val = field.value.trim();
                    if (!val || val.length < 2) valid = false;
                    break;
                }
                case 'cargo': {
                    const val = field.value.trim();
                    if (!val || val.length < 2) valid = false;
                    break;
                }
                case 'volumen': {
                    if (!field.value) valid = false;
                    break;
                }
                case 'categoria': {
                    if (!field.value) valid = false;
                    break;
                }
                case 'plataforma': {
                    if (!field.value) valid = false;
                    break;
                }
                /* 'servicios' se valida por separado en validateForm() */
            }

            if (valid) {
                clearError(fieldId);
            } else {
                showError(fieldId);
            }
            return valid;
        }

        /* =========================================
           Validación completa del formulario
           ========================================= */

        function validateForm() {
            let isValid = true;
            clearAllErrors();

            let fieldsToValidate;
            if (type === 'jobs') {
                fieldsToValidate = [
                    'nombre', 'email', 'telefono', 'pais', 'ciudad',
                    'departamento', 'experiencia', 'mensaje', 'disponibilidad', 'terminos'
                ];
            } else {
                fieldsToValidate = [
                    'empresa', 'contacto', 'cargo', 'email', 'telefono', 'pais', 'ciudad',
                    'volumen', 'categoria', 'plataforma',
                    'mensaje', 'terminos'
                ];
            }

            fieldsToValidate.forEach(id => {
                if (!validateField(id)) isValid = false;
            });

            /* Validación especial: checkboxes de servicios (sin ID) */
            if (type === 'clients') {
                const serviciosChecked = document.querySelectorAll('input[name="servicios"]:checked');
                if (serviciosChecked.length === 0) {
                    isValid = false;
                    const errorSpan = document.querySelector('.error-msg[data-field="servicios"]');
                    if (errorSpan) {
                        errorSpan.classList.remove('hidden');
                        errorSpan.classList.add('visible');
                    }
                } else {
                    const errorSpan = document.querySelector('.error-msg[data-field="servicios"]');
                    if (errorSpan) {
                        errorSpan.classList.add('hidden');
                        errorSpan.classList.remove('visible');
                    }
                }
            }

            return isValid;
        }

        /* =========================================
           Evento submit
           ========================================= */

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (validateForm()) {
                const btn = form.querySelector('button[type="submit"]');
                btn.disabled = true;
                const sendingText = type === 'clients' ? 'Enviando...' : 'Enviando...';
                btn.textContent = sendingText;

                setTimeout(() => {
                    form.classList.add('hidden');
                    successMsg.classList.remove('hidden');
                    btn.disabled = false;
                    btn.textContent = type === 'clients' ? 'Enviar solicitud' : 'Enviar aplicación';
                }, 800);
            }
        });

        /* =========================================
           Botón de limpiar / reset
           ========================================= */

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                form.reset();
                clearAllErrors();
                successMsg.classList.add('hidden');
                form.classList.remove('hidden');
            });
        }

        /* =========================================
           Validación en blur (al perder el foco)
           ========================================= */

        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => {
                if (field.id) validateField(field.id);
            });
        });

        /* =========================================
           Validación en tiempo real (al escribir)
           ========================================= */

        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('input', () => {
                if (field.id) validateField(field.id);
            });
            field.addEventListener('change', () => {
                if (field.id) validateField(field.id);
            });
        });

        /* Validación en tiempo real para checkboxes de servicios */
        if (type === 'clients') {
            document.querySelectorAll('input[name="servicios"]').forEach(cb => {
                cb.addEventListener('change', () => {
                    const checked = document.querySelectorAll('input[name="servicios"]:checked');
                    const errorSpan = document.querySelector('.error-msg[data-field="servicios"]');
                    if (checked.length > 0) {
                        if (errorSpan) {
                            errorSpan.classList.add('hidden');
                            errorSpan.classList.remove('visible');
                        }
                    } else {
                        if (errorSpan) {
                            errorSpan.classList.remove('hidden');
                            errorSpan.classList.add('visible');
                        }
                    }
                });
            });
        }
    });

});