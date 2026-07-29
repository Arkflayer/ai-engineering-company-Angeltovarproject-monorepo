/* =========================================
   validation.js - Validación del formulario
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('applicationForm');
    const successMsg = document.getElementById('successMessage');
    const resetBtn = document.getElementById('resetBtn');

    if (!form) return;

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
            case 'nombre': {
                const val = field.value.trim();
                if (!val || val.length < 2) valid = false;
                break;
            }
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
            case 'mensaje': {
                const val = field.value.trim();
                if (!val || val.length < 20) valid = false;
                break;
            }
            case 'disponibilidad': {
                if (!field.value) valid = false;
                break;
            }
            case 'terminos': {
                if (!field.checked) valid = false;
                break;
            }
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

        const fieldsToValidate = [
            'nombre', 'email', 'telefono', 'pais', 'ciudad',
            'departamento', 'experiencia', 'mensaje', 'disponibilidad', 'terminos'
        ];

        fieldsToValidate.forEach(id => {
            if (!validateField(id)) isValid = false;
        });

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
            btn.textContent = 'Enviando...';

            setTimeout(() => {
                form.classList.add('hidden');
                successMsg.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'Enviar aplicación';
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

});