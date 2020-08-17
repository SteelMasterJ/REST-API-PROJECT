'use strict';

const express = require('express');


// Construct a router instance.
const router = express.Router();

const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const Isemail = require('isemail');
const { User } = require('./models');
const { Course } = require('./models');


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

//Authentication function
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
          console.log(`Authentication successful for username: ${user.emailAddress}`);
  
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


//*** USER ROUTES ***//


//GET route that returns the authenticated user.
router.get('/users', authenticateUser, asyncHandler( async (req, res) => {
    const user = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'emailAddress'], // filters out password, createdAt, and updatedAt
      where: {
        emailAddress: req.currentUser.emailAddress //displays only the logged in user
      }
    });
    res.json(user);
}));

//POST route that creates a new user
router.post('/users', asyncHandler(async (req, res) => {
  const newUser = req.body;
  const allUsers = await User.findAll();
  const existingUser = allUsers.find(u => u.emailAddress === newUser.emailAddress);
  const errors = [];
  
  if(!newUser.firstName) {
    errors.push('Please provide a value for "firstName".')
  } 

  if(!newUser.lastName) {
    errors.push('Please provide a value for "lastName".')
  }

  if(!newUser.emailAddress) {
    errors.push('Please provide a value for "emailAddress".')
  } else if (!Isemail.validate(newUser.emailAddress)) {
    errors.push('Please provide a valid email.')
  } else if(existingUser) {
    errors.push('Sorry, this user already exists')
  }

  if(!newUser.password) {
    errors.push('Please provide a value for "password".')
  } else {
    newUser.password = bcryptjs.hashSync(newUser.password);
  }

  if(errors.length > 0) {
    res.status(400).json({errors});
  } else {
    const user = await User.create(newUser); 
    res.status(201).location('/').end();
  }
  
}));



//*** COURSE ROUTES ***//



//GET route that returns a list of courses (including the user that owns each course)
router.get('/courses', asyncHandler(async(req, res) => {
  const courses = await Course.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ["id", "firstName", "lastName", "emailAddress"]
      },      
    ],
      attributes: ["id", "title", "description", "estimatedTime", "materialsNeeded", "userId"]
  });
    res.json(courses);
}));

//GET route returns a the course (including the user that owns the course) for the provided course ID
router.get('/courses/:id', asyncHandler(async(req, res) => {
  const course = await Course.findByPk(req.params.id, {
    attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded'],
    include: [{
      model: User,
      as: 'user',
      attributes: ["id","firstName","lastName", "emailAddress"]
    }]
  });
  if(course) {
    res.json(course);
  } else {
    res.status(404).json({message: "Sorry, there is no course with that id."});
  }
}));

//POST route that creates a course, sets the Location header to the URI for the course, and returns no content
router.post('/courses', authenticateUser, asyncHandler(async(req, res) => {
  const newCourse = req.body;
  // console.log(req.body);
  const errors = [];

  if(!newCourse.title) {
    errors.push('Please provide a value for "title".');
  }

  if(!newCourse.description) {
    errors.push('Please provide a value for "description".');
  }

  if(errors.length > 0) {
    res.status(400).json({errors});
  } else {
    const course = await Course.create(newCourse);

    const id = course.dataValues.id;
  
    res.status(201).location('/api/courses/' + id).end();
  }
}));

//PUT route that updates a course and returns no content
router.put('/courses/:id', authenticateUser, asyncHandler(async(req, res) => {
  const authUser = req.currentUser;
  const course = await Course.findByPk(req.params.id);
  let errors = [];

  if(authUser.id === course.userId) {

    if(!req.body.title) {
      errors.push('Please provide a value for "title".');
    }
  
    if(!req.body.description) {
      errors.push('Please provide a value for "description".');
    }
  
    if(errors.length > 0) {
      res.status(400).json({errors});
  
    } else {
      await course.update({
        title: req.body.title,
        description: req.body.description,
        estimatedTime: req.body.estimatedTime,
        materialsNeeded: req.body.materialsNeeded,
        userId: req.currentUser.id,
      });
    
      res.status(204).end();
    }
  } else {
    errors.push('You are not authorized to edit this course.')
    res.status(403).json({errors}).end();
  }
}));

//DELETE route that deletes a course and returns no content
router.delete('/courses/:id', authenticateUser, asyncHandler(async(req, res) => {
  const course = await Course.findByPk(req.params.id);

  // if(req.params.id !== req.currentUser.id) {
  //   res.status(403).json({message: "Forbidden: this isn't your course"}).end();
  // }
  if(course && course.userId === req.currentUser.id){
    await course.destroy();

    res.status(204).end();
  } else if (!course){
    res.status(404).json({
      message: "That course id does not exist."
    })
  } else {
    res.status(403).json({message: "Forbidden: this isn't your course"}).end();
  }

}));

module.exports = router;