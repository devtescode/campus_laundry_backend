import mongoose from "mongoose";

const JobPostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "userlaundry", required: true },
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
    status: { type: String, enum: ["Pending", "Applied", "In Progress", "Completed"], default: "Pending" },
    // applicant: { type: mongoose.Schema.Types.ObjectId, ref: "userlaundry" }, // the washer applying
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userlaundry",
      default: null
    },
     applicantName: { type: String, default: null }// store applicant's name for frontend

  },
  { timestamps: true }
);

export default mongoose.model("JobPost", JobPostSchema);
