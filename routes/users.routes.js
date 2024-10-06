const express = require("express");
const userController = require("../controllers/users.controller");
const authController = require("../controllers/auth.controller");

let router = express.Router();

const multer = require('multer')
let storage = multer.memoryStorage();
const multerUploads = multer({ storage }).single('inputProfilePicture');

router.route("/")
  .get(authController.verifyToken, userController.findAll)
  .post(multerUploads, userController.register);

router.route("/:idU/change-profile-picture")
  .patch(authController.verifyToken, multerUploads, userController.changeProfilePicture)

router.route('/:idU')
  .get(authController.verifyToken, userController.findOne)
  .patch(authController.verifyToken, userController.edit)

router.route('/:idU/posts')
  .get(authController.verifyToken, userController.findUserPosts)

router.route('/:idU/follow')
  .post(authController.verifyToken, userController.follow)

router.route('/:idU/unfollow')
  .delete(authController.verifyToken, userController.unfollow);

router.route('/login')
  .post(userController.login);

router.route("/:idU/block")
  .patch(userController.editBlock);
  
router.all("*", function (req, res) {
  res
    .status(400)
    .json({
      success: false,
      message: `The API does not recognize the request on ${req.method} ${req.originalUrl}`,
    });
});

module.exports = router;