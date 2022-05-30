import express from "express";

const router = express.Router();
import ratingController from '../controller/rating.controller';
import {body} from "express-validator";
import checkRules from '../middlwares/checkRuleMiddleware';

const validationCreateRatingBodyRules = [
    body('orderId', "orderId is required").not().isEmpty(),
    body('masterId', "orderId is required").not().isEmpty(),
    body('rating', "orderId is required").not().isEmpty(),
];

router.post('/',/* checkRoles([ROLE.User]),*/ validationCreateRatingBodyRules, checkRules, (res: any, req: any, next: any) => {
    ratingController.createRating(res, req, next)
});
//router.get('/', ratingController.getAllRatings);
router.get('/:masterId', (res: any, req: any, next: any) => {
    ratingController.getRatingByMaster(res, req, next)
});

export default router