const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: 1,
        title: 'First post',
        content: 'This is the first post',
        imageUrl: 'images/book.jpeg',
        createdAt: new Date(),
        creator: {
          name: 'Mykola',
        },
      },
    ],
  });
};

exports.createPosts = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  const { title, content } = req.body;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: 'images/car.jpeg',
    creator: {
      name: 'Mykola',
    },
  });
  post
    .save()
    .then((result) => {
      res.status(201).json({
        message: 'Post created successfully',
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
