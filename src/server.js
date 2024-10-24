import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import bookRoutes from './routes/bookRoutes.js';
import session from 'express-session';
//import bcrypt from 'bcryptjs';

// Load environment variables from the .env file
dotenv.config({ path: 'krche.env' });

const app = express();

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('uploads'));

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost', // database host
    user: process.env.DB_USER, // MySQL username
    password: process.env.DB_PASS, // MySQL password
    database: 'bookclub_db' // database name
});

// Session
app.use(session({
  secret: process.env.SESSION_KEY,
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

// Login logic
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM Users WHERE email = ?';
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


//listclubs
//listclubs
// Route to fetch and display data as HTML
// Route to display clubs in joinbookclub.html
app.get('/joinbookclub', (req, res) => {
  const sqlQuery = 'SELECT * FROM Clubs';

  db.query(sqlQuery, (error, results) => {
      if (error) {
          return res.status(500).send('Error fetching data');
      }

      // Construct the HTML content for joinbookclub.html
      let html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Join a Book Club</title>
              <link rel="stylesheet" href="styles3.css">
          </head>
          <body>
              <div class="book-club-container">
                  <h1>Available Book Clubs</h1>
                  <div class="book-club-list">`;

      // Loop through each club and generate divs for each one
      results.forEach(club => {
          html += `
                      <div class="book-club">
                          <h2>${club.club_name}</h2>
                          <p>A club for those who enjoy various genres.</p> <!-- You can customize this description -->
                          <form action="/join" method="post">
                              <input type="hidden" name="club_id" value="${club.club_id}">
                              <button type="submit">Join Club</button>
                          </form>
                      </div>`;
      });

      // Close the HTML structure
      html += `
                  </div>
              </div>
          </body>
          </html>
      `;

      // Send the generated HTML back to the client
      res.send(html);
  });
});

// Route to handle joining a book club
app.post('/join', (req, res) => {
  const clubId = req.body.club_id; // Get the club ID from the request body
  const userEmail = req.session.user.username; // Get the logged-in user's email from the session

  // SQL query to update the user's club ID
  const sqlQuery = 'UPDATE Users SET club_id = ? WHERE email = ?';
  
  db.query(sqlQuery, [clubId, userEmail], (error, results) => {
      if (error) {
          console.error('Error joining club:', error);
          return res.status(500).send('Error joining club');
      }

      // Check if the update was successful
      if (results.affectedRows > 0) {
          // Successfully joined the club
          res.redirect('/joinbookclub'); // Redirect to the list of book clubs
      } else {
          // User not found or club ID not updated (e.g., already part of a club)
          res.status(404).send('Could not update club information. Please try again.');
      }
  });
});

// Route to display the book clubs the user is part of
app.get('/existingBookClub', (req, res) => {
    const userEmail = req.session.user.username; // Get the logged-in user's email from the session
  
    // SQL query to fetch clubs the user is part of
    const sqlQuery = `
        SELECT Clubs.club_name 
        FROM Clubs 
        INNER JOIN Users ON Clubs.club_id = Users.club_id 
        WHERE Users.email = ?
    `;
  
    db.query(sqlQuery, [userEmail], (error, results) => {
        if (error) {
            return res.status(500).send('Error fetching data');
        }
  
        // Construct the HTML content for existingBookClub.html
        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Book Clubs</title>
                <link rel="stylesheet" href="styles3.css">
            </head>
            <body>
                <div class="book-club-container">
                    <h1>Your Book Clubs</h1>
                    <div class="book-club-list">`;
  
        // Check if user is part of any club
        if (results.length > 0) {
            // Loop through each club and generate divs for each one
            results.forEach(club => {
                html += `
                            <div class="book-club">
                                <h2>${club.club_name}</h2>
                                <p>You are a member of this book club.</p>
                            </div>`;
            });
        } else {
            html += `
                        <div class="book-club">
                            <p>You are not currently part of any book club.</p>
                        </div>`;
        }
  
        // Close the HTML structure
        html += `
                    </div>
                </div>
            </body>
            </html>
        `;
  
        // Send the generated HTML back to the client
        res.send(html);
    });
  });  

// Logout logic
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/index.html'); // Redirect to login page after logout
    });
  });


// Use routes
app.use('/api', bookRoutes);
// Serve the static HTML/CSS frontend
app.use(express.static('public'));

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { app };
