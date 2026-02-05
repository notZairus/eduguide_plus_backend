import mongoose, { mongo } from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      minLength: 4,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      }
    ],
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  { timestamps: true },
);

topicSchema.pre("findOneAndDelete", async function () {
  const topic = await this.model.findOne(this.getQuery());
  if (topic) {
    await mongoose.model("Section").deleteMany({
      _id: { $in: topic.sections },
    });
  }
});

export default mongoose.model("Topic", topicSchema);
