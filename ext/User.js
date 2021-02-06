
const { atTracking } = require('@keystonejs/list-plugins');


const { Text, Checkbox, Password } = require('@keystonejs/fields');

const access = require('./access')
console.log("import")
console.log(access)

module.exports = function (keystone) {
    let usersList = keystone.createList('User', {
        fields: {
        name: { type: Text },
        email: {
            type: Text,
            isUnique: true,
            access: access.personalAccess,
        },
        isAdmin: {
            type: Checkbox,
            // Field-level access controls
            // Here, we set more restrictive field access so a non-admin cannot make themselves admin.
            access: Object.assign({}, access.personalAccess, {
            update: access.userIsAdmin,
            }),
        },
        password: {
            type: Password,
            access: access.personalAccess
        },
        },
        // List-level access controls
        access: {
        read: true,
            update: access.userIsAdminOrOwner,
            create: access.userIsAdmin,
            delete: access.userIsAdmin,
            auth: true,
        },
    });

    return usersList;
}