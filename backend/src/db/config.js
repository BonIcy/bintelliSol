const mysql2 = require('mysql2/promise');
require('dotenv').config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST256,
  port: process.env.DB_PORT256,
  user: process.env.DB_USER256,
  password: process.env.DB_PASSWORD256,
  database: process.env.DB_DATABASE256,
});

pool.getConnection()
  .then((connection) => {
    console.log('Connection to db successfully');
    connection.release(); 
  })
  .catch((err) => {
    console.error('Error trying to connect to db', err);
  });

module.exports = pool;