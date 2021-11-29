const Router = require('express').Router();
const SingpassController = require('../controller/singpass');

Router.get('/singpass',(req,res) => {
    res.status(200).json({
        message : "singpass route ready"
    });
});

Router.get('/singpass/check',SingpassController.check);
Router.get('/singpass/getEnv',SingpassController.getEnv);
Router.get('/callback',SingpassController.callback);
Router.post('/singpass/getPersonData',SingpassController.getPersonData);

module.exports = Router;