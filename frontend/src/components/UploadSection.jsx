import React, { useState } from "react";
import { uploadToCloudinary } from "../api";

const UploadSection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setMessage("❌ No file selected.");
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("❌ Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      setUploading(true);
      setMessage("⏳ Uploading...");
      const res = await uploadToCloudinary(formData);

      setMessage("✅ Uploaded Successfully!");
      console.log("URL:", res.data.url, "| Public ID:", res.data.publicId);

      // Reset UI
      setSelectedFile(null);
      setPreview(null);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "❌ Upload failed.";
      setMessage(`❌ ${errMsg}`);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-xl w-[90%] max-w-lg text-center">
      <h2 className="text-2xl font-semibold mb-4 text-blue-600">
        Upload Water Bottle Label
      </h2>

      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileChange}
        className="border p-2 rounded-md w-full mb-4"
      />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-full max-h-60 object-contain rounded-lg mb-4"
        />
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {message && (
        <p
          className={`mt-4 text-sm ${
            message.includes("✅")
              ? "text-green-600"
              : message.includes("⏳")
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default UploadSection;
