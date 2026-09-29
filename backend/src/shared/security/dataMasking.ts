type JsonRecord = Record<string, unknown>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Removes configured dot-path fields before records are sent to AI features. */
export const maskSensitiveFields = <T extends JsonRecord>(record: T, fieldPaths: string[]): T => {
  const masked = clone(record);

  const maskPath = (target: unknown, parts: string[]): void => {
    if (Array.isArray(target)) {
      target.forEach((item) => maskPath(item, parts));
      return;
    }
    if (!target || typeof target !== 'object' || parts.length === 0) return;
    const [key, ...rest] = parts;
    const object = target as JsonRecord;
    if (rest.length === 0) {
      if (key in object) object[key] = '[REDACTED]';
      return;
    }
    maskPath(object[key], rest);
  };

  fieldPaths.forEach((fieldPath) => maskPath(masked, fieldPath.split('.').filter(Boolean)));
  return masked;
};

