const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',          // change if needed
    password: 'Nimjaya#56',
    database: 'bus_tracking_db',
    
});

module.exports = pool;
