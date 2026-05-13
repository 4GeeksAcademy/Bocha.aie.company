/**
 * Brasaland — Registration Form Validation
 * validation.js
 *
 * Real-time validation on blur/input and full validation on submit.
 * Bilingual error messages (ES/EN) driven by data-lang attributes.
 */

(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────────

  /** Return current language from the toggle system */
  function lang() {
    return typeof currentLang !== 'undefined' ? currentLang : 'es';
  }

  /** Show an error message next to a field */
  function showError(field, msgEs, msgEn) {
    const errorEl = field.parentElement.querySelector('.error-message')
      || field.closest('div').querySelector('.error-message');
    if (!errorEl) return;

    errorEl.setAttribute('data-lang-es', msgEs);
    errorEl.setAttribute('data-lang-en', msgEn);
    errorEl.textContent = lang() === 'es' ? msgEs : msgEn;
    errorEl.classList.remove('hidden');

    field.classList.remove('border-carbon-300', 'border-green-400');
    field.classList.add('border-ember-500');
    field.setAttribute('aria-invalid', 'true');
  }

  /** Clear the error message next to a field */
  function clearError(field) {
    const errorEl = field.parentElement.querySelector('.error-message')
      || field.closest('div').querySelector('.error-message');
    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }

    field.classList.remove('border-ember-500');
    field.setAttribute('aria-invalid', 'false');
  }

  /** Mark field as valid (green border) */
  function markValid(field) {
    clearError(field);
    field.classList.remove('border-carbon-300', 'border-ember-500');
    field.classList.add('border-green-400');
  }

  // ── Field Validators ────────────────────────────────────────
  // Each returns true if valid, false otherwise (and shows error).

  function validateDocumentType() {
    const el = document.getElementById('document-type');
    if (!el.value) {
      showError(el, 'Seleccioná un tipo de documento.', 'Please select a document type.');
      return false;
    }
    markValid(el);
    return true;
  }

  function validateDocumentNumber() {
    const el = document.getElementById('document-number');
    const val = el.value.trim();
    if (!val) {
      showError(el, 'Ingresá tu número de documento.', 'Please enter your document number.');
      return false;
    }
    if (val.length < 3) {
      showError(el, 'El número de documento debe tener al menos 3 caracteres.', 'Document number must be at least 3 characters.');
      return false;
    }
    markValid(el);
    return true;
  }

  function validateFirstName() {
    const el = document.getElementById('first-name');
    const val = el.value.trim();
    if (!val) {
      showError(el, 'Ingresá tu nombre.', 'Please enter your first name.');
      return false;
    }
    if (val.length < 2) {
      showError(el, 'El nombre debe tener al menos 2 caracteres.', 'First name must be at least 2 characters.');
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(val)) {
      showError(el, 'El nombre solo puede contener letras.', 'First name can only contain letters.');
      return false;
    }
    markValid(el);
    return true;
  }

  function validateLastName() {
    const el = document.getElementById('last-name');
    const val = el.value.trim();
    if (!val) {
      showError(el, 'Ingresá tu apellido.', 'Please enter your last name.');
      return false;
    }
    if (val.length < 2) {
      showError(el, 'El apellido debe tener al menos 2 caracteres.', 'Last name must be at least 2 characters.');
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(val)) {
      showError(el, 'El apellido solo puede contener letras.', 'Last name can only contain letters.');
      return false;
    }
    markValid(el);
    return true;
  }

  function validateEmail() {
    const el = document.getElementById('email');
    const val = el.value.trim();
    if (!val) {
      showError(el, 'Ingresá tu correo electrónico.', 'Please enter your email address.');
      return false;
    }
    // Standard email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(val)) {
      showError(el, 'Ingresá un correo electrónico válido.', 'Please enter a valid email address.');
      return false;
    }
    markValid(el);
    return true;
  }

  function validatePhone() {
    const el = document.getElementById('phone');
    const val = el.value.trim();
    if (!val) {
      showError(el, 'Ingresá tu número de teléfono.', 'Please enter your phone number.');
      return false;
    }
    // Strip common formatting chars, check for at least 7 digits
    const digits = val.replace(/[\s\-\(\)\+\.]/g, '');
    if (!/^\d{7,15}$/.test(digits)) {
      showError(el, 'Ingresá un número de teléfono válido (mínimo 7 dígitos).', 'Please enter a valid phone number (minimum 7 digits).');
      return false;
    }
    markValid(el);
    return true;
  }

  function validateBirthdate() {
    const el = document.getElementById('birthdate');
    const val = el.value;
    if (!val) {
      showError(el, 'Ingresá tu fecha de nacimiento.', 'Please enter your date of birth.');
      return false;
    }
    const birthDate = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 16) {
      showError(el, 'Debés tener al menos 16 años para registrarte.', 'You must be at least 16 years old to register.');
      return false;
    }
    if (age > 120) {
      showError(el, 'Ingresá una fecha de nacimiento válida.', 'Please enter a valid date of birth.');
      return false;
    }
    markValid(el);
    return true;
  }

  function validateAddress() {
    const el = document.getElementById('address');
    const val = el.value.trim();
    if (!val) {
      showError(el, 'Ingresá tu dirección.', 'Please enter your address.');
      return false;
    }
    if (val.length < 5) {
      showError(el, 'La dirección debe tener al menos 5 caracteres.', 'Address must be at least 5 characters.');
      return false;
    }
    markValid(el);
    return true;
  }

  function validateCity() {
    const el = document.getElementById('city');
    const val = el.value.trim();
    if (!val) {
      showError(el, 'Ingresá tu ciudad.', 'Please enter your city.');
      return false;
    }
    if (val.length < 2) {
      showError(el, 'La ciudad debe tener al menos 2 caracteres.', 'City must be at least 2 characters.');
      return false;
    }
    markValid(el);
    return true;
  }

  function validateCountry() {
    const el = document.getElementById('country');
    if (!el.value) {
      showError(el, 'Seleccioná un país.', 'Please select a country.');
      return false;
    }
    markValid(el);
    return true;
  }

  /** Update password rule indicators in real-time */
  function updatePasswordRules(value) {
    const rules = {
      'rule-length': value.length >= 8,
      'rule-upper': /[A-Z]/.test(value),
      'rule-lower': /[a-z]/.test(value),
      'rule-number': /\d/.test(value),
    };

    for (const [id, passed] of Object.entries(rules)) {
      const el = document.getElementById(id);
      if (!el) continue;
      const icon = el.querySelector('.rule-icon');
      if (passed) {
        el.classList.remove('text-carbon-400', 'text-ember-500');
        el.classList.add('text-green-600');
        if (icon) icon.textContent = '✓';
      } else {
        el.classList.remove('text-green-600', 'text-ember-500');
        el.classList.add('text-carbon-400');
        if (icon) icon.textContent = '○';
      }
    }
  }

  function validatePassword() {
    const el = document.getElementById('password');
    const val = el.value;

    updatePasswordRules(val);

    if (!val) {
      showError(el, 'Ingresá una contraseña.', 'Please enter a password.');
      return false;
    }
    if (val.length < 8) {
      showError(el, 'La contraseña debe tener al menos 8 caracteres.', 'Password must be at least 8 characters.');
      return false;
    }
    if (!/[A-Z]/.test(val)) {
      showError(el, 'La contraseña debe contener al menos una letra mayúscula.', 'Password must contain at least one uppercase letter.');
      return false;
    }
    if (!/[a-z]/.test(val)) {
      showError(el, 'La contraseña debe contener al menos una letra minúscula.', 'Password must contain at least one lowercase letter.');
      return false;
    }
    if (!/\d/.test(val)) {
      showError(el, 'La contraseña debe contener al menos un número.', 'Password must contain at least one number.');
      return false;
    }
    markValid(el);

    // Also re-validate confirm if it has a value
    const confirmEl = document.getElementById('confirm-password');
    if (confirmEl.value) {
      validateConfirmPassword();
    }

    return true;
  }

  function validateConfirmPassword() {
    const el = document.getElementById('confirm-password');
    const passwordEl = document.getElementById('password');
    const val = el.value;

    if (!val) {
      showError(el, 'Confirmá tu contraseña.', 'Please confirm your password.');
      return false;
    }
    if (val !== passwordEl.value) {
      showError(el, 'Las contraseñas no coinciden.', 'Passwords do not match.');
      return false;
    }
    markValid(el);
    return true;
  }

  // ── Real-time Validation Bindings ───────────────────────────

  const validationMap = {
    'document-type': { event: 'change', validator: validateDocumentType },
    'document-number': { event: 'blur', validator: validateDocumentNumber },
    'first-name': { event: 'blur', validator: validateFirstName },
    'last-name': { event: 'blur', validator: validateLastName },
    'email': { event: 'blur', validator: validateEmail },
    'phone': { event: 'blur', validator: validatePhone },
    'birthdate': { event: 'change', validator: validateBirthdate },
    'address': { event: 'blur', validator: validateAddress },
    'city': { event: 'blur', validator: validateCity },
    'country': { event: 'change', validator: validateCountry },
    'password': { event: 'input', validator: validatePassword },
    'confirm-password': { event: 'blur', validator: validateConfirmPassword },
  };

  // Bind validators to fields
  for (const [id, config] of Object.entries(validationMap)) {
    const el = document.getElementById(id);
    if (!el) continue;

    el.addEventListener(config.event, config.validator);

    // Also validate on blur for input-event fields (password)
    if (config.event === 'input') {
      el.addEventListener('blur', config.validator);
    }
  }

  // Password real-time rule updates on every keystroke
  const passwordField = document.getElementById('password');
  if (passwordField) {
    passwordField.addEventListener('input', function () {
      updatePasswordRules(this.value);
    });
  }

  // ── Form Submit ─────────────────────────────────────────────

  window.handleSubmit = function () {
    // Run all validators
    const results = [
      validateDocumentType(),
      validateDocumentNumber(),
      validateFirstName(),
      validateLastName(),
      validateEmail(),
      validatePhone(),
      validateBirthdate(),
      validateAddress(),
      validateCity(),
      validateCountry(),
      validatePassword(),
      validateConfirmPassword(),
    ];

    const allValid = results.every(Boolean);

    if (!allValid) {
      // Scroll to first error
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    // All valid — show success message
    document.getElementById('form-container').classList.add('hidden');
    const successMsg = document.getElementById('success-message');
    successMsg.classList.remove('hidden');
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Announce to screen readers
    successMsg.setAttribute('role', 'alert');
  };

  // ── Form Reset ──────────────────────────────────────────────

  window.handleReset = function () {
    const fields = [
      'document-type', 'document-number', 'first-name', 'last-name',
      'email', 'phone', 'birthdate', 'address', 'city', 'country',
      'password', 'confirm-password'
    ];

    fields.forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;

      if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else {
        el.value = '';
      }

      el.classList.remove('border-ember-500', 'border-green-400');
      el.classList.add('border-carbon-300');
      el.setAttribute('aria-invalid', 'false');
    });

    // Hide all error messages
    document.querySelectorAll('.error-message').forEach(function (el) {
      el.classList.add('hidden');
      el.textContent = '';
    });

    // Reset password rules
    updatePasswordRules('');

    // Hide success, show form
    document.getElementById('success-message').classList.add('hidden');
    document.getElementById('form-container').classList.remove('hidden');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
})();
