import { stepFieldConfigs } from "./fieldConfigs";

type NestedObject = Record<string, unknown>;

export const getNestedValue = (obj: NestedObject, path: string): unknown => {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as NestedObject)[key];
    }
    return undefined;
  }, obj as unknown);
};

export const setNestedValue = <T extends NestedObject>(
  obj: T,
  path: string,
  value: unknown
): T => {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    return current[key] as NestedObject;
  }, obj as NestedObject);
  target[lastKey] = value;
  return { ...obj };
};

export const validatePartnerStep = (
  step: number,
  data: NestedObject
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const stepFields = stepFieldConfigs[step] || [];

  stepFields.forEach((field) => {
    if (field.required) {
      const value = getNestedValue(data, field.name);

      let isEmpty = false;

      if (field.type === "multiselect") {
        isEmpty = !Array.isArray(value) || value.length === 0;
      } else if (field.type === "boolean") {
        isEmpty = value === undefined || value === null;
      } else {
        isEmpty = !value || (typeof value === "string" && value.trim() === "");
      }

      if (isEmpty) {
        errors[field.name] = `${field.label} is required`;
      }
    }
  });

  return errors;
};

export const validateAllPartnerFields = (
  data: NestedObject
): Record<string, string> => {
  let allErrors: Record<string, string> = {};

  for (let step = 1; step <= 10; step++) {
    const stepErrors = validatePartnerStep(step, data);
    allErrors = { ...allErrors, ...stepErrors };
  }

  return allErrors;
};
