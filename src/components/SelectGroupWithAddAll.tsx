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
    <div className="w-full text-left flex gap-2 justify-between">
      <span>{titleCase(data.label)}</span>
      <button
        onClick={() => addOptions(data.options.map((option) => option.value))}
        className="hover:text-blue-primary"
      >
        (add all)
      </button>
    </div>
  );
}
