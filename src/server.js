import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import bookRoutes from './routes/bookRoutes.js';

//Load environment variables from the .env file
dotenv.config({ path: 'krche.env' });

const app = express();

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('uploads'));

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost', //database host
    user: process.env.DB_USER, //MySQL username
    password: process.env.DB_PASS, //MySQL password
    database: 'bookclub_db' //database name
  });


/**
 * @description Connects to the MySQL database and logs the connection 
 * status.
 */
db.connect(err => {
    if (err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
    console.log('Connected to MySQL database.');
  });
  
//Use routes
app.use('/api', bookRoutes);
// Serve the static HTML/CSS frontend
app.use(express.static('public'));

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;