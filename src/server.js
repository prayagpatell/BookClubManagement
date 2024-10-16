import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import bookRoutes from './routes/bookRoutes.js';
import session from 'express-session';
import bcrypt from 'bcryptjs';

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

//session
app.use(session({
  secret: 'key', // Replace with key in .env file
  resave: false,
  saveUninitialized: true,
}));


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
  
//login logic
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send('Internal server error');
      }

      if (results.length === 0) {
          return res.status(401).send('Invalid username or password');
      }

      const user = results[0];

      // Compare the entered password with the plain text password in the database
      if (user.password !== password) {
          return res.status(401).send('Invalid username or password');
      }

      // Store user info in session
      req.session.user = {
          id: user.id,
          username: user.email
      };

      // Redirect to dashboard.html on successful login
      res.redirect('/dashboard.html');
  });
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