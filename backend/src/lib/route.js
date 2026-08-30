/** Trimite erorile din handler-ele asincrone catre middleware-ul de erori. */
export const route = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export const PHONE_PATTERN = /^[+]?[0-9 ().-]{9,20}$/;
export const EMAIL_PATTERN = /^[^@ ]+@[^@ ]+[.][^@ ]+$/;
export const DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

/** Verifica un obiect dupa un set de reguli simple si returneaza erorile pe campuri. */
export function validate(body = {}, rules) {
  const errors = {};
  const value = {};

  for (const [field, rule] of Object.entries(rules)) {
    const raw = String(body[field] ?? '').trim();
    value[field] = raw;

    if (rule.required && !raw) {
      errors[field] = rule.messages?.required ?? 'Acest câmp este obligatoriu.';
      continue;
    }
    if (!raw) continue;
    if (rule.min && raw.length < rule.min) {
      errors[field] = rule.messages?.min ?? `Minim ${rule.min} caractere.`;
      continue;
    }
    if (rule.max && raw.length > rule.max) {
      errors[field] = rule.messages?.max ?? `Maxim ${rule.max} caractere.`;
      continue;
    }
    if (rule.pattern && !rule.pattern.test(raw)) {
      errors[field] = rule.messages?.pattern ?? 'Valoare invalidă.';
    }
  }

  return { errors, value, ok: Object.keys(errors).length === 0 };
}
