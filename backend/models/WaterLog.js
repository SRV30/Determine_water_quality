import mongoose from "mongoose";

const waterLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    time: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("WaterLog", waterLogSchema);
