import express from "express";
const router = express.Router();
import ratingController from '../controller/rating.controller';
import {body} from "express-validator";
import checkRules from '../middlwares/checkRuleMiddleware';

const validationCreateRatingBodyRules = [
    body('orderId', "orderId is required").not().isEmpty(),
    body('rating', "rating is required").not().isEmpty(),
    body('comment', "comment is required").isLength({min: 3}).not().isEmpty().escape(),
];

router.post('/',/* checkRoles([ROLE.User]),*/ validationCreateRatingBodyRules, checkRules, (res: any, req: any, next: any) => {ratingController.createRating(res, req, next)});
router.get('/:masterId', (res: any, req: any, next: any) => {ratingController.getRatingByMaster(res, req, next)});
router.get('/getLastComments/:masterId', (res: any, req: any, next: any) => {ratingController.getLastComments(res, req, next)});
router.get('/getLinkToCreateRating/:orderId', (res: any, req: any, next: any) => {ratingController.getLinkToCreateRating(res, req, next)});
export default router