const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin }  = require('../middlewares/role.middleware');

const ctrl = require('../controllers/offerLetter.controller');

// admin only

router.get('/offer-letter/positions', authenticate, requireAdmin, ctrl.listPositions);
router.post('/offer-letter/positions', authenticate, requireAdmin, ctrl.findOrCreatePosition);
router.get('/offer-letter/addresses', authenticate, requireAdmin, ctrl.listAddresses);
router.post('/offer-letter/addresses', authenticate,  requireAdmin, ctrl.findOrCreateAddress);


// generate
router.post('/offer-letter/generate/:application_id', authenticate, ctrl.generateOfferLetter);

module.exports = router