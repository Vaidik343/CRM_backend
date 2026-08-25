const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin }  = require('../middlewares/role.middleware');

const ctrl = require('../controllers/offerLetter.controller');

// admin only

router.get('/offer-letter/positions', authenticate, ctrl.listPositions);
router.post('/offer-letter/position', authenticate, ctrl.findOrCreatePosition);
router.get('/offer-latter/addresses', authenticate, ctrl.listAddresses);
router.post('/offer-letter/addresses', authenticate, ctrl.findOrCreateAddress);

// generate
router.post('/offer-letter/generate/:application_id', authenticate, ctrl.generateOfferLetter);

module.exports = router