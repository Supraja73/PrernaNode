const express = require('express');
const {
  createProduct, updateProduct, toggleHide, toggleSold, deleteProduct, getProduct,
  listProducts, reportProduct, shareProduct, listCategories, listBySeller,
} = require('../controllers/productController');
const { createInquiry } = require('../controllers/inquiryController');
const { protect, optionalAuth } = require('../middleware/auth');
const { productUpload } = require('../middleware/part3Upload');
const { productRules, inquiryRules } = require('../validators/part3Validators');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/seller/:userId', listBySeller);
router.get('/', listProducts);
router.post('/', protect, productUpload, productRules, createProduct);
router.get('/:id', optionalAuth, getProduct);
router.patch('/:id', protect, productUpload, updateProduct);
router.patch('/:id/hide', protect, toggleHide);
router.patch('/:id/sold', protect, toggleSold);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/report', protect, reportProduct);
router.post('/:id/share', protect, shareProduct);
router.post('/:productId/inquiries', protect, inquiryRules, createInquiry);

module.exports = router;
