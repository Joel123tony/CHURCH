import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import API from "../../api/axios";

export default function GalleryUpload({ onUpload }) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    try {
      setUploading(true);

      const file = acceptedFiles[0];
      const formData = new FormData();

      formData.append("image", file);

      const res = await API.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // send to parent
      onUpload(res.data);

    } catch (err) {
      console.log("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <p>Uploading...</p>
      ) : (
        <p className="text-gray-600">
          Drag & drop image/video here, or click to select
        </p>
      )}
    </div>
  );
}