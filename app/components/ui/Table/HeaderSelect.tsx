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
  <span className="relative inline-flex">
    <select
      aria-label={ariaLabel}
      className="cursor-pointer appearance-none rounded-md border py-0.5 pr-4 pl-1 text-[0.6875rem] outline-none sm:pr-5 sm:text-xs min-[112rem]:py-1 min-[112rem]:pr-7 min-[112rem]:pl-1.5 min-[112rem]:text-sm"
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

    <svg
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-1 size-2.5 -translate-y-1/2 sm:right-1.5 sm:size-3 min-[112rem]:right-2 min-[112rem]:size-3.5"
      fill="none"
      style={{ color: palette.table.text }}
      viewBox="0 0 20 20"
    >
      <path
        d="m5 7.5 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  </span>
)
