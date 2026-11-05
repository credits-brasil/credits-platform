import { cn } from "@/lib/utils";

type FilterCheckboxProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
  labelClassName?: string;
  labelFirst?: boolean;
  disabled?: boolean;
  title?: string;
};

export function FilterCheckboxComponent({
  checked,
  onChange,
  label,
  className,
  labelClassName,
  labelFirst = false,
  disabled = false,
  title,
}: FilterCheckboxProps) {
  const labelNode = (
    <span
      className={cn(
        "text-sm text-gray-600 transition-colors",
        !disabled && "group-hover:text-gray-800",
        labelClassName,
      )}
    >
      {label}
    </span>
  );

  return (
    <label
      title={title}
      aria-disabled={disabled || undefined}
      className={cn(
        "flex items-center gap-2.5 group",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="hidden"
      />

      {labelFirst && labelNode}

      <span
        className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all"
        style={{
          backgroundColor: checked ? "#243871" : "white",
          borderColor: checked ? "#243871" : "#d1d5db",
        }}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path
              d="M1 3.5L3.5 6L8 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {!labelFirst && labelNode}
    </label>
  );
}