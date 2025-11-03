import { ComponentProps } from "react";
import Select, { GroupBase } from "react-select";

/**
 * Select from react-select with default styling.
 */
export default function ConfiguredSelect<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: ComponentProps<typeof Select<Option, IsMulti, Group>>) {
  return (
    <Select
      className="react-select-container"
      classNamePrefix="react-select"
      styles={{
        control: (provided, state) => ({
          ...provided,
          backgroundColor: "#f9fafb",
          borderColor: state.isFocused ? "#ef4444" : "#d1d5db",
          boxShadow: state.isFocused
            ? "0 0 0 2px rgba(239, 68, 68, 0.2)"
            : "none",
          "&:hover": {
            borderColor: state.isFocused ? "#ef4444" : "#d1d5db",
          },
        }),
      }}
      {...props}
    />
  );
}
