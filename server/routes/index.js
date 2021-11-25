const Router = require('express').Router();
const SingpassRoute = require('./singpass');

Router.get('/',(req,res) => {
    res.status(200).json({
        message: "Server Ready"
    })
})

Router.use(SingpassRoute);

module.exports = Router