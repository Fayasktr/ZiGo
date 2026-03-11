import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const uploadToCloudinary = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        
        // Create the upload stream
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folderName }, 
            (error, result) => {
                if (result) {
                    resolve(result.secure_url); // Returns the URL when done
                } else {
                    reject(error);
                }
            }
        );
        // Pipe (send) the buffer into the stream
        uploadStream.end(fileBuffer);
    });
};

export { cloudinary, uploadToCloudinary };