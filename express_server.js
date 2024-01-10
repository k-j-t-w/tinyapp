const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


// generates a 6 char length string
function generateRandomString() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  const charLength = chars.length;
  let result = '';

  let i = 0;
  while (i < 6) {
    result += chars.charAt(Math.floor(Math.random() * charLength));
    i++;
  }
  return result;
}

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/register", (req, res) => {
  const templateVars = {
    users: users,
    user_id: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("register", templateVars)

})

app.get("/urls/new", (req, res) => {
  const templateVars = {
    users: users,
    user_id: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    users: users,
    user_id: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// updates the longURL value to the specified new value
app.post('/urls/:id', (req, res) => {
  const updatedURL = req.body.longURL;
  const urlId = req.params.id;
  urlDatabase[urlId] = updatedURL;
  res.redirect(`/urls/${urlId}`);

});

// on POST redirects to urls/:id
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let shortID = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortID] = longURL;
  res.redirect(`/urls/${shortID}`);
});

app.post('/urls/:id/delete', (req, res) => {
  const urlId = req.params.id;
  delete urlDatabase[urlId];

  // After deletion, redirect to the URLs page:
  res.redirect('/urls');
});

app.post('/urls/:id/edit', (req, res) => {
  const urlId = req.params.id;
  
  res.redirect(`/urls/${urlId}`);
});

app.post('/login', (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let userN = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  users[userN] = {id: userN, email: email, password: password};
  res.cookie("user_id", userN);
  res.redirect(`/urls`);
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const templateVars = {
    users: users,
    user_id: req.cookies["user_id"],
    urls: urlDatabase
  };
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
