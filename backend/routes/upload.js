const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { uploadFile, handleUpload } = require('../controllers/uploadController');

router.post('/', auth, uploadFile, handleUpload);

module.exports = router; 