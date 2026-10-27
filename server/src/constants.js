// Stations inside the 3D cafe that a menu category can be served from.
// The client maps each key to an interactive area in the scene.
export const STATIONS = ['coffee-bar', 'pastry-case', 'pizza-oven', 'grill', 'wok', 'tandoor', 'reception'];

export const ORDER_TYPES = ['dine-in', 'takeaway'];

export const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

// Allowed forward transitions for staff updating an order.
export const ORDER_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export const ROLES = ['admin', 'staff'];

export const MODEL_KINDS = ['procedural', 'glb'];

export const LIMITS = {
  maxOrderLines: 40,
  maxQuantity: 20,
};
