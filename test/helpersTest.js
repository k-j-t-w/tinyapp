const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID, "getUserByEmail return the valid email")
  });

  it('should return null with non-valid email', function() {
    const user = getUserByEmail("Kai@example.com", testUsers)
    const expectedUserID = null;
    assert.equal(user, null, "getUserByEmail returns null on non-valid email")
  });
});