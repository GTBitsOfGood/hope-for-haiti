export type FilterValue =
  | { type: "string"; value: string }
  | { type: "number"; gte: number; lte?: number }
  | { type: "date"; gte: string; lte?: string } // ISO strings
  | { type: "enum"; values: string[] };

export type Filters<TKey = Record<string, unknown>> = Partial<
  Record<keyof TKey, FilterValue>
>;
