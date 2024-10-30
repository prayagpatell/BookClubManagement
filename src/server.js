import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';

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
    host: 'localhost', 
    user: process.env.DB_USER, 
    password: process.env.DB_PASS, 
    database: 'bookclub_db' 
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
          return res.status(401).json({message: 'Invalid username or password'});
      }

      // Store user info in session
      req.session.user = {
          id: user.id,
          username: user.email
      };
      
      // Redirect to dashboard.html on successful login
      if (user.role === 'admin') {
            res.redirect('/adminDashboard.html');
        } else if (user.role === 'moderator') {
            res.redirect('/modDashboard.html');
        }
        else {
            res.redirect('/dashboard.html');
        }
  });
});

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
              <link rel="stylesheet" href="styles3.css">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Join a Book Club</title>
              <link rel="stylesheet" href="styles3.css">
          </head>
          <body>
          <nav class="navbar">
        <a href="/joinBookClub">Join a Book Club</a>
        <a href="/existingBookClub">Your Club</a>
        <a href="/logout">Logout</a>
    </nav>
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
  const clubId = req.body.club_id; 
  const userEmail = req.session.user.username; 

  // SQL query to update the user's club ID
  const sqlQuery = 'UPDATE Users SET club_id = ? WHERE email = ?';
  
  db.query(sqlQuery, [clubId, userEmail], (error, results) => {
      if (error) {
          console.error('Error joining club:', error);
          return res.status(500).send('Error joining club');
      }

      // Check if the update was successful
      if (results.affectedRows > 0) {
          res.redirect('/joinbookclub');
      } else {
          res.status(404).send('Could not update club information. Please try again.');
      }
  });
});

// Route to display the book clubs the user is part of
app.get('/existingBookClub', (req, res) => {
    const userEmail = req.session.user.username;
    // SQL query to fetch clubs the user is part of
    const sqlQuery = `
        SELECT Clubs.club_name, Books.title AS current_book 
        FROM Clubs 
        INNER JOIN Users ON Clubs.club_id = Users.club_id 
        LEFT JOIN Books ON Clubs.current_book = Books.book_id
        WHERE Users.email = ?
    `;
  
    db.query(sqlQuery, [userEmail], (error, results) => {
        if (error) {
            console.error('Error fetching data:', error);
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
            <nav class="navbar">
        <a href="/joinBookClub">Join a Book Club</a>
        <a href="/existingBookClub">Your Club</a>
        <a href="/logout">Logout</a>
    </nav>
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
                                <p>Currently Reading: ${club.current_book ? club.current_book: 'No book assigned'}</p>
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
        res.redirect('/index.html'); 
    });
  });


// Route to add a new book
app.post('/addBook', (req, res) => {
    const { bookTitle, authorName } = req.body;
    const publicationDate = new Date().getFullYear();
  
    // Define the SQL query to insert the book
    const insertQuery = 'INSERT INTO Books (title, author, `pub_date`) VALUES (?, ?, ?)';
  
    // Execute the query with the form data
    db.query(insertQuery, [bookTitle, authorName, publicationDate], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error adding the book' });
      }
      res.json({ message: 'Book has been added.' });
    });
  });

// Route to get all books
app.get('/books', (req, res) => {
    const sql = 'SELECT * FROM Books';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});
 
// Route to view all users and their respective book clubs
app.get('/viewUsersWithCLubs', (req, res) => {
    // SQL query to fetch users along with their club names
    const sqlQuery = `
        SELECT Users.name AS user_name, Clubs.club_name
        FROM Users
        LEFT JOIN Clubs ON Users.club_id = Clubs.club_id`;
    
    db.query(sqlQuery, (error, results) => {
        if (error) {
            console.error ('Error fetching user and club data:', error);
            return res.status(500).send('Error fetching data');
        }
        // Construct the HTML content for displaying users and their clubs
        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Users and Book Clubs</title>
                <link rel="stylesheet" href="styles3.css">
            </head>
            <body>
                <div class="book-club-container">
                    <h1>Users and Their Book Clubs</h1>
                    <table>
                        <tr>
                            <th>User Name</th>
                            <th>Book Club</th>
                        </tr>`;

        // Check if any results were returned
        if (results.length > 0) {
            // Loop through each user and club and create table rows 
            results.forEach(user => {
                html += `
                <tr>
                    <td>${user.user_name}</td>
                    <td>${user.club_name || 'No Club'}</td>
                </tr>`;
            });
        } else {
            html += `
                <tr>
                    <td colspan="2">No users found.</td>
                </tr>`;
        }

        // Close the HTML structure
        html += `
                        </table>
                    </div>
                </body>
            </html>
        `;

        res.send(html)
    });
});

//addNewMembers
app.post('/addMember', (req, res) => {
    const { name, email, role, password } = req.body;
    
    
    const clubId = req.session.user.club_id;

    
    if (!name || !email || !role || !password) {
        return res.status(400).send('All fields are required.');
    }

   
    const sqlQuery = `INSERT INTO Users (email, name, role, password, club_id) VALUES (?, ?, ?, ?, ?)`;

   
    db.query(sqlQuery, [email, name, role, password, clubId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }

        
        res.redirect('/viewUsersWithClubs');
    });
});

//updatebookinclub
app.post('/updateCurrentBook', (req, res) => {
    const { bookId } = req.body;
    const userEmail = req.session.user.username;

    //Find the club that the logged-in user is part of
    const findUserClubQuery = `
        SELECT club_id FROM Users WHERE email = ?
    `;

    db.query(findUserClubQuery, [userEmail], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error checking user membership.');
        }

        if (results.length === 0 || !results[0].club_id) {
            return res.status(403).send('You are not a member of any club.');
        }

        // Get the user's club ID
        const userClubId = results[0].club_id;

        //update the current book for the user's club
        const updateClubQuery = `
            UPDATE Clubs SET current_book = ? WHERE club_id = ?
        `;

        db.query(updateClubQuery, [bookId, userClubId], (err, updateResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Error updating the book for the club.');
            }

            res.send('Book successfully added to your club.');
        });
    });
});



// Serve the static HTML/CSS frontend
app.use(express.static('public'));

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { app };
