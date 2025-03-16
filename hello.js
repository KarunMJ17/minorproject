app.post('/request-to-join/:clubId', (req, res) => {
    const { name } = req.body;  // Expecting a 'name' field in the form

    if (!name) {
        return res.status(400).send('Name is required to request to join the club.');
    }

    const clubId = req.params.clubId;

    // Find the club by ID and add the request with the user's name
    Club.findById(clubId)
        .then(club => {
            if (!club) {
                return res.status(404).send("Club not found.");
            }

            // Ensure requests array exists
            club.requests = club.requests || [];
            club.requests.push(name);  // Add the user's name to the request list
            return club.save();
        })
        .then(() => {
            // Redirect or render a success message
            res.render('requestSucces', { clubName: club.name, userName: name });
        })
        .catch(err => {
            console.error("Error handling request:", err);
            res.status(500).send("An error occurred while processing your request.");
        });
});

app.post('/request-to-join/:clubId', (req, res) => {
    const { name } = req.body;  // Expecting a 'name' field in the form

    if (!name) {
        return res.status(400).send('Name is required to request to join the club.');
    }

    const clubId = req.params.clubId;

    // Find the club by ID and add the request with the user's name
    Club.findById(clubId)
        .then(club => {
            if (!club) {
                return res.status(404).send("Club not found.");
            }

            // Ensure requests array exists
            club.requests = club.requests || [];
            club.requests.push(name);  // Add the user's name to the request list
            return club.save();
        })
        .then(() => {
            res.send(`Your request to join the club has been sent.`);
        })
        .catch(err => {
            console.error("Error handling request:", err);
            res.status(500).send("An error occurred while processing your request.");
        });
});
