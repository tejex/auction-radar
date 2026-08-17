import { HeaderSelect } from "./HeaderSelect"
import { TIME_WINDOWS, type TimeWindow } from "./tableTypes"

type WindowSelectProps = {
  ariaLabel: string
  onChange: (value: TimeWindow) => void
  suffix: string
  value: TimeWindow
}

export const WindowSelect = ({
  ariaLabel,
  onChange,
  suffix,
  value,
}: WindowSelectProps) => (
  <HeaderSelect
    ariaLabel={ariaLabel}
    onChange={onChange}
    options={TIME_WINDOWS.map<{ label: string; value: TimeWindow }>(window => ({
      label: `${window} ${suffix}`,
      value: window,
    }))}
    value={value}
  />
)
