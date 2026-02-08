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
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    }
  },
  { timestamps: true },
);

topicSchema.pre("findOneAndDelete", async function () {
  const topic = await this.model.findOne(this.getQuery());
  if (topic) {
    for (const sectionId of topic.sections) {
      await mongoose.model("Section").findOneAndDelete({ _id: sectionId });
    }
  }
});

export default mongoose.model("Topic", topicSchema);
