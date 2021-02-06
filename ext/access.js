
// Access control functions
const userIsAdmin = ({ authentication: { item: user } }) => Boolean(user && user.isAdmin);
const userIsLoggedIn = ({ authentication: { item: user } }) => Boolean(user && true);
const userOwnsItem = (obj, obj2) => {
  console.log("IOAN")
  console.log(obj)
  console.log(obj2)
  let user = obj.authentication.item.user
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

const access = { userIsAdmin, userOwnsItem, userIsAdminOrOwner, userIsLoggedIn }


const personalAccess = {
  read: access.userIsAdminOrOwner,
  update: access.userIsAdminOrOwner,
  create: access.userIsAdmin,
  delete: access.userIsAdmin,
  auth: true,
}

const hiddenAccess = {
  read: true,
  update: access.userIsAdmin,
  create: access.userIsAdmin,
  delete: access.userIsAdmin,
  auth: true,
}

const hiddenAndAutomatedAccess = {
  read: true,
  update: access.userIsAdmin,
  create: access.userIsAdmin,
  delete: access.userIsAdmin,
  auth: true,
}


module.exports = { ...access, personalAccess, hiddenAccess, hiddenAndAutomatedAccess };