module.exports = (sequelize, DataTypes) => {
  const comment = sequelize.define("comment", {
      content: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { notNull: { msg: "comment can't be null." } }
      },
  })
  return comment
}