const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const IMAGE_FIELDS = new Set(['certificates', 'demoImages', 'logo', 'coverBanner', 'gallery', 'images']);
const VIDEO_FIELDS = new Set(['demoVideo', 'video']);
const RAW_FIELDS = new Set(['resume', 'portfolio']); // PDFs / docs, not images

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (VIDEO_FIELDS.has(file.fieldname)) {
      return {
        folder: 'prernanode/part3/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'webm'],
      };
    }
    if (RAW_FIELDS.has(file.fieldname)) {
      return {
        folder: 'prernanode/part3/documents',
        resource_type: 'raw',
        allowed_formats: ['pdf', 'doc', 'docx'],
      };
    }
    return {
      folder: `prernanode/part3/images/${file.fieldname}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1400, crop: 'limit', quality: 'auto:good' }],
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (VIDEO_FIELDS.has(file.fieldname)) {
    return file.mimetype.startsWith('video/') ? cb(null, true) : cb(new Error('Invalid video file'), false);
  }
  if (RAW_FIELDS.has(file.fieldname)) {
    const ok = file.mimetype === 'application/pdf' || file.mimetype.includes('msword') || file.mimetype.includes('officedocument');
    return ok ? cb(null, true) : cb(new Error('Resume/portfolio must be a PDF or Word document'), false);
  }
  return file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Invalid image file'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024, files: 15 } });

// Pre-configured field sets per resource, per the spec's upload requirements.
const skillUpload = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 },
  { name: 'certificates', maxCount: 10 },
  { name: 'demoImages', maxCount: 10 },
  { name: 'demoVideo', maxCount: 1 },
]);

const businessUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coverBanner', maxCount: 1 },
  { name: 'gallery', maxCount: 15 },
]);

const productUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 },
]);

const reviewUpload = upload.fields([{ name: 'images', maxCount: 6 }]);

module.exports = { skillUpload, businessUpload, productUpload, reviewUpload, cloudinary };
