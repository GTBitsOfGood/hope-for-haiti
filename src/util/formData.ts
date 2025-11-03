export type FormDataRecord = Record<
  string,
  FormDataEntryValue | FormDataEntryValue[] | undefined
>;

export function formDataToObject<T extends Record<string, unknown> = FormDataRecord>(
  formData: FormData
): T {
  const obj: Record<string, FormDataEntryValue | FormDataEntryValue[] | undefined> = {};

  formData.forEach((value, key) => {
    const isArrayKey = key.endsWith("[]");
    const actualKey = isArrayKey ? key.slice(0, -2) : key;

    if (isArrayKey) {
      if (!Array.isArray(obj[actualKey])) {
        obj[actualKey] = [];
      }
      (obj[actualKey] as FormDataEntryValue[]).push(value);
    } else {
      obj[actualKey] = value ?? undefined;
    }
  });

  return obj as T;
}
