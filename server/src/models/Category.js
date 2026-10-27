import mongoose from 'mongoose';
import { STATIONS } from '../constants.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 60 },
    description: { type: String, default: '', trim: true, maxlength: 400 },
    // Which interactive station in the 3D cafe serves this category.
    station: { type: String, enum: STATIONS, default: 'reception' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ sortOrder: 1, name: 1 });

export const Category = mongoose.model('Category', categorySchema);
