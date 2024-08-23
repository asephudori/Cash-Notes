const { default: mongoose } = require('mongoose');
const User = require('../models/users.models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  // register
  register: async (req, res, next) => {
    try {
      let { username, email, password, confirmPassword } = req.body;

      // validate account
      let userExist = await User.findOne({ email });
      if (userExist) {
        return res.status(400).json({
          status: false,
          message: 'Bad request!',
          error: 'Account has been registered.',
          data: null,
        });
      }

      //validate max 50 character for username
      if (username.length > 50) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request!',
          error: 'Username max 50 character.',
          data: null,
        });
      }

      // validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: false,
          message: 'Bad request!',
          error: 'The email format is wrong.',
          data: null,
        });
      }

      // validate password length
      if (password.length < 8 || password.length > 15) {
        return res.status(400).json({
          status: false,
          message: 'Bad request!',
          error:
            'Password should have minimum 8 character or maximum 15 character.',
          data: null,
        });
      }

      //validate password and confirmPassword
      if (password !== confirmPassword) {
        return res.status(400).json({
          status: false,
          message: 'Bad request!',
          error: "Password and Confirm Password didn't match.",
          data: null,
        });
      }

      // encrypting password
      let encryptedPassword = await bcrypt.hash(password, 10);

      // create user
      let createUser = await User.create({
        username,
        email,
        password: encryptedPassword,
      });

      //set jwt
      let token = jwt.sign(
        { account_id: createUser.account_id, email: createUser.email },
        JWT_SECRET_KEY
      );

      // success response
      res.status(201).json({
        status: true,
        message: 'Register successfully.',
        data: {
          createUser: {
            username: createUser.username,
            email: createUser.email,
          },
          jwt: token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Login
  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;

      // validate account
      let userLogin = await User.findOne({ email });
      if (!userLogin) {
        return res.status(400).json({
          status: false,
          message: 'Bad request!',
          error: 'Invalid Email or Password.',
          data: null,
        });
      }

      let isPasswordCorrect = await bcrypt.compare(password, User.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error: 'Invalid Email or Password',
        });
      }

      // jwt
      let token = jwt.sign(
        { id: User.account_id, email: User.email },
        JWT_SECRET_KEY
      );

      // set token cookie
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30 * 1000,
      });

      // success response
      return res.status(200).json({
        status: true,
        message: 'Login successfully.',
        data: {
          user: {
            username: userLogin.username,
            email: userLogin.email,
          },
          jwt: token,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
