export function QuantityStepper({ value, onChange, min = 1, max = 20, label = 'Quantity', size = 'md' }) {
  return (
    <div className={`stepper stepper-${size}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
        −
      </button>
      <output aria-live="polite" aria-label={label}>
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
        +
      </button>
    </div>
  );
}
