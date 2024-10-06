const db = require("../models/index.js");
const Like = db.like;
const Post = db.post;
const { ValidationError } = require('sequelize');

exports.like = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.idP)
        if (!post)
            return res.status(404).json({
                success: false,
                msg: "Post not found."
            });

        const newLike = await Like.create({
            postId: req.params.idP,
            userId: req.loggedUserId
        })

        return res.status(201).json({
            success: true,
            msg: "Like created successfully.",
            data: newLike
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

exports.unlike = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.idP)
        if (!post)
            return res.status(404).json({
                success: false,
                msg: "Post not found."
            });

        const like = await Like.findByPk(req.params.idL)
        if (!like)
            return res.status(404).json({
                success: false,
                msg: "Like not found."
            });

        if (like.userId != req.loggedUserId)
            return res.status(401).json({
                success: false,
                error: "Forbidden",
                msg: "You don't have permission to unlike."
            });

        await Like.destroy({ where: { id: req.params.idL } })

        return res.status(200).json({
            success: true,
            msg: 'Like deleted successfully.'
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