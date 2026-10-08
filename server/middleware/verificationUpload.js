const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'prernanode/verification-documents',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
  },
});

const verificationDocUpload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).single('document');

module.exports = { verificationDocUpload };
