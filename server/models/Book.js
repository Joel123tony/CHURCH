import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      default: "",
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    coverImageUrl: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "Pamphlet"
    },

    pdf_public_id: {
      type: String,
      required: true,
    },
    cover_public_id: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Book", bookSchema);
