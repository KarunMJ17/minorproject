const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./models/User');

// Initialize Express
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/clubmanagement', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Error connecting to MongoDB:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'mysecret', resave: false, saveUninitialized: false }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Ensure 'views' directory is correct

// Define Club schema and model
const clubSchema = new mongoose.Schema({
  name: String,
  motto: String,
  password: String,
  roles: {
      chairman: String,
      secretary: String,
      president: String
  },
  events: [{  // New field for events
      eventName: String,
      eventDate: { type: Date, required: true }
  }]
});

const Club = mongoose.model('Club', clubSchema);

const requestedUserSchema = new mongoose.Schema({
    name: String,
    clubName: String
});

const RequestedUser = mongoose.model('RequestedUser', requestedUserSchema);


RequestedUser.find({ clubName: 'your-club-name' })
    .then(requests => {
        console.log(requests); // Check if requests are returned
    })
    .catch(err => {
        console.error("Error fetching requests:", err);
    });



// Home Route (after login)
app.get('/home', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('home');  // Ensure home.ejs exists
});

// Login Route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html')); // Ensure login.html exists
});

// Register Route
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html')); // Ensure register.html exists
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        req.session.user = username;  // Save the username in the session
        return res.redirect('/home'); // Redirect to home after successful login
    } else {
        res.send("Invalid login. Please try again.");
    }
});


// Handle logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Handle registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    // Registration logic (placeholder)
    res.redirect('/login');
});

// Create Club Route (Form)
app.get('/create-club', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('createClub');  // Ensure createClub.ejs exists
});

// Handle Create Club Form Submission
app.post('/create-club', (req, res) => {
  const { clubName, motto, password, chairman, secretary, president } = req.body;

  const club = new Club({
      name: clubName,
      motto: motto,
      password: password,
      roles: {
          chairman: chairman,
          secretary: secretary,
          president: president
      }
  });

  club.save()
      .then(() => {
          res.redirect('/home');
      })
      .catch((err) => {
          console.error("Error creating club:", err);
          res.status(500).send("An error occurred while creating the club.");
      });
});
app.get('/edit-club-password', (req, res) => {
    Club.find({}, (err, clubs) => {
        if (err) {
            return res.redirect('/home');
        }
        res.render('edit-club-password', { clubs });
    });
});
app.post('/edit-club-password', (req, res) => {
    const { clubId, password } = req.body;
    // Verify the password and redirect to the edit club page if correct
    Club.findById(clubId, (err, club) => {
        if (err || !club || club.password !== password) {
            return res.redirect('/edit-club-password'); // Redirect back if password is incorrect
        }
        res.redirect(`/edit-club/${clubId}`);
    });
});
// Route to render the edit club page
app.get('/edit-club/:id', (req, res) => {
    Club.findById(req.params.id, (err, club) => {
        if (err || !club) {
            return res.redirect('/home');
        }
        res.render('edit-club', { club });
    });
});

app.post('/edit-club/:id', (req, res) => {
    const { name, motto, chairman, secretary, president } = req.body;
    Club.findByIdAndUpdate(req.params.id, { name, motto, roles: { chairman, secretary, president } }, (err) => {
        if (err) {
            return res.redirect(`/edit-club/${req.params.id}`);
        }
        res.redirect('/home');
    });
});
// Route to display the list of clubs and ask for password for adding events
app.get('/add-event-password', (req, res) => {
    Club.find({}, (err, clubs) => {
        if (err) {
            return res.redirect('/home');
        }
        res.render('add-event-password', { clubs });
    });
});
// Route to view club details
app.get('/view-club-details/:id', (req, res) => {
  Club.findById(req.params.id)
      .then(club => {
          if (!club) {
              return res.status(404).send("Club not found.");
          }
          res.render('viewClubDetails', { club });
      })
      .catch(err => {
          console.error("Error fetching club details:", err);
          res.status(500).send("An error occurred while retrieving the club details.");
      });
});

// Routes for other options (coming soon pages)
app.get('/request-to-join', (req, res) => {
  Club.find()
      .then(clubs => {
          res.render('join-club', { clubs });
      })
      .catch(err => {
          console.error("Error fetching clubs:", err);
          res.status(500).send("An error occurred while retrieving the club list.");
      });
});

// Assuming you're using Express and Mongoose
// app.post('/add-event/:clubId', async (req, res) => {
//     const { eventName, eventDate, eventDays } = req.body; // 'eventDays' is the new field for the duration
//     const clubId = req.params.clubId;

