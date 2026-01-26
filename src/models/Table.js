import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  columns_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Column",
  }],
  rows_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Row",
  }]
}, { timestamps: true });

export default mongoose.model("Table", tableSchema);