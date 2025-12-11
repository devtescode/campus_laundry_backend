import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "userlaundry", required: true }, 
    message: { type: String, required: true },
    unread: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);
