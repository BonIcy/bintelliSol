const express = require('express');
const router = express.Router();
const db = require('../db/config');
const { getFlightRoute } = require('../controllers/flightController');


router.get('/test', (req, res)=>{
    console.log('working');
})
router.get('/getFRoute', getFlightRoute);
module.exports = router;