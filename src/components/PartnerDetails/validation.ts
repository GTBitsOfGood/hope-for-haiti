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

const isEmpty = (value: unknown, fieldType: string): boolean => {
  if (fieldType === "multiselect") {
    return !Array.isArray(value) || value.length === 0;
  } else if (fieldType === "boolean") {
    return value === undefined || value === null;
  } else if (fieldType === "number") {
    return (
      value === undefined ||
      value === null ||
      (typeof value === "number" && isNaN(value))
    );
  } else {
    return !value || (typeof value === "string" && value.trim() === "");
  }
};

const isConditionallyRequired = (
  field: { conditionalField?: string; conditionalValue?: unknown },
  data: NestedObject
): boolean => {
  if (!field.conditionalField || field.conditionalValue === undefined) {
    return false;
  }

  const conditionalFieldValue = getNestedValue(data, field.conditionalField);
  return conditionalFieldValue === field.conditionalValue;
};

export const validatePartnerStep = (
  step: number,
  data: NestedObject
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const stepFields = stepFieldConfigs[step] || [];

  stepFields.forEach((field) => {
    const shouldValidate =
      field.required || isConditionallyRequired(field, data);

    if (shouldValidate) {
      if (field.conditionalField) {
        if (!isConditionallyRequired(field, data)) {
          return;
        }
      }

      const value = getNestedValue(data, field.name);

      if (isEmpty(value, field.type)) {
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
