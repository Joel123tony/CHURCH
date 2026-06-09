import cloudinary from "./cloudinary.js";

export const uploadToCloudinary = (fileBuffer, folder = "gallery") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto", // 🔥 supports image + video
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
        });
      }
    );

    stream.end(fileBuffer);
  });
};