'use strict';

const express = require('express');
const { check, validationResult } = require('express-validator/check');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const User = require('./models/user');

// Construct a router instance.
const router = express.Router();

//async handler function
function asyncHandler(cb){
    return async (req, res, next)=>{
        try {
        await cb(req,res, next);
        } catch(err){
        next(err);
        }
    };
}

//Authentication code
const authenticateUser = async (req, res, next) => {
    let message = null;
  
    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);
  
    // If the user's credentials are available...
    if (credentials) {
      // Attempt to retrieve the user from the data store
      // by their username (i.e. the user's "key"
      // from the Authorization header).
      const allUsers = await User.findAll();
      const user = allUsers.find(u => u.emailAddress === credentials.name);
  
      // If a user was successfully retrieved from the data store...
      if (user) {
        // Use the bcryptjs npm package to compare the user's password
        // (from the Authorization header) to the user's password
        // that was retrieved from the data store.
        const authenticated = bcryptjs
          .compareSync(credentials.pass, user.password);
  
        // If the passwords match...
        if (authenticated) {
          console.log(`Authentication successful for username: ${user.username}`);
  
          // Then store the retrieved user object on the request object
          // so any middleware functions that follow this middleware function
          // will have access to the user's information.
          req.currentUser = user;
        } else {
          message = `Authentication failure for username: ${user.username}`;
        }
      } else {
        message = `User not found for username: ${credentials.name}`;
      }
    } else {
      message = 'Auth header not found';
    }
  
    // If user authentication failed...
    if (message) {
      console.warn(message);
  
      // Return a response with a 401 Unauthorized HTTP status code.
      res.status(401).json({ message: 'Access Denied' });
    } else {
      // Or if user authentication succeeded...
      // Call the next() method.
      next();
    }
};

//GET route that returns the authenticated user.
router.get('/users', authenticateUser, (req, res) => {
    const authUser = req.currentUser;
    
    // Remove the password, createdAt, and updatedAt values.
    delete authUser.dataValues.password;
    delete authUser.dataValues.createdAt;
    delete authUser.dataValues.updatedAt;

    res.json({ authUser });
});

module.exports = router;