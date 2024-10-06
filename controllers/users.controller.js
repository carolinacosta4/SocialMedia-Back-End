const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const config = require("../config/db.config.js");
const db = require("../models/index.js");
const User = db.user;
const Post = db.post;
const { ValidationError } = require("sequelize");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: config.C_CLOUD_NAME,
  api_key: config.C_API_KEY,
  api_secret: config.C_API_SECRET
});

const handleErrorResponse = (res, error) => {
  if (error instanceof ValidationError)
    return res.status(400).json({ success: false, msg: error.errors.map(e => e.message) });
  else
    return res.status(500).json({ success: false, msg: error.message || "Some error occurred." });
};

exports.changeProfilePicture = async (req, res) => {
  try {
    let user = await User.findByPk(req.params.idU);

    if (user === null) {
      return res.status(404).json({
        success: false,
        msg: `Cannot find any user with ID ${req.params.idU}`,
      });
    }
    let user_image = null;
    if (req.file) {
      if (user.cloudinary_id) {
        await cloudinary.uploader.destroy(user.cloudinary_id);
      }
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = `data:${req.file.mimetype};base64,${b64}`;
      let result = await cloudinary.uploader.upload(dataURI, { resource_type: "auto" });
      user_image = result;
    }

    await User.update({
      profile_image: user_image ? user_image.url : null,
      cloudinary_id: user_image ? user_image.public_id : null
    }, { where: { id: req.params.idU } });

    return res.status(201).json({
      success: true,
      profile_image: user_image ? user_image.url : null,
      cloudinary_id: user_image ? user_image.public_id : null,
      msg: "Profile picture updated successfully!"
    });
  } catch (error) {
    handleErrorResponse(res, error)
  }
};

exports.findAll = async (req, res) => {
  let { page, limit, sort } = req.query;

  const pageNumber = page && Number.parseInt(page) > 0 ? Number.parseInt(page) : 1;
  const limitValue = limit && Number.parseInt(limit) > 0 ? Number.parseInt(limit) : null;
  const offset = (pageNumber - 1) * limitValue;
  let users

  try {
    if (sort) {
      if (sort.toLowerCase() != 'asc' && sort.toLowerCase() != 'desc') {
        return res.status(400).json({
          success: false,
          message: "Sort can only be 'asc' or 'desc'."
        });
      }
      users = await User.findAll({ limit: limitValue, offset: offset, order: [['username', sort.toUpperCase()]], raw: true });
    } else {
      users = await User.findAll({ limit: limitValue, offset: offset, raw: true });
    }

    return res.status(200).json({
      success: true,
      pagination: [{
        "total": `${users.length}`,
        "current": `${pageNumber}`,
        "limit": `${limitValue}`
      }],
      data: users,
      links: [{ rel: "add-user", href: `/users`, method: "POST" }],
    });
  } catch (error) {
    handleErrorResponse(res, error)
  }
};

const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: config.MAIL_USER,
    pass: config.MAIL_PASSWORD
  }
});

exports.register = async (req, res) => {
  try {
    if (!req.body || !req.body.username || !req.body.password || !req.body.email) {
      return res.status(400).json({ success: false, msg: "Fisrt name, last name, username, email and password are mandatory" });
    }

    let searchUser = await User.findOne({ where: { username: req.body.username } })
    if (searchUser) {
      return res.status(409).json({
        success: false,
        msg: "The username is already taken. Please choose another one."
      });
    }

    let searchUserEmail = await User.findOne({ where: { email: req.body.email } })
    if (searchUserEmail) {
      return res.status(409).json({
        success: false,
        msg: "The email is already in use. Please choose another one."
      });
    }

    let newUser = await User.create({
      username: req.body.username, email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      profile_image: "https://res.cloudinary.com/ditdnslga/image/upload/v1718780629/userPlaceHolder_l1dvdi.png",
      cloudinary_id: "defaultProfileImage"
    });

    return res.status(201).json({
      success: true,
      msg: "User created successfully.",
      links: [
        { rel: "self", href: `/users/${newUser.username}`, method: "GET" },
        { rel: "login-user", href: `/users/login`, method: "POST" }
      ],
    });
  } catch (error) {
    handleErrorResponse(res, error)
  }
};

