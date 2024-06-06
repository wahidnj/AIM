const express = require("express");
const port = process.env.PORT || 3030;
const bodyParser = require("body-parser");
const itemRoutes = require('./routes/itemRoutes');
const sequelize = require("./util/database");
// const engine = require('ejs-locals');
const app = express();
const cors = require('cors');
const morgan = require('morgan');

// Define CORS options
const corsOptions = {
    origin: '*', // Allow all origins
};

// Use the CORS middleware with the specified options
app.use(cors(corsOptions));

// app.engine('ejs', engine);
app.set('view engine', 'ejs');

// Use Morgan for logging
app.use(morgan('combined', {
  skip: function (req, res) {
    return req.url.startsWith('/assets'); // Adjust the path as needed
  }
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'))

// Routes
app.use('/', itemRoutes);

sequelize
  .sync()
  // .sync()
  .then((result) => {
    app.listen(port, "0.0.0.0", () => {
      console.log(
        `RESTful API server ${process.pid} running on http://127.0.0.1:${port}`
      );
    });
  });