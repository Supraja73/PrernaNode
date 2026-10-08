const express = require('express');
const {
  listCollections, createCollection, renameCollection, deleteCollection,
  getCollectionItems, saveItem, removeItem,
} = require('../controllers/savedCollectionController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', listCollections);
router.post('/', createCollection);
router.post('/save', saveItem);
router.get('/:id', getCollectionItems);
router.patch('/:id', renameCollection);
router.delete('/:id', deleteCollection);
router.delete('/:id/items', removeItem);

module.exports = router;
