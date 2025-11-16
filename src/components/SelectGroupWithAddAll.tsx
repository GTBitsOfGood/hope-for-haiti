import { titleCase } from "@/util/util";

export default function SelectGroupWithAddAll<T>({
  data,
  addOptions,
}: {
  data: {
    label: string;
    options: {
      label: string;
      value: T;
    }[];
  };
  addOptions: (options: T[]) => void;
}) {
  return (
    <button
      onClick={() => addOptions(data.options.map((option) => option.value))}
      className="group w-full text-left flex gap-2"
    >
      <span>{titleCase(data.label)}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-100">
        (click to add all)
      </span>
    </button>
  );
}