//     // Fetch the club's name from the database
//     const club = await Club.findById(clubId);
//     const clubName = club.name; // Store the club name

//     const events = [];

//     // Create multiple event entries for the given duration
//     for (let i = 0; i < parseInt(eventDays); i++) {
//         const eventDateObj = new Date(eventDate);
//         eventDateObj.setDate(eventDateObj.getDate() + i);
//         events.push({ name: eventName, date: eventDateObj, clubName: clubName });
//     }

//     // Save these dates to the database (assuming 'events' is part of the schema)
//     await Club.updateOne(
//         { _id: clubId },
//         { $push: { events: { $each: events } } }
//     );

//     res.redirect('/view-calendar');
// });

app.post('/add-event/:clubId', async (req, res) => {
    const { eventName, eventDate , eventDays } = req.body; // Only 'eventName' and 'eventDate' are needed
    const clubId = req.params.clubId;

    // Check if required fields are provided
    if (!eventName || !eventDate || !eventDays) {
        return res.status(400).send("Please provide both eventName and eventDate.");
    }

    // Try to parse eventDate to a valid Date object
    const parsedEventDate = new Date(eventDate);
    if (isNaN(parsedEventDate.getTime())) {
        return res.status(400).send("Invalid eventDate format. Please provide a valid date.");
    }

    try {
        // Fetch the club's name from the database
        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).send("Club not found.");
        }
        const clubName = club.name; // Store the club name

          // Create multiple event entries for the given duration
          const events = [];
          for (let i = 0; i < parseInt(eventDays); i++) {
              const eventDateObj = new Date(parsedEventDate);
              eventDateObj.setDate(eventDateObj.getDate() + i);
              events.push({ eventName, eventDate: eventDateObj });
          }
  
          // Save these dates to the database
          await Club.updateOne(
              { _id: clubId },
              { $push: { events: { $each: events } } }
          );
        // Redirect to the calendar page after adding the event
        res.redirect('/view-calendar');
    } catch (err) {
        console.error("Error adding event:", err);
        res.status(500).send("An error occurred while adding the event.");
    }
});


// Route for viewing the calendar with month navigation
app.get('/view-calendar', async (req, res) => {
  let { month, year } = req.query;

  // If month and year are not provided, default to the current month and year
  if (!month || !year) {
      const currentDate = new Date();
      month = currentDate.getMonth(); // Current month (0-11)
      year = currentDate.getFullYear(); // Current year
  } else {
      month = parseInt(month);
      year = parseInt(year);
  }

  // Fetch all clubs and their events
  const clubs = await Club.find();

  // Now, filter the events for the selected month and year
    // Filter events by selected month and year
    const events = clubs.flatMap(club =>
        club.events
            .filter(event => event.eventDate && // Ensure eventDate is defined
                            event.eventDate.getMonth() === month &&
                            event.eventDate.getFullYear() === year)
            .map(event => ({
                name: event.eventName,
                date: event.eventDate,
                clubName: club.name
            }))
    );


  // Calculate the first day of the month and the number of days in the month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();
  const firstDayWeekday = firstDayOfMonth.getDay(); // Sunday = 0, Monday = 1, etc.

  // Calculate the next and previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const nextMonth = month === 11 ? 0 : month + 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextYear = month === 11 ? year + 1 : year;

  res.render('view-calendar', {
      events,
      currentMonth: month,
      currentYear: year,
      totalDaysInMonth,
      firstDayWeekday,
      prevMonth,
      prevYear,
      nextMonth,
      nextYear
  });
});

// Route to prompt for the club password before editing
app.get('/edit-club/:id', async (req, res) => {
  const club = await Club.findById(req.params.id);
  res.render('editPasswordPrompt', { club });
});

// Route to handle password validation
app.post('/validate-password/:id', async (req, res) => {
  const { password } = req.body;
  const club = await Club.findById(req.params.id);

  if (club.password === password) {
      // If password is correct, redirect to the event edit form
      res.redirect(`/add-event/${req.params.id}`);
  } else {
      // If password is incorrect, show error message
      res.render('editPasswordPrompt', { club, error: 'Incorrect password. Please try again.' });
  }
});

// Route to render the add event form (after password validation)
app.get('/add-event/:clubId', (req, res) => {
  const clubId = req.params.clubId;
  res.render('addEvent', { clubId });  // Make sure 'addEvent.ejs' exists
});

