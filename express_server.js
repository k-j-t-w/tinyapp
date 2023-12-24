const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


// generates a 6 char length string
function generateRandomString() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
  const charLength = chars.length;
  let result = '';

  let i=0
  while (i < 6) {
  result += chars.charAt(Math.floor(Math.random() * charLength));
  i++;
  }
  return result
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// individual url display pages based on the short url assigned
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// on POST redirects to urls/:id
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let shortID = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortID] = longURL;
  res.redirect(`/urls/${shortID}`)
});

app.post('/urls/:id/delete', (req, res) => {
  const urlId = req.params.id;
  // You'll need logic here to:
  // 1. Verify the user is logged in
  // 2. Verify the logged-in user owns the URL with urlId
  // ... put your logic here ...

  // If checks pass, delete the URL:
  delete urlDatabase[urlId];  // Assuming urlDatabase is where you store URLs

  // After deletion, redirect to the URLs page:
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
