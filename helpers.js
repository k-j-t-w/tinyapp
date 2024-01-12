
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
const getUserByEmail = function(newEmail, database) {
  for (let user in database) {
    if (newEmail === database[user].email) {
      return user;
    }
  }
  return null;
};


// function to return currents users urls from the urlDatabase
const urlsForUser = function(id, database) {
  const urls = {};
  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      urls[shortURL] = database[shortURL];
    }
  }
  return urls;
};

// function to return a boolean for ownership
const doesUserOwn = function(userId, user, database) {
  const usersURLs = urlsForUser(userId, database);
  let ownership = false;
  for (const short in usersURLs) {
    if (short === user) {
      ownership = true;
    }
  }
  return ownership;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser, doesUserOwn }