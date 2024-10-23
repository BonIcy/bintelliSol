const express = require("express");
const app = express();
const routerBase = require("./src/routes/routes");
const db = require("./src/db/config");
const cors = require('cors')
const port = process.env.PORT256;


app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:3000', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204, 
};
app.use(cors(corsOptions));
// path general (services)
app.use("/services/", routerBase);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
