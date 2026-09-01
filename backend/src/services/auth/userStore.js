const users = new Map();

const findByEmail = (email) => {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return null;
};

const findById = (id) => users.get(id) || null;

const save = (user) => {
  users.set(user.id, user);
  return user;
};

module.exports = {
  findByEmail,
  findById,
  save,
};
