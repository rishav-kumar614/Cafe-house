import mongoose from 'mongoose';
import { MODEL_KINDS } from '../constants.js';

const { Schema } = mongoose;

// All money values are stored as integer minor units (paise) to avoid floating point errors.
const sizeSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 30 },
    label: { type: String, required: true, trim: true, maxlength: 40 },
    priceDelta: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const choiceSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 30 },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    priceDelta: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const optionGroupSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 30 },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    type: { type: String, enum: ['single', 'multi'], default: 'single' },
    required: { type: Boolean, default: false },
    maxChoices: { type: Number, default: 0, min: 0 }, // 0 = no limit (multi only)
    choices: { type: [choiceSchema], default: [] },
  },
  { _id: false }
);

const modelSchema = new Schema(
  {
    kind: { type: String, enum: MODEL_KINDS, default: 'procedural' },
    // Procedural model key understood by the client's food model library (e.g. "burger").
    key: { type: String, default: '', trim: true, maxlength: 40 },
    params: { type: Schema.Types.Mixed, default: {} },
    // For kind "glb": URL of an uploaded or hosted .glb file.
    url: { type: String, default: '', trim: true, maxlength: 500 },
    scale: { type: Number, default: 1, min: 0.01, max: 100 },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 600 },
    // A dish can appear in several categories (e.g. Garlic Bread in Italian, Snacks and Bakery).
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
    basePrice: { type: Number, required: true, min: 0 },
    isVeg: { type: Boolean, required: true },
    tags: { type: [String], default: [] },
    ingredients: { type: [String], default: [] },
    sizes: { type: [sizeSchema], default: [] },
    options: { type: [optionGroupSchema], default: [] },
    image: { type: String, default: '', trim: true, maxlength: 500 },
    model: { type: modelSchema, default: () => ({}) },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isSignature: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    related: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

productSchema.index({ categories: 1, sortOrder: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text', ingredients: 'text' });

export const Product = mongoose.model('Product', productSchema);
