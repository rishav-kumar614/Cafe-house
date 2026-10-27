import mongoose from 'mongoose';
import { ORDER_STATUSES, ORDER_TYPES } from '../constants.js';

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    isVeg: { type: Boolean, required: true },
    size: {
      key: String,
      label: String,
      priceDelta: Number,
    },
    options: [
      {
        _id: false,
        groupKey: String,
        groupLabel: String,
        choiceKey: String,
        choiceLabel: String,
        priceDelta: Number,
      },
    ],
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    // SHA-256 of the token handed to the customer so they can view their own order.
    accessTokenHash: { type: String, required: true, select: false },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: '', trim: true },
    },
    orderType: { type: String, enum: ORDER_TYPES, required: true },
    tableNumber: { type: Number, default: null },
    notes: { type: String, default: '', trim: true },
    items: { type: [orderItemSchema], required: true },
    currency: { type: String, default: 'INR' },
    subtotal: { type: Number, required: true },
    taxRateBps: { type: Number, required: true },
    tax: { type: Number, required: true },
    packagingFee: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'pay-at-counter' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES },
        at: { type: Date, default: Date.now },
        by: { type: String, default: 'system' },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
