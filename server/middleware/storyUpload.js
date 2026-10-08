const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// One storage config, branching by fieldname, so a single multipart request
// (title + images[] + optional video) can be parsed in one pass.
const storyStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'video') {
      return {
        folder: 'prernanode/stories/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'webm'],
      };
    }
    return {
      folder: 'prernanode/stories/images',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1600, crop: 'limit', quality: 'auto:good' }],
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    return cb(new Error('Only video files are allowed for the video field'), false);
  }
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed for story images'), false);
};

const storyUpload = multer({
  storage: storyStorage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 11 }, // video can be up to 100MB; images capped separately by count
});

// Use as: storyUpload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }])
const storyFilesMiddleware = storyUpload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 },
]);

module.exports = { storyFilesMiddleware };
