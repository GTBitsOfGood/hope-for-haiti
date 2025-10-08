export type FormDataRecord = Record<string, FormDataEntryValue | undefined>;

export function formDataToObject<T extends Record<string, unknown> = FormDataRecord>(
  formData: FormData
): T {
  const entries: [string, FormDataEntryValue | undefined][] = [];

  formData.forEach((value, key) => {
    entries.push([key, value ?? undefined]);
  });

  return Object.fromEntries(entries) as T;
}