// Handle event addition
app.post('/add-event/:clubId', (req, res) => {
  const { eventName, eventDate } = req.body;
  const clubId = req.params.clubId;

  Club.findById(clubId)
      .then(club => {
          if (!club) {
              return res.status(404).send("Club not found.");
          }

          // Add event to the club's event list
          club.events.push({ eventName, eventDate });
          return club.save();
      })
      .then(() => {
          res.redirect('/home');  // Redirect back to home or some other page
      })
      .catch(err => {
          console.error("Error adding event:", err);
          res.status(500).send("An error occurred while adding the event.");
      });
});


app.get('/request-to-join/:clubId', (req, res) => {
    Club.findById(req.params.clubId)
        .then(club => {
            if (!club) {
                return res.status(404).send("Club not found.");
            }
            res.render('requestToJoin', { club });  // Render a form where the user can enter their name
        })
        .catch(err => {
            console.error("Error fetching club:", err);
            res.status(500).send("An error occurred while retrieving the club.");
        });
});

app.post('/submit-request/:clubId', (req, res) => {
    const { name } = req.body;
    const clubId = req.params.clubId;

    Club.findById(clubId)
        .then(club => {
            if (!club) {
                return res.status(404).send("Club not found.");
            }

            // Ensure requests array exists and add the user's name to the requests list
            club.requests = club.requests || [];
            club.requests.push(name);

            // Save the updated club information
            return club.save().then(() => club); // Return club after saving
        })
        .then(club => {
            // Create and save the requested user document with user's name and club name
            const requestedUser = new RequestedUser({
                name: name,
                clubName: club.name
            });
            return requestedUser.save().then(() => club); // Return club after saving requested user
        })
        .then(club => {
            // Render the success page with the club name and user's name
            res.render('requestSuccess', { clubName: club.name, userName: name });
        })
        .catch(err => {
            console.error("Error handling request:", err);
            res.status(500).send("An error occurred while processing your request.");
        });
});

app.get('/club-details/:clubId', (req, res) => {
    const clubId = req.params.clubId;

    // Find the club by its ID
    Club.findById(clubId)
        .then(club => {
            if (!club) {
                return res.status(404).send("Club not found.");
            }

            // Fetch all the requests for this club from the RequestedUser collection
            RequestedUser.find({ clubName: club.name })  // Fetch requests for this club
                .then(requestedUsers => {
                    // Render the club details along with the requests
                    res.render('viewClubDetails', {
                        club: club,           // Pass club details
                        requestedUsers: requestedUsers // Pass the list of requested users
                    });
                })
                .catch(err => {
                    console.error("Error fetching requests:", err);
                    res.status(500).send("An error occurred while fetching requests.");
                });
        })
        .catch(err => {
            console.error("Error finding club:", err);
            res.status(500).send("An error occurred while fetching the club details.");
        });
});
app.get('/search-clubs', (req, res) => {
    const query = req.query.query;
    Club.find({ name: new RegExp('^' + query, 'i') }, (err, clubs) => {
        if (err) {
            return res.redirect('/home');
        }
        res.render('join-club', { clubs });
    });
});
app.get('/search-edit-clubs', (req, res) => {
    const query = req.query.query;
    Club.find({ name: new RegExp('^' + query, 'i') }, (err, clubs) => {
        if (err) {
            return res.redirect('/home');
        }
        res.render('edit-club-password', { clubs });
    });
});
// Route to prompt for the club password before scheduling an event
app.get('/schedule-event/:clubId', async (req, res) => {
    const club = await Club.findById(req.params.clubId);
    res.render('editPasswordPrompt', { club });
  });
  // Route to handle password validation
app.post('/validate-event-password/:clubId', async (req, res) => {
    const { password } = req.body;
    const club = await Club.findById(req.params.clubId);
  
    if (club.password === password) {
        // If password is correct, redirect to the event scheduling form
        res.redirect(`/add-event/${req.params.clubId}`);
    } else {
        // If password is incorrect, show error message
        res.render('editPasswordPrompt', { club, error: 'Incorrect password. Please try again.' });
    }
  });
  // Route to delete a club
app.post('/delete-club/:clubId', (req, res) => {
    const clubId = req.params.clubId;
    console.log(`Attempting to delete club with ID: ${clubId}`);

    Club.findByIdAndDelete(clubId)
        .then(() => {
            console.log(`Club with ID: ${clubId} deleted successfully`);
            res.redirect('/home');  // Redirect to home after deletion
        })
        .catch(err => {
            console.error("Error deleting club:", err);
            res.status(500).send("An error occurred while deleting the club.");
        });
});

// Start server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000/login');
});
