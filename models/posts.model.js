module.exports = (sequelize, DataTypes) => {
  const post = sequelize.define("post", {
      content: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { notNull: { msg: "Content can't be null." } }
      },

      image: {
          type: DataTypes.STRING,
          allowNull: true,
      },

      cloudinary_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
  })
  return post
}