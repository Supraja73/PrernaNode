const mongoose = require('mongoose');

// A lightweight embedded message thread per inquiry — enough for "negotiate through chat"
// without standing up a full real-time messaging system (that belongs to a dedicated part).
const inquiryMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inquirySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    initialMessage: { type: String, trim: true, maxlength: 2000, required: true },
    messages: [inquiryMessageSchema],

    status: {
      type: String,
      enum: ['open', 'accepted', 'rejected', 'reserved', 'cancelled'],
      default: 'open',
      index: true,
    },
  },
  { timestamps: true }
);

inquirySchema.index({ product: 1, buyer: 1 });
inquirySchema.index({ seller: 1, status: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
