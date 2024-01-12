const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


// generates a 6 char length string
const generateRandomString = function() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  const charLength = chars.length;
  let result = '';

  let i = 0;
  while (i < 6) {
    result += chars.charAt(Math.floor(Math.random() * charLength));
    i++;
  }
  return result;
};

// function to search for existing users/email. If exists, return user object, else return null
const userLookup = function(newEmail) {
  for (let user in users) {
    if (newEmail === users[user].email) {
      return user;
    }
  }
  return null;
};


// function to return currents users urls from the urlDatabase
const urlsForUser = function(id) {
  const urls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID == id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls
}

const cookieParser = require('cookie-parser');
app.use(cookieParser());

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
  if ( req.cookies["user_id"]) {
    res.redirect('/urls')
  };
  const templateVars = {
    users: users,
    user_id: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {

  // if logged in redirect to /urls
  if ( req.cookies["user_id"]) {
    res.redirect('/urls')
  };

  const templateVars = {
    users: users,
    user_id: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("login", templateVars);

});

app.get("/urls/new", (req, res) => {
// if not logged in redirect to login page
  if ( !req.cookies["user_id"]) {
    res.redirect('/login')
  };
  const templateVars = {
    users: users,
    user_id: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  //check if loggeed in
  if ( !req.cookies["user_id"]) {
    res.redirect('/please_login')
  };


  // check if short url is valid
  if (!urlDatabase[req.params.id]){
    res.send("ERROR: URL id does not exist")
  } 

  const usersURLs = urlsForUser(req.cookies["user_id"])
  let ownership = false
  for ( const short in usersURLs) {
    if (short === req.params.id) {
      ownership = true;
    }
  } 
  if (!ownership) {
    res.send('You do not have access to this page.')
  } else {

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    users: users,
    user_id: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
 };
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  // check if logged in
  if ( !req.cookies["user_id"]) {
    res.redirect('/please_login')
  } else {

  let urls = urlsForUser(req.cookies["user_id"])
  const templateVars = {
    users: users,
    user_id: req.cookies["user_id"],
    urls: urls
  };
  console.log(templateVars);
  res.render("urls_index", templateVars);
  };
});

app.get("/u/:id", (req, res) => {
  //check if short url is valid
  if (!urlDatabase[req.params.id]){
    res.send("ERROR: URL id does not exist")
  } else {
  const id = req.params.id;
  res.redirect(urlDatabase[id].longURL);
  };
})

app.get("/please_login", (req, res) => {

  // if logged in redirect to /urls
  if ( req.cookies["user_id"]) {
    res.redirect('/urls')
  };

  const templateVars = {
    users: users,
    user_id: req.cookies["user_id"],
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

  if (!req.cookies["user_id"]) {
    res.send("Must be logged in to shorten URLs.")
  } else {
  console.log(req.body); // Log the POST request body to the console
  let shortID = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortID] = {
    longURL: longURL,
    userID: req.cookies["user_id"],
  };
  res.redirect(`/urls/${shortID}`);
  }
});

app.post('/urls/:id/delete', (req, res) => {
  const usersURLs = urlsForUser(req.cookies["user_id"])
  let ownership = false
  for ( const short in usersURLs) {
    if (short === req.params.id) {
      ownership = true;
    }
  } 
  if (!ownership) {
    res.send('You do not have access to this command.')
  } else {
  const urlId = req.params.id;
  delete urlDatabase[urlId];

  // After deletion, redirect to the URLs page:
  res.redirect('/urls');
  }
});

app.post('/urls/:id/edit', (req, res) => {
  const usersURLs = urlsForUser(req.cookies["user_id"])
  let ownership = false
  for ( const short in usersURLs) {
    if (short === req.params.id) {
      ownership = true;
    }
  } 
  if (!ownership) {
    res.send('You do not have access to this command.')
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
  let userN = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  //error handling for registration
  if (email === "" || password === "") {
    res.status(400).send('Email/Password cannot be blank');
  }
  if (userLookup(email)) {
    res.status(400).send('Email already in use');
  }

  users[userN] = {id: userN, email: email, password: hashedPassword};
  res.cookie("user_id", userN);
  res.redirect(`/urls`);
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  user = userLookup(email);

  //check if valid email and if valid password for email
  if (userLookup(email)) {
    if (bcrypt.compareSync(req.body.password, users[user].password)) {
      res.cookie("user_id", user);
      res.redirect('/urls');
      
    } else {
    res.status(403).send('Wrong Password.');
    }
  } else {
  res.status(403).send('Email cannot be found.');
  };
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
