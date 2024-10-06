const db = require("../models/index.js");
const Comment = db.comment;
const Post = db.post;
const { ValidationError } = require('sequelize');

exports.create = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.idP)
        if (!post)
            return res.status(404).json({
                success: false,
                msg: "Post not found."
            });


        if (Object.values(req.body).length == 0)
            return res.status(400).json({
                success: false,
                msg: "You need to provide the body with the request."
            });

        if (!req.body.content)
            return res.status(400).json({
                success: false,
                error: 'Fields missing',
                msg: "You need to provide the content."
            });

        const newComment = await Comment.create({
            content: req.body.content,
            postId: req.params.idP,
            userId: req.loggedUserId
        })

        return res.status(201).json({
            success: true,
            msg: "Comment created successfully.",
            data: newComment
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

        const comment = await Comment.findByPk(req.params.idC)
        if (!comment)
            return res.status(404).json({
                success: false,
                msg: "Comment not found."
            });

        if (comment.UserId != req.loggedUserId)
            return res.status(401).json({
                success: false,
                error: "Forbidden",
                msg: "You don't have permission to edit this comment."
            });

        if (Object.values(req.body).length == 0)
            return res.status(400).json({
                success: false,
                msg: "You need to provide the body with the request."
            });

        if (!req.body.content)
            return res.status(400).json({
                success: false,
                error: 'Fields missing',
                msg: "You need to provide the content."
            });

        await Comment.update({
            content: req.body.content,
        }, { where: { id: req.params.idC } })

        const updatedComment = await Comment.findByPk(req.params.idC)
        if (updatedComment.content === comment.content)
            return res.status(400).json({
                success: false,
                error: 'No changes made',
                msg: "No changes were made on the comment."
            });

        return res.status(200).json({
            success: true,
            data: updatedComment
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

        const comment = await Comment.findByPk(req.params.idC)
        if (!comment)
            return res.status(404).json({
                success: false,
                msg: "Comment not found."
            });

        if (comment.UserId != req.loggedUserId)
            return res.status(401).json({
                success: false,
                error: "Forbidden",
                msg: "You don't have permission to delete this post."
            });

        await Comment.destroy({ where: { id: req.params.idC } })

        return res.status(200).json({
            success: true,
            msg: 'Comment deleted successfully.'
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