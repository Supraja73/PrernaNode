const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'video') {
      return { folder: 'prernanode/part4/videos', resource_type: 'video', allowed_formats: ['mp4', 'mov', 'webm'] };
    }
    if (file.fieldname === 'document') {
      return { folder: 'prernanode/part4/documents', resource_type: 'raw', allowed_formats: ['pdf', 'doc', 'docx', 'xlsx', 'pptx', 'zip'] };
    }
    if (file.fieldname === 'voice') {
      return { folder: 'prernanode/part4/voice', resource_type: 'video', allowed_formats: ['mp3', 'wav', 'm4a', 'webm', 'ogg'] };
    }
    return {
      folder: `prernanode/part4/images/${file.fieldname}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1400, crop: 'limit', quality: 'auto:good' }],
    };
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024, files: 15 } });

const communityUpload = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
]);
const communityPostUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 },
]);
const eventUpload = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'gallery', maxCount: 15 },
]);
const chatAttachmentUpload = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'document', maxCount: 1 },
  { name: 'voice', maxCount: 1 },
]);

module.exports = { communityUpload, communityPostUpload, eventUpload, chatAttachmentUpload };
