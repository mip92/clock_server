import express from "express";
const router = express.Router();
const masterController = require('../controller/master.controller')

const checkRoles = require("../middlwares/checkRolesMiddleware");
const checkRules = require('../middlwares/checkRuleMiddleware')
const checkRules2 = require("../middlwares/checkRulesMiddleware");
const {body} = require('express-validator');
const {ROLE}=require("../models")

const validationCreateMasterBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('citiesId', 'cityId is required').not().isEmpty().escape()
];
const validationGetFreeMastersBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('cityId', 'city_id is required').not().isEmpty().escape(),
    body('dateTime', 'dateTime is required').not().isEmpty(),
    body('clockSize', 'clockSize is required').not().isEmpty(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
];
const validationUpdateMasterBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('city_id', 'city_id is required').not().isEmpty().escape()
];
const validationChangeEmailBodyRules = [
    body('password', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('currentEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('newEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('role', 'role must be not null').not()
];

router.post('/', checkRoles([ROLE.Admin]), validationCreateMasterBodyRules, checkRules2, masterController.createMaster);
router.get('/', masterController.getAllMasters);
router.get('/:masterId', masterController.getOneMaster);
router.put('/', checkRoles([ROLE.Admin]), validationCreateMasterBodyRules, checkRules2, masterController.updateMaster);
router.delete('/:masterId', checkRoles([ROLE.Admin]), masterController.deleteMaster);
router.get('/approve/:masterId', checkRoles([ROLE.Admin]), masterController.approveMaster);
/*router.post('/timeReservation'/!*,checkRole("ADMIN")*!/,masterController.timeReservation);*/
router.post('/getFreeMasters', validationGetFreeMastersBodyRules, checkRules, masterController.getFreeMasters);
router.put('/changeEmail', checkRoles([ROLE.Master]), validationChangeEmailBodyRules, checkRules2, masterController.changeEmail)


export default router