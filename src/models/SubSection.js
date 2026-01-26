import mongoose from "mongoose";


const subSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    trin: true,
    minLength: 3,
  },
  contentType: {
    type: String,
    enum: ['paragraph', 'numbered-list', 'bulleted-list', 'table'],
    required: true,
  },
  content: {
    type: String,
    minLenght: 24,
  },
  items_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
  }],
  tables_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
  }],
}, { timestamps: true });


export default mongoose.model("SubSection", subSectionSchema);