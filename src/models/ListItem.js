import mongoose from "mongoose";


const listItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    minLength: 3,
  }
}, { timestamps: true });


export default mongoose.model("ListItem", listItemSchema);