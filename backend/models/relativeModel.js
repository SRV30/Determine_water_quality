import mongoose from "mongoose";

const relativeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please enter relative's name"],
    },
    age: {
      type: Number,
      required: [true, "Please enter age"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Please select gender"],
    },
    isPregnant: {
      type: Boolean,
      default: false,
    },
    relation: {
      type: String,
      required: [true, "Please specify relation (e.g., mother, son)"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Relative = mongoose.model("Relative", relativeSchema);
export default Relative;
