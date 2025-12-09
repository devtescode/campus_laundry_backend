import mongoose from "mongoose";

const JobPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userlaundry",
      required: true,
    },
    type: String,
    quantity: Number,
    price: Number,
    hostel: String,
    block: String,
    room: String,
    pickupDate: String,
    pickupTime: String,
    deliveryDate: String,
    deliveryTime: String,
    description: String,
    image: String, // Cloudinary URL if uploading
  },
  { timestamps: true }
);

export default mongoose.model("JobPost", JobPostSchema);
