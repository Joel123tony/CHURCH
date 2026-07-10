import React, { useState } from "react";
import API from "../../api/axios";
import { FaUpload, FaSpinner, FaTrashAlt } from "react-icons/fa";

export default function ImageField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/upload/image", formData);
      if (res.data && res.data.url) {
        onChange(res.data.url);
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="p-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50/50">
      {value ? (
        <div className="relative group overflow-hidden rounded-lg border border-slate-200 bg-white aspect-video max-w-xs">
          <img
            src={value}
            alt="Uploaded Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2.5 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition shadow"
              title="Delete Image"
            >
              <FaTrashAlt size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 transition">
          <label className="flex flex-col items-center justify-center p-6 cursor-pointer">
            {uploading ? (
              <>
                <FaSpinner className="animate-spin text-slate-400 mb-2" size={24} />
                <span className="text-xs font-semibold text-slate-500">Uploading to Cloudinary...</span>
              </>
            ) : (
              <>
                <FaUpload className="text-slate-400 mb-2" size={24} />
                <span className="text-xs font-bold text-slate-600">Upload Image</span>
                <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, GIF up to 5MB</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}