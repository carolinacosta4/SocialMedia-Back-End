module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define("user",
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { notNull: { msg: "Username is required!" }, is: { args: /^[a-zA-Z0-9_]+$/, msg: "The username contains invalid characters. Only alphanumeric characters and underscores are allowed." } }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        isEmail: true,
        unique: true,
        validate: { notNull: { msg: "Email is required!" }, isEmail: { msg: "Email invalid!" } }
      },
      profile_image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        trim: true,
        validate: { notNull: { msg: "Password is required!" } }
      },
      is_blocked: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      cloudinary_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
    }
  );

  return user;
};