exports.findOne = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.idU,
      {
        include: [
          {
            model: User,
            as: 'Followers',
            attributes: ['id', 'username', 'profile_image'],
            through: {
              attributes: []
            }
          },
          {
            model: User,
            as: 'Following',
            attributes: ['id', 'username', 'profile_image'],
            through: {
              attributes: [],
            },
            include: [
              {
                model: Post,
                attributes: ['id', 'content', 'image', 'createdAt'],
                include: [
                  {
                    model: db.like,
                    as: 'likes',
                    attributes: ['id', 'createdAt'],
                    include: [
                      {
                        model: db.user,
                        attributes: ['id'],
                      },
                    ]
                  },
                  {
                    model: db.comment,
                    as: 'comments',
                    attributes: ['content', 'createdAt'],
                  }
                ]
              },
            ]
          },
          {
            model: Post,
            attributes: ['id', 'content', 'image', 'createdAt'],
            include: [
              {
                model: db.like,
                as: 'likes',
                attributes: ['id', 'createdAt'],
                include: [
                  {
                    model: db.user,
                    attributes: ['id'],
                  },
                ]
              },
              {
                model: db.comment,
                as: 'comments',
                attributes: ['content', 'createdAt'],
              }
            ]
          },
        ],
        attributes: ['username', 'email', 'profile_image', 'id']
      }
    )

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    handleErrorResponse(res, error)
  }
}

exports.findUserPosts = async (req, res) => {
  try {
    const post = await Post.findAll({
      where: { userId: req.params.idU }, include: [
        {
          model: db.user,
          attributes: ['id', 'username', 'profile_image'],
        },
        {
          model: db.comment,
          as: 'comments',
          attributes: ['content', 'createdAt'],
          include: [
            {
              model: db.user,
              attributes: ['id', 'username', 'profile_image'],
            },
          ]
        },
        {
          model: db.like,
          as: 'likes',
          attributes: ['createdAt'],
          include: [
            {
              model: db.user,
              attributes: ['id', 'username', 'profile_image'],
            },
          ]
        }
      ],
      attributes: ['id', 'content', 'image', 'createdAt']
    })
    if (!post)
      return res.status(404).json({
        success: false,
        msg: 'User has no posts.'
      });

    return res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    handleErrorResponse(res, error)
  }
}

exports.edit = async (req, res) => {
  try {
    console.log(req.params.idU);

    const user = await User.findByPk(req.params.idU)
    console.log(user);

    if (!user)
      return res.status(404).json({
        success: false,
        msg: "User not found."
      });

    if (user.id != req.loggedUserId)
      return res.status(401).json({
        success: false,
        error: "Forbidden",
        msg: "You don't have permission to edit this user."
      });

    if (Object.values(req.body).length == 0)
      return res.status(400).json({
        success: false,
        msg: "You need to provide the body with the request."
      });

    if (!req.body.username && !req.body.email && !req.body.password)
      return res.status(400).json({
        success: false,
        error: 'Fields missing',
        msg: "You need to provide the username, email or password."
      });

    const newPassword = req.body.password ? bcrypt.hashSync(req.body.password, 10) : user.password

    const updated = await User.update({
      username: req.body.username,
      email: req.body.email,
      password: newPassword,
    }, { where: { id: req.params.idU } })

    if (updated[0] === 0)
      return res.status(400).json({
        success: false,
        error: 'No changes made',
        msg: "No changes were made on the user."
      });

    const updatedUser = await User.findByPk(req.params.idU)
    return res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    if (error instanceof ValidationError)
      return res.status(400).json({ success: false, msg: error.errors.map(e => e.message) });
    else
      return res.status(500).json({
        success: false, msg: error.message || "Some error occurred while creating the user."
      });
  }
}

