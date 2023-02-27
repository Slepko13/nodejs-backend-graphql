const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');
const { clearImage } = require('../utils/utils');

module.exports = {
  login: async function ({ email, password }) {
    let user = await User.findOne({ email });
    if (!user) {
      const error = new Error('User doesn"t exist!');
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Wrong password!!');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      'secret',
      { expiresIn: '4h' }
    );
    return {
      token,
      userId: user._id.toString(),
    };
  },
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
      const error = new Error('Invalid input for new user');
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
  createPost: async function ({ postInput }, req) {
    const { title, content, imageUrl } = postInput;
    const { isAuth, userId } = req;
    if (!isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 3 })) {
      errors.push({ message: 'Title is invalid' });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input for new post');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    let user = await User.findById(userId);
    if (!user) {
      const error = new Error('Invalid user');
      error.code = 401;
      throw error;
    }

    let post = new Post({
      title,
      content,
      imageUrl,
      creator: user,
    });
    post = await post.save();
    user.posts.push(post);
    await user.save();
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  loadPosts: async function ({ page }, req) {
    const { isAuth } = req;
    if (!isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalItems,
    };
  },
  loadSinglePost: async function ({ postId }, req) {
    const { isAuth } = req;
    if (!isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    let post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    return {
      ...post._doc,
      id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  updatePost: async function ({ postId, postInput }, req) {
    const { title, content, imageUrl } = postInput;
    const { isAuth, userId } = req;
    if (!isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 3 })) {
      errors.push({ message: 'Title is invalid' });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input for new post');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    let post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== userId.toString()) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
    post.title = title;
    post.content = content;
    if (imageUrl !== 'undefined') {
      post.imageUrl = imageUrl;
    }
    await post.save();
    return {
      ...post._doc,
      id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  deletePost: async function ({ postId }, req) {
    const { isAuth, userId } = req;
    if (!isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(userId);
    user.posts.pull(postId);
    await user.save();
    return 'Post deleted';
  },
  getUser: async function (args, req) {
    const { isAuth, userId } = req;
    if (!isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User doesn't exist");
      error.statusCode = 401;
      throw error;
    }
    return {
      ...user._doc,
      id: user._id.toString(),
    };
  },
  setStatus: async function ({ status }, req) {
    const { isAuth, userId } = req;
    if (!isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User doesn't exist");
      error.statusCode = 401;
      throw error;
    }
    user.status = status;
    await user.save();
    return 'Status updated';
  },
};
