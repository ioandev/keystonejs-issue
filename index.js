const { Keystone } = require('@keystonejs/keystone');
const { PasswordAuthStrategy } = require('@keystonejs/auth-password');
const { Text, Integer, Checkbox, Password, DateTimeUtc, Relationship } = require('@keystonejs/fields');
const { GraphQLApp } = require('@keystonejs/app-graphql');
const { AdminUIApp } = require('@keystonejs/app-admin-ui');
const initialiseData = require('./initial-data');
const { Content } = require('@keystonejs/fields-content');
const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose');
const PROJECT_NAME = 'Next Stone';
const adapterConfig = { mongoUri: 'mongodb://localhost/next-stone' };
const express = require('express')

const keystone = new Keystone({
  adapter: new Adapter(adapterConfig),
  onConnect: process.env.CREATE_TABLES !== 'true' && initialiseData,
});

// Access control functions
const userIsAdmin = ({ authentication: { item: user } }) => Boolean(user && user.isAdmin);
const userOwnsItem = ({ authentication: { item: user } }) => {
  if (!user) {
    return false;
  }

  // Instead of a boolean, you can return a GraphQL query:
  // https://www.keystonejs.com/api/access-control#graphqlwhere
  return { id: user.id };
};

const userIsAdminOrOwner = auth => {
  const isAdmin = access.userIsAdmin(auth);
  const isOwner = access.userOwnsItem(auth);
  return isAdmin ? isAdmin : isOwner;
};

const access = { userIsAdmin, userOwnsItem, userIsAdminOrOwner };

keystone.createList('User', {
  fields: {
    name: { type: Text },
    email: {
      type: Text,
      isUnique: true,
    },
    isAdmin: {
      type: Checkbox,
      // Field-level access controls
      // Here, we set more restrictive field access so a non-admin cannot make themselves admin.
      access: {
        update: access.userIsAdmin,
      },
    },
    password: {
      type: Password
    },
    articles: { type: Relationship, ref: 'Article.author', many: true },
  },
  // List-level access controls
  access: {
    read: access.userIsAdminOrOwner,
    update: access.userIsAdminOrOwner,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true,
  },
});

const { atTracking } = require('@keystonejs/list-plugins');

const articlesList = keystone.createList('Article', {
  fields: {
    author: { type: Relationship, ref: 'User.articles', many: false },
    uri: {
      type: Text,
      isUnique: true,
    },
    title: { type: Text },
    content: {
      type: Content,
      blocks: [
        Content.blocks.blockquote,
        Content.blocks.image,
        Content.blocks.link,
        Content.blocks.orderedList,
        Content.blocks.unorderedList,
        Content.blocks.heading,
      ],
    },
    description: { type: Text },
    linkToImg: { type: Text },
    liveFrom: { type: DateTimeUtc },
    views: { type: Integer },
  },
  // List-level access controls
  access: {
    read: true,
    update: access.userIsAdmin,
    create: access.userIsAdmin,
    delete: access.userIsAdmin,
    auth: true,
  },
  plugins: [
    atTracking(),
  ],
});

const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
});

const incrementPageViews = async (_, { id }) => {
  // pageList was defined above when we created the Page list
  const { adapter } = articlesList;

  const oldItem = await adapter.findById(id);
  let views = (oldItem.views || 0) + 1
  console.log(oldItem)
  const newItem = await adapter.update(id, {
    ...oldItem,
    views,
  });

  return {
    currentViews: newItem.views,
    timestamp: new Date().toUTCString(),
  };
};

const pageViewsOver = async (_, { id, threshold }, context) => {
  const {
    data: { views },
  } = await context.executeGraphql({
    query: `
    Article(where: { id: "${id}" }) {
      views
    }
  `,
  });

  return views > threshold;
};

keystone.extendGraphQLSchema({
  types: [
    {
      type: 'type IncrementPageViewsOutput { currentViews: Int!, timestamp: String! }',
    },
  ],
  mutations: [
    {
      schema: 'incrementPageViews(id: ID!): IncrementPageViewsOutput',
      resolver: incrementPageViews,
    },
  ],
  queries: [
    {
      schema: 'pageViewsOver(id: ID!, threshold: Int!): Boolean',
      resolver: pageViewsOver,
    },
  ],
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