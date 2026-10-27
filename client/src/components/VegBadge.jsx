/** Standard Indian food marking: green square-dot for vegetarian, brown triangle for non-vegetarian. */
export function VegBadge({ isVeg, withText = false }) {
  const label = isVeg ? 'Vegetarian' : 'Non-vegetarian';
  return (
    <span className={`veg-badge ${isVeg ? 'veg' : 'nonveg'}`} title={label}>
      <span className="veg-mark" aria-hidden="true">
        {isVeg ? <span className="veg-dot" /> : <span className="veg-tri" />}
      </span>
      {withText ? <span className="veg-text">{isVeg ? 'Veg' : 'Non-veg'}</span> : <span className="visually-hidden">{label}</span>}
    </span>
  );
}