exports.login = async (req, res) => {
  try {
    if (!req.body || !req.body.username || !req.body.password)
      return res.status(400).json({ success: false, msg: "Must provide username and password." });

    let user = await User.findOne({ where: { username: req.body.username } });
    if (!user) return res.status(404).json({ success: false, msg: "User not found." });

    const check = bcrypt.compareSync(req.body.password, user.password);
    if (!check) return res.status(401).json({ success: false, accessToken: null, msg: "Invalid credentials!" });

    const token = jwt.sign({ id: user.id },
      config.SECRET, {
      expiresIn: '5h'
    });

    return res.status(200).json({ success: true, accessToken: token, id: user.id });
  } catch (error) {
    handleErrorResponse(res, error)
  }
};

exports.editBlock = async (req, res) => {
  try {
    let msg
    let user = await User.findByPk(req.params.idU);
    if (user === null) {
      return res.status(404).json({
        success: false,
        msg: `Cannot find any user with username ${req.params.idU}`,
      });
    }

    await User.update({ is_blocked: !user.is_blocked }, {
      where: { username: req.params.idU },
    });

    let updatedUser = await User.findByPk(req.params.idU);

    if (updatedUser.is_blocked) {
      msg = `User with username ${req.params.idU} was blocked.`
    } else {
      msg = `User with username ${req.params.idU} was unblocked.`
    }

    return res.json({
      success: true,
      msg: msg,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        msg: error.errors.map((e) => e.message)
      });
    } else if (error instanceof Sequelize.ConnectionError) {
      return res.status(503).json({
        error: "Database Error",
        msg: "There was an issue connecting to the database. Please try again later"
      });
    } else {
      return res.status(500).json({
        success: false,
        msg: `Error updating user with username ${req.params.idU}.`,
      });
    }
  }
};

exports.follow = async (req, res) => {
  try {
    const userToFollow = await User.findByPk(req.params.idU)
    if (!userToFollow)
      return res.status(404).json({
        success: false,
        msg: "User not found."
      });

    if (userToFollow.id == req.loggedUserId)
      return res.status(400).json({
        success: false,
        msg: "You can't follow yourself."
      });

    const follower = await User.findByPk(req.loggedUserId);
    let follow = await follower.hasFollowing(userToFollow);
    if (follow)
      return res.status(404).json({
        success: false,
        msg: "You already followed this user."
      });

    let newFollow = await follower.addFollowing(userToFollow);

    return res.status(201).json({
      success: true,
      msg: `User ${userToFollow.username} followed successfully.`,
      data: newFollow
    });
  } catch (error) {
    if (error instanceof ValidationError)
      return res.status(400).json({ success: false, msg: error.errors.map(e => e.message) });
    else
      return res.status(500).json({
        success: false, msg: error.message || "Some error occurred while creating the user."
      });
  }
}

exports.unfollow = async (req, res) => {
  try {
    const userFollowed = await User.findByPk(req.params.idU)
    if (!userFollowed)
      return res.status(404).json({
        success: false,
        msg: "User not found."
      });

    if (userFollowed.id == req.loggedUserId)
      return res.status(400).json({
        success: false,
        msg: "You can't unfollow yourself."
      });

    const follower = await User.findByPk(req.loggedUserId);
    let follow = await follower.hasFollowing(userFollowed);
    if (!follow)
      return res.status(404).json({
        success: false,
        msg: "Follow not found."
      });

    await follower.removeFollowing(userFollowed);

    return res.status(200).json({
      success: true,
      msg: `User ${userFollowed.username} unfollowed successfully.`
    });
  } catch (error) {
    if (error instanceof ValidationError)
      return res.status(400).json({ success: false, msg: error.errors.map(e => e.message) });
    else
      return res.status(500).json({
        success: false, msg: error.message || "Some error occurred while creating the user."
      });
  }
}