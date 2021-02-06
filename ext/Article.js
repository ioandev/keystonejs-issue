
const { atTracking } = require('@keystonejs/list-plugins');

const { Text, Integer, DateTimeUtc, Relationship } = require('@keystonejs/fields');
const access = require('./access')
const { Content } = require('@keystonejs/fields-content');


const incrementPageViews = (articlesList) => async (obj, obj2) => {
    console.log("ALEX")
    console.log(obj)
    console.log(obj2)
    let id2 = obj2.id
    // pageList was defined above when we created the Page list
    const { adapter } = articlesList;

    const oldItem = await adapter.findById(id2);
    let views = (oldItem.views || 0) + 1
    console.log(oldItem)
    delete oldItem.__v
    console.log("JAMES")
    console.log(oldItem)

    let author = oldItem.author
    let uri = oldItem.uri
    let title = oldItem.title
    let description = oldItem.description
    let linkToImg = oldItem.linkToImg
    let id = oldItem.id
    let updatedAt_utc = oldItem.updatedAt_utc
    let updatedAt_offset = oldItem.updatedAt_offset
    let createdAt_utc = oldItem.createdAt_utc
    let createdAt_offset = oldItem.createdAt_offset
    let content = oldItem.content
    let updatedAt = oldItem.updatedAt
    let createdAt = oldItem.createdAt
    let __v = oldItem.__v

    const newItem = await adapter.update(id, {
        views,
        /*author,
        uri,
        title,
        description,
        linkToImg,
        content,
        updatedAt,
        createdAt,
        updatedAt_offset,
        updatedAt_utc,
        createdAt_offset,
        createdAt_utc
        */
    });

    return {
        currentViews: newItem.views,
        timestamp: new Date().toUTCString(),
    };
};

const pageViewsOver = (articlesList) => async (_, { id, threshold }, context) => {
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


module.exports = function(keystone) {
    const articlesList = keystone.createList('Article', {
        fields: {
            author: { type: Relationship, ref: 'User', many: false },
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
            views: {
                type: Integer,
                access: access.hiddenAccess,
                hidden: true,
                initial: false,
            },
        },
        // List-level access controls
        access: {
            read: true,
            update: access.userIsLoggedIn,
            create: access.userIsLoggedIn,
            delete: access.userIsAdmin,
            auth: true,
        },
        plugins: [
            atTracking(),
        ],
        labelResolver: item => item.title,
    });
    
  
  keystone.extendGraphQLSchema({
    types: [
      {
        type: 'type IncrementPageViewsOutput { currentViews: Int!, timestamp: String! }',
      },
    ],
    mutations: [
      {
        schema: 'incrementPageViews(id: ID!): IncrementPageViewsOutput',
        resolver: incrementPageViews(articlesList),
      },
    ],
    queries: [
      {
        schema: 'pageViewsOver(id: ID!, threshold: Int!): Boolean',
        resolver: pageViewsOver(articlesList),
      },
    ],
  });

  

  return articlesList
}