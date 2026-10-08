const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const makeStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `prernanode/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, crop: 'limit' }],
    },
  });

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'), false);
};

const avatarUpload = multer({
  storage: makeStorage('avatars'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const coverUpload = multer({
  storage: makeStorage('covers'),
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

module.exports = { avatarUpload, coverUpload };
