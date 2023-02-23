const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    imageUrl: String!
    content: String!
    creator: ID!
    createdAt: String!
    updateAt: String!
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
  
  type RootMutation {
    createUser(userInput: UserInputData): User!
  }
  type RootQuery {
    login(email: String!, password: String) : AuthData! 
  }
  
  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);
