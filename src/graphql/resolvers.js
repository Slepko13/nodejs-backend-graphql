const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

module.exports = {
  createUser: async function (args, req) {
    const {
      userInput: { email, name, password },
    } = args;
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: 'E-mail is invalid' });
    }
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({ message: 'Password is invalid' });
    }
    if (validator.isEmpty(name) || !validator.isLength(name, { min: 3 })) {
      errors.push({ message: 'Name is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    let user = await User.findOne({ email });
    if (user) {
      const error = new Error('User already exist!');
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user = new User({
      email,
      password: hashedPassword,
      name,
    });
    user = await user.save();
    return {
      ...user._doc,
      _id: user._id.toString(),
    };
  },
};
