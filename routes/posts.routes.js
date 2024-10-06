const express = require("express");
const postController = require('../controllers/posts.controller')
const commentController = require('../controllers/comments.controller');
const likeController = require('../controllers/likes.controller');
const authController = require('../controllers/auth.controller')

const router = express.Router();

const multer = require('multer')
let storage = multer.memoryStorage();
const multerUploads = multer({ storage }).single('inputPostImage');

router.use((req, res, next) => {
  next();
});

router.route("/")
  .get(postController.findAll)
  .post(authController.verifyToken, multerUploads, postController.create);

router.route("/:idP")
  .get(authController.verifyToken, postController.findOne)
  .patch(authController.verifyToken, multerUploads, postController.edit)
  .delete(authController.verifyToken, postController.delete);

router.route('/:idP/comments')
  .post(authController.verifyToken, commentController.create)

router.route('/:idP/comments/:idC')
  .put(authController.verifyToken, commentController.edit)
  .delete(authController.verifyToken, commentController.delete)

router.route('/:idP/likes')
  .post(authController.verifyToken, likeController.like)

router.route('/:idP/likes/:idL')
  .delete(authController.verifyToken, likeController.unlike)

router.all("*", (req, res) => {
  res.status(400).json({
    success: false,
    message: `The API does not recognize the request on ${req.method} ${req.originalUrl}`,
  });
});

module.exports = router;