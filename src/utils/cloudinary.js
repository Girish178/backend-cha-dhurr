import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

// Configuration
    cloudinary.config({ 
        cloud_name: CLOUDINARY_CLOUD_NAME, 
        api_key: CLOUDINARY_API_KEY, 
        api_secret:CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
    });

const uploadOnCloudinary= async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //upload file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,
            {
                resource_type:"auto",
            }
        )
        //file has been uploaded successfully
        console.log("file uploaded on cloudinary!!",response.url);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        //remove  the locally saved temporary file as upload operation got failed
        return null
    }
}

export {uploadOnCloudinary}