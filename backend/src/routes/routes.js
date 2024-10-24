const express = require('express');
const router = express.Router();
const db = require('../db/config');
const { getFlightRoute } = require('../controllers/flightController');
const { getFlight3 } = require('../controllers/getFlightRoute');


router.get('/test', (req, res)=>{
    console.log('working');
})
router.get('/getFRoute', getFlightRoute);


router.get('/getRoute3', getFlight3)





module.exports = router;