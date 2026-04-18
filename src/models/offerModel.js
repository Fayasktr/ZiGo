import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Offer name is required'],
      trim: true,
      minlength: [3, 'Offer name must be at least 3 characters'],
      maxlength: [100, 'Offer name too long'],
    },
    type: {
      type: String,
      enum: {
        values: ['category', 'product'],
        message: '{VALUE} is not a valid offer type',
      },
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount must be at least 1'],
      max: [99, 'Discount percentage cannot exceed 99'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'category',
      validate: {
        validator: function (v) {
          if (this.type === 'category') {
            return v != null;
          }
          return true;
        },
        message: 'Category is required for category-based offers',
      },
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel',
      validate: {
        validator: function (v) {
          if (this.type === 'product') {
            return v != null;
          }
          return true;
        },
        message: 'Product is required for product-based offers',
      },
    },
    expireAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: 'Expiry date must be in the future',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

offerSchema.index({ type: 1, isActive: 1 });
offerSchema.index({ categoryId: 1, isActive: 1 });
offerSchema.index({ productId: 1, isActive: 1 });

offerSchema.virtual('isExpired').get(function () {
  return new Date() > this.expireAt;
});

export default mongoose.model('Offer', offerSchema);
