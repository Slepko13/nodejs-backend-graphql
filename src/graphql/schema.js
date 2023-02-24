const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    imageUrl: String!
    content: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }
  
  type User {
     _id: ID!
     name: String!
     email: String!
     password: String
     posts: [Post]!
  }
  
  type AuthData {
    token: String!
    userId: String!
  }
    
  
  input UserInputData {
    email: String!
    name:String!
    password: String!
  }
  
  input PostInputData {
    title: String!
    content: String!
    imageUrl: String!
  }
  
  type postsData {
    posts: [Post!]!
    totalItems: Int
  }
  
  type RootMutation {
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
  }
  type RootQuery {
    loadPosts(page: Int): postsData
    loadSinglePost(postId: ID!): Post!
    login(email: String!, password: String!) : AuthData! 
  }
  
  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);
