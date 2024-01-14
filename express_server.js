const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const helpers = require('./helpers.js');
const methodOverride = require('method-override');

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

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

const viewsDatabase = {
  randomUrl: "viewcount",
};

const uniqueUserDatabase = {
  randomUrl: {
    users: ["array", "of", "Users"]
  }
};

const visitDisplay = {
  url: {
    date: "Date",
    visitor_id: "Visitor",
  }
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
    return res.redirect('/please_login');
  }

  // check if short url is valid
  if (!urlDatabase[req.params.id]) {
    return res.send("ERROR: URL id does not exist");
  }

  // check if user owns url
  if (!helpers.doesUserOwn(req.session.user_id, req.params.id, urlDatabase)) {
    return res.send('You do not have access to this page.');
  }


  // page view counter
  viewsDatabase[req.params.id] = (viewsDatabase[req.params.id] || 0) + 1;

  //uniqueUsers counter
  if (!uniqueUserDatabase[req.params.id]) {
    uniqueUserDatabase[req.params.id] = { users: [req.session.user_id] };
  } else {
    if (uniqueUserDatabase[req.params.id].users.includes(req.session.user_id)) {
      null;
    } else {
      uniqueUserDatabase[req.params.id].users.push(req.session.user_id);
    }
  }

  // visits display
  let timestamp = Date.now();
  if (visitDisplay[req.params.id]) {
    visitDisplay[req.params.id].push({
      date: new Date(timestamp),
      visitor_id: req.session.user_id,
    });
  } else {
    visitDisplay[req.params.id] = [{
      date: new Date(timestamp),
      visitor_id: req.session.user_id,
    }];
  }


  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    users: users,
    user_id: req.session.user_id,
    urls: urlDatabase,
    pageViews: viewsDatabase[req.params.id],
    uniqueVisitors: uniqueUserDatabase[req.params.id].users.length,
    visitDisplay: visitDisplay[req.params.id]
  };

  console.log("show route");
  res.render("urls_show", templateVars);

});

app.get("/urls", (req, res) => {
  // check if logged in
  if (!req.session.user_id) {
    return res.redirect('/please_login');
  }
  console.log("In get URLS");
  const urls = helpers.urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    users: users,
    user_id: req.session.user_id,
    urls: urls
  };
  res.render("urls_index", templateVars);
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
app.put('/urls/:id', (req, res) => {

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

app.delete('/urls/:id', (req, res) => {
  console.log("delete route");
  if (!helpers.doesUserOwn(req.session.user_id, req.params.id, urlDatabase)) {
    res.send('You do not have access to this command.');
  } else {
    const urlId = req.params.id;
    delete urlDatabase[urlId];
    res.redirect('/urls');
  }
});

app.post('/register', (req, res) => {
  console.log("In register"); 
  let userN = helpers.generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  //error handling for registration
  if (email === "" || password === "") {
    return res.status(400).send('Email/Password cannot be blank');
  }

  if (helpers.getUserByEmail(email, users)) {
    return res.status(400).send('Email already in use');
  }

  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[userN] = { id: userN, email: email, password: hashedPassword };
  req.session.user_id = userN;
  res.redirect("/urls");
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
