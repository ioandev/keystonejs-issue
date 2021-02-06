const { Keystone } = require('@keystonejs/keystone');
const { PasswordAuthStrategy } = require('@keystonejs/auth-password');
const { GraphQLApp } = require('@keystonejs/app-graphql');
const { AdminUIApp } = require('@keystonejs/app-admin-ui');
const initialiseData = require('./initial-data');
const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose');
const PROJECT_NAME = 'Next Stone';
const adapterConfig = { mongoUri: 'mongodb://localhost/next-stone' };
const express = require('express')

let adapter = new Adapter(adapterConfig)
console.log(adapter)
const keystone = new Keystone({
  adapter,
  onConnect: process.env.CREATE_TABLES !== 'true' && initialiseData,
});


const userList = require('./ext/User')(keystone)
const articlesList = require('./ext/Article')(keystone)


const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
});


module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new AdminUIApp({
      name: PROJECT_NAME,
      enableDefaultRoute: true,
      authStrategy,
    }),
  ],
  configureExpress: (app) => {
    console.log("Configured")
    app.use(express.json({limit: '50mb'}));
    app.use(express.urlencoded({limit: '50mb'}));
  },
};