import express from "express";
const router = express.Router();
import ratingController from '../controller/rating.controller';
import {body} from "express-validator";
import checkRules2 from "../middlwares/checkRulesMiddleware";
import {ROLE} from "../models";
import checkRoles from "../middlwares/checkRolesMiddleware";

const validationCreateRatingBodyRules = [
    body('key', "key is required").not().isEmpty(),
    body('rating', "rating is required").not().isEmpty(),
    body('comment', "min length is 6").isLength({min: 6}),
];

router.post('/', checkRoles([ROLE.User]), validationCreateRatingBodyRules, checkRules2, (res: any, req: any, next: any) => {ratingController.createRating(res, req, next)});
router.get('/:masterId', (res: any, req: any, next: any) => {ratingController.getRatingByMaster(res, req, next)});
router.get('/getLastComments/:masterId', (res: any, req: any, next: any) => {ratingController.getLastComments(res, req, next)});
export default router