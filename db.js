const {Pool}=require("pg");
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:m3UcC0CPjbfdM1Tfyk3jjmB5Z8gnue8L@localhost:5432/URLShortener',
    ssl: process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false
});
module.exports = pool;

