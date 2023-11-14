const express = require('express');
const dateFns = require('date-fns');
const router = express.Router();
router.get('/', (req, res) => {
    const response = {
        message: "health ok",
        timestamp: dateFns.format(new Date(), 'dd/MMMM/y hh:mm:ss'),
        success: true
    };
    res.status(200).json(response);
});

module.exports = router;
