export function publicCategory(c, productCount) {
  return {
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description,
    station: c.station,
    sortOrder: c.sortOrder,
    ...(productCount !== undefined ? { productCount } : {}),
  };
}

export function publicProduct(p) {
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    description: p.description,
    categories: (p.categories || [])
      .filter((c) => c && c.slug && c.isActive !== false)
      .map((c) => ({ slug: c.slug, name: c.name, station: c.station })),
    basePrice: p.basePrice,
    isVeg: p.isVeg,
    tags: p.tags || [],
    ingredients: p.ingredients || [],
    sizes: p.sizes || [],
    options: p.options || [],
    image: p.image || '',
    model: p.model || { kind: 'procedural', key: '', params: {} },
    isAvailable: p.isAvailable,
    isFeatured: p.isFeatured,
    isSignature: p.isSignature,
    sortOrder: p.sortOrder,
  };
}

export function publicSettings(s) {
  return {
    cafeName: s.cafeName,
    tagline: s.tagline,
    about: s.about,
    address: s.address,
    phone: s.phone,
    email: s.email,
    hours: s.hours,
    currency: s.currency,
    taxRateBps: s.taxRateBps,
    taxLabel: s.taxLabel,
    packagingFee: s.packagingFee,
    maxTableNumber: s.maxTableNumber,
    acceptingOrders: s.acceptingOrders,
    isSampleData: s.isSampleData,
  };
}
