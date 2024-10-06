const dbConfig = require("../config/db.config.js");
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: dbConfig.C_CLOUD_NAME,
  api_key: dbConfig.C_API_KEY,
  api_secret: dbConfig.C_API_SECRET
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection do DB has been established successfully.");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
})();

const db = {};
db.sequelize = sequelize;

db.user = require("./users.model.js")(sequelize, DataTypes);
db.post = require('./posts.model.js')(sequelize, DataTypes);
db.like = require('./likes.model.js')(sequelize, DataTypes);
db.comment = require('./comments.model.js')(sequelize, DataTypes);

db.user.hasMany(db.comment, { onDelete: 'CASCADE' })
db.comment.belongsTo(db.user)

db.user.hasMany(db.like, { onDelete: 'CASCADE' })
db.like.belongsTo(db.user)

db.post.hasMany(db.comment, { onDelete: 'CASCADE' })
db.comment.belongsTo(db.post)

db.post.hasMany(db.like, { onDelete: 'CASCADE' })
db.like.belongsTo(db.post)

db.user.hasMany(db.post, { onDelete: 'CASCADE' })
db.post.belongsTo(db.user)

db.user.belongsToMany(db.user, { as: 'Followers', through: 'UserFollowers', foreignKey: 'userId', sourceKey: "id", timestamps: false })
db.user.belongsToMany(db.user, { as: 'Following', through: 'UserFollowers', foreignKey: 'followerId', sourceKey: "id", timestamps: false });

// optionally: SYNC
// (async () => {
//   try {
//     // await sequelize.sync({ force: true }); // creates tables, dropping them first if they already existed
//     // await sequelize.sync({ alter: true }); // checks the tables in the database (which columns they have, what are their data types, etc.), and then performs the necessary changes to make then match the models
//     // await sequelize.sync(); // creates tables if they don't exist (and does nothing if they already exist)
//     console.log('DB is successfully synchronized')
//   } catch (error) {
//     console.log(error)
//   }
// })();

module.exports = db;