export {};
const Router = require('express').Router;
const router = new Router();
const ratingController = require('../controller/rating.controller')

const checkRules = require('../middlwares/checkRuleMiddleware')
let {body} = require('express-validator');

router.post('/', ratingController.createRating);
router.get('/', ratingController.getAllRatings);
router.get('/:ratingId', ratingController.getOneRating);

module.exports = router