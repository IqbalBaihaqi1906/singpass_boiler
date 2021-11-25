const Router = require('express').Router();
const SingpassController = require('../controller/singpass');

Router.get('/singpass',(req,res) => {
    res.status(200).json({
        message : "singpass route ready"
    });
});

Router.get('/singpass/check',SingpassController.check);

module.exports = Router;