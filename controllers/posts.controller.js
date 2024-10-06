const db = require("../models/index.js");
const Post = db.post;
const { ValidationError } = require('sequelize');
const config = require("../config/db.config.js");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: config.C_CLOUD_NAME,
    api_key: config.C_API_KEY,
    api_secret: config.C_API_SECRET
});

exports.findAll = async (req, res) => {
    try {
        const posts = await Post.findAll(
            {
                include: [
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
                        attributes: ['id', 'createdAt'],
                        include: [
                            {
                                model: db.user,
                                attributes: ['id', 'username', 'profile_image'],
                            },
                        ]
                    }
                ],
                attributes: ['id', 'content', 'image', 'createdAt']
            }
        )

        return res.status(200).json({
            success: true,
            data: posts
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

exports.findOne = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.idP, {
            include: [
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
                    attributes: ['id', 'createdAt'],
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
                msg: 'Post unexistent.'
            });

        return res.status(200).json({
            success: true,
            data: post
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

exports.create = async (req, res) => {
    try {
        let post_image = null;
        let cloudinary_id = null;
        
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = `data:${req.file.mimetype};base64,${b64}`;
            let result = await cloudinary.uploader.upload(dataURI, { resource_type: "auto" });            
            post_image = result.url;
            cloudinary_id = result.public_id;
        }        
        
        const newPost = await Post.create({
            content: req.body.content,
            image: post_image,
            cloudinary_id: cloudinary_id,
            userId: req.loggedUserId
        })

        return res.status(201).json({
            success: true,
            msg: "Post created successfully.",
            data: newPost
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

exports.edit = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.idP)
        if (!post)
            return res.status(404).json({
                success: false,
                msg: "Post not found."
            });

        if (post.UserId != req.loggedUserId)
            return res.status(401).json({
                success: false,
                error: "Forbidden",
                msg: "You don't have permission to edit this post."
            });

        if (Object.values(req.body).length == 0)
            return res.status(400).json({
                success: false,
                msg: "You need to provide the body with the request."
            });

        if (!req.body.content && !req.body.image)
            return res.status(400).json({
                success: false,
                error: 'Fields missing',
                msg: "You need to provide the content or image."
            });

        const updated = await Post.update({
            content: req.body.content,
            image: req.body.image
        }, { where: { id: req.params.idP } })

        if (updated[0] === 0)
            return res.status(400).json({
                success: false,
                error: 'No changes made',
                msg: "No changes were made on the post."
            });

        const updatedPost = await Post.findByPk(req.params.idP)
        return res.status(200).json({
            success: true,
            data: updatedPost
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

exports.delete = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.idP)
        if (!post)
            return res.status(404).json({
                success: false,
                msg: "Post not found."
            });

        if (post.UserId != req.loggedUserId)
            return res.status(401).json({
                success: false,
                error: "Forbidden",
                msg: "You don't have permission to delete this post."
            });

        await Post.destroy({ where: { id: req.params.idP } })

        return res.status(200).json({
            success: true,
            msg: 'Book deleted successfully.'
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