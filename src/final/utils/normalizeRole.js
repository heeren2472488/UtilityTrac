/**
 * Normalise a raw backend role string to one of the canonical frontend role keys.
 *
 * The backend may return values like:
 *   "ADMIN", "UTILITY ADMIN", "UTILITIES ADMIN"
 *   "OPERATION PLANNER", "OPERATIONS PLANNER"
 *   "TECHNICIAN", "FIELD TECHNICIAN"
 *   "CONTROL ROOM OPERATOR", "CONTOR ROOM OPERATOR", "CONTROLLER"
 *   "BILLING AND CUSTOMER OPS", "BILLING CUSTOMERS OPS", "BILLING"
 *   "REGULATORY ANALYST", "REGULATORY"
 *
 * Returns one of: 'ADMIN' | 'PLANNER' | 'TECHNICIAN' | 'CONTROLLER' |
 *                 'CONTROL_ROOM' | 'BILLING' | 'REGULATORY' | null
 */
export function normalizeRole(raw) {
  if (!raw) return null;
  const candidate =
    typeof raw === 'object'
      ? (raw.authority ?? raw.roleName ?? raw.role ?? raw.name ?? raw.value ?? '')
      : raw;

  let r = String(candidate).toUpperCase().trim().replace(/[\s-]+/g, '_');
  if (!r) return null;

  // Spring-style authority prefix support.
  if (r.startsWith('ROLE_')) r = r.slice(5);

  // Check specific role families first to avoid accidental matches.
  if (r.includes('PLANNER')) return 'PLANNER';
  if (r.includes('TECHNICIAN') || r === 'FIELD_TECH') return 'TECHNICIAN';
  if (r.includes('CONTROL_ROOM') || r.includes('CONTOR_ROOM')) return 'CONTROL_ROOM';
  if (r === 'CONTROLLER') return 'CONTROLLER';
  if (r.includes('BILLING')) return 'BILLING';
  if (r.includes('REGULATORY')) return 'REGULATORY';

  // Admin mappings should be explicit, not broad `UTIL*` checks.
  if (
    r === 'ADMIN' ||
    r === 'SUPER' ||
    r === 'SUPER_ADMIN' ||
    r === 'UTILITY_ADMIN' ||
    r === 'UTILITIES_ADMIN' ||
    r === 'UTILITRACK_ADMIN'
  ) {
    return 'ADMIN';
  }

  return null;
}

/**
 * Given a user's roles array (raw from backend), return an array of
 * all canonical role keys.
 */
export function normalizeRoles(rawRoles = []) {
  let source = rawRoles;

  // Support string payloads like "['OPERATIONS PLANNER']" or "ADMIN,PLANNER".
  if (typeof source === 'string') {
    source = source
      .replaceAll('[', '')
      .replaceAll(']', '')
      .replace(/["']/g, '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  // Support payloads like { roles: [...] }.
  if (!Array.isArray(source) && source && typeof source === 'object' && Array.isArray(source.roles)) {
    source = source.roles;
  }

  if (!Array.isArray(source)) {
    source = source ? [source] : [];
  }

  const seen = new Set();
  const result = [];
  for (const r of source) {
    const norm = normalizeRole(r);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result;
}
