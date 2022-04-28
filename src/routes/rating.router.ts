export {};
const Router = require('express').Router;
const router = new Router();
const ratingController = require('../controller/rating.controller')
const {body} = require("express-validator");
const checkRules = require('../middlwares/checkRuleMiddleware')

const validationCreateRatingBodyRules = [
    body('orderId', "orderId is required").not().isEmpty(),
    body('masterId', "orderId is required").not().isEmpty(),
    body('rating', "orderId is required").not().isEmpty(),
];

router.post('/',/* checkRoles([ROLE.User]),*/ validationCreateRatingBodyRules, checkRules, ratingController.createRating);
//router.get('/', ratingController.getAllRatings);
router.get('/:masterId', ratingController.getRatingByMaster);

module.exports = router