import { palette } from "@/app/palette"

type HeaderSelectOption<T extends string> = {
  label: string
  value: T
}

type HeaderSelectProps<T extends string> = {
  ariaLabel: string
  onChange: (value: T) => void
  options: readonly HeaderSelectOption<T>[]
  value: T
}

export const HeaderSelect = <T extends string,>({
  ariaLabel,
  onChange,
  options,
  value,
}: HeaderSelectProps<T>) => (
  <select
    aria-label={ariaLabel}
    className="cursor-pointer rounded-md border px-1.5 py-1 outline-none"
    onChange={event => onChange(event.target.value as T)}
    onClick={event => event.stopPropagation()}
    style={{
      backgroundColor: palette.table.controlBackground,
      borderColor: palette.table.border,
      color: palette.table.text,
    }}
    value={value}
  >
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
)
