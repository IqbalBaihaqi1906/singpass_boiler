const express = require('express');
const app = express()
const route = require('./routes/index')
const cors = require('cors')
require('dotenv/config')

const PORT = process.env.PORT;

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use(cors());
app.use(route);


app.listen(PORT,() => {
    console.log(`Server running at port ${PORT}`);
})