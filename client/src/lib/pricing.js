// Client-side price *estimate* used while browsing. The server recalculates every order from
// the database (POST /api/orders/quote and /api/orders); these numbers are never submitted.

export function defaultSelection(product) {
  const options = {};
  for (const group of product.options || []) {
    if (group.type === 'single' && group.required && group.choices.length) options[group.key] = group.choices[0].key;
    if (group.type === 'multi') options[group.key] = [];
  }
  return { size: product.sizes?.[0]?.key, options };
}

export function unitPrice(product, size, options = {}) {
  let price = product.basePrice;
  const s = product.sizes?.find((x) => x.key === size);
  if (s) price += s.priceDelta;
  for (const group of product.options || []) {
    const sel = options[group.key];
    const keys = sel === undefined ? [] : Array.isArray(sel) ? sel : [sel];
    for (const key of keys) price += group.choices.find((c) => c.key === key)?.priceDelta || 0;
  }
  return price;
}

/** Removes empty selections so the request matches what the server expects. */
export function cleanOptions(options = {}) {
  const out = {};
  for (const [k, v] of Object.entries(options)) {
    if (Array.isArray(v)) {
      if (v.length) out[k] = [...v].sort();
    } else if (v) out[k] = v;
  }
  return out;
}

export function selectionSummary(product, size, options = {}) {
  const parts = [];
  const s = product.sizes?.find((x) => x.key === size);
  if (s && product.sizes.length > 1) parts.push(s.label);
  for (const group of product.options || []) {
    const sel = options[group.key];
    const keys = sel === undefined ? [] : Array.isArray(sel) ? sel : [sel];
    for (const key of keys) {
      const c = group.choices.find((x) => x.key === key);
      if (c) parts.push(c.label);
    }
  }
  return parts.join(' · ');
}

export function missingRequired(product, options = {}) {
  return (product.options || []).filter((g) => {
    if (!g.required) return false;
    const sel = options[g.key];
    return sel === undefined || sel === '' || (Array.isArray(sel) && sel.length === 0);
  });
}
