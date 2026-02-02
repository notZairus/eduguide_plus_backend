import mongoose from "mongoose";
import Topic from "./Topic.js";


const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: true,
    minLength: 4,
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
  },
  medias: [{
    url: {
      type: String,
    },
    public_id: {
      type: String,
    },
    type: {
      type: String,
      enum: ["image", "video"]
    }
  }],
  order: {
    type: Number,
    required: true
  }
}, { timestamps: true });

sectionSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Topic.updateMany(
      { sections: doc._id },
      { $pull: { sections: doc._id } }
    );
  }
});

export default mongoose.model("Section", sectionSchema);