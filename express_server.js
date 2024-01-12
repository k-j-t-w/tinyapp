const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const helpers = require ('./helpers.js')

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "123456",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "123456",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};


// --- GETS ---

app.get("/", (req, res) => {
  res.redirect(`/urls`);
});

app.get("/register", (req, res) => {
  // if logged in redirect to /urls
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  const templateVars = {
    users: users,
    user_id: req.session.user_id,
    urls: urlDatabase
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {

  // if logged in redirect to /urls
  if (req.session.user_id) {
    res.redirect('/urls');
  }

  const templateVars = {
    users: users,
    user_id: req.session.user_id,
    urls: urlDatabase
  };
  res.render("login", templateVars);

});

app.get("/urls/new", (req, res) => {
// if not logged in redirect to login page
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    const templateVars = {
      users: users,
      user_id: req.session.user_id,
      urls: urlDatabase
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  //check if loggeed in
  if (!req.session.user_id) {
    res.redirect('/please_login');
  }


  // check if short url is valid
  if (!urlDatabase[req.params.id]) {
    res.send("ERROR: URL id does not exist");
  }

  if (!helpers.doesUserOwn(req.session.user_id, req.params.id, urlDatabase)) {
    res.send('You do not have access to this page.');
  } else {

    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      users: users,
      user_id: req.session.user_id,
      urls: urlDatabase
    };
    res.render("urls_show", templateVars);
  }
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  // check if logged in
  if (!req.session.user_id) {
    res.redirect('/please_login');
  } else {

    let urls = helpers.urlsForUser(req.session.user_id, urlDatabase);
    const templateVars = {
      users: users,
      user_id: req.session.user_id,
      urls: urls
    };
    console.log(templateVars);
    res.render("urls_index", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  //check if short url is valid
  if (!urlDatabase[req.params.id]) {
    res.send("ERROR: URL id does not exist");
  } else {
    const id = req.params.id;
    res.redirect(urlDatabase[id].longURL);
  }
});

app.get("/please_login", (req, res) => {

  // if logged in redirect to /urls
  if (req.session.user_id) {
    res.redirect('/urls');
  }

  const templateVars = {
    users: users,
    user_id: req.session.user_id,
    urls: urlDatabase
  };
  res.render("please_login", templateVars);

});

// --- POSTS ---

// updates the longURL value to the specified new value
app.post('/urls/:id', (req, res) => {

  const updatedURL = req.body.longURL;
  const urlId = req.params.id;
  urlDatabase[urlId].longURL = updatedURL;
  res.redirect(`/urls/${urlId}`);

});

// POST for new URL creation
app.post("/urls", (req, res) => {

  if (!req.session.user_id) {
    res.send("Must be logged in to shorten URLs.");
  } else {
    console.log(req.body); // Log the POST request body to the console
    let shortID = helpers.generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortID] = {
      longURL: longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${shortID}`);
  }
});

app.post('/urls/:id/delete', (req, res) => {
  if (!helpers.doesUserOwn(req.session.user_id, req.params.id, urlDatabase)) {
    res.send('You do not have access to this command.');
  } else {
    const urlId = req.params.id;
    delete urlDatabase[urlId];

    // After deletion, redirect to the URLs page:
    res.redirect('/urls');
  }
});

app.post('/urls/:id/edit', (req, res) => {
  if (!helpers.doesUserOwn(req.session.user_id, req.params.id, urlDatabase)) {
    res.send('You do not have access to this command.');
  } else {
    const urlId = req.params.id;
  
    res.redirect(`/urls/${urlId}`);
  }
});

app.post('/loginButton', (req, res) => {
  res.redirect('/login');
});

app.post('/registerButton', (req, res) => {
  res.redirect('/register');
});

app.post('/register', (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let userN = helpers.generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  //error handling for registration
  if (email === "" || password === "") {
    res.status(400).send('Email/Password cannot be blank');
  }
  if (helpers.getUserByEmail(email, users)) {
    res.status(400).send('Email already in use');
  } else {

  users[userN] = {id: userN, email: email, password: hashedPassword};
  req.session.user_id = userN;
  res.redirect(`/urls`);
  };
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const user = helpers.getUserByEmail(email, users);

  //check if valid email and if valid password for email
  if (helpers.getUserByEmail(email, users)) {
    if (bcrypt.compareSync(req.body.password, users[user].password)) {
      req.session.user_id = user;
      res.redirect('/urls');
      
    } else {
      res.status(403).send('Wrong Password.');
    }
  } else {
    res.status(403).send('Email cannot be found.');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
