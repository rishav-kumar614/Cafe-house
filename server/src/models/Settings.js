import mongoose from 'mongoose';

const hoursSchema = new mongoose.Schema(
  {
    days: { type: String, required: true, trim: true, maxlength: 40 },
    open: { type: String, required: true, trim: true, maxlength: 10 },
    close: { type: String, required: true, trim: true, maxlength: 10 },
  },
  { _id: false }
);

// Single document holding business details and pricing rules. Everything here ships as
// clearly-marked sample data and must be replaced by the cafe owner in the admin panel.
const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'cafe' },
    cafeName: { type: String, default: 'Ember & Bean', trim: true, maxlength: 60 },
    tagline: { type: String, default: 'A multi-cuisine cafe, kitchen & bakery', trim: true, maxlength: 120 },
    about: {
      type: String,
      default:
        'Sample story: a neighbourhood cafe serving coffee, fresh bakes and comfort food from around the world. Replace this text in Admin > Settings.',
      trim: true,
      maxlength: 2000,
    },
    address: { type: String, default: 'Address not configured (sample)', trim: true, maxlength: 200 },
    phone: { type: String, default: '+00 00000 00000 (sample)', trim: true, maxlength: 40 },
    email: { type: String, default: 'hello@example.com', trim: true, maxlength: 120 },
    hours: {
      type: [hoursSchema],
      default: () => [
        { days: 'Mon - Fri', open: '08:00', close: '22:00' },
        { days: 'Sat - Sun', open: '09:00', close: '23:00' },
      ],
    },
    currency: { type: String, default: 'INR', maxlength: 3 },
    taxRateBps: { type: Number, default: 500, min: 0, max: 3000 }, // 500 bps = 5%
    taxLabel: { type: String, default: 'Tax (sample rate)', trim: true, maxlength: 40 },
    packagingFee: { type: Number, default: 2000, min: 0 }, // paise, takeaway only
    maxTableNumber: { type: Number, default: 30, min: 1, max: 500 },
    acceptingOrders: { type: Boolean, default: true },
    isSampleData: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);

export async function getSettings() {
  const existing = await Settings.findById('cafe').lean();
  if (existing) return existing;
  const created = await Settings.create({ _id: 'cafe' });
  return created.toObject();
}
