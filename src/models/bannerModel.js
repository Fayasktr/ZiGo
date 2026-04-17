import mongoose, { Mongoose } from 'mongoose';

const bannerSchema = mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    slot: {
      type: String,
      default: 'Hero Slider',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('banner', bannerSchema);
