const Router = require('express').Router;
const router = new Router();
const masterController = require('../controller/master.controller')
const checkRole = require('../middlwares/checkRoleMiddleware')
const checkRules = require('../middlwares/checkRulesMiddleware')
let {body} = require('express-validator');

validationCreateMasterBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('city_id', 'city_id is required').not().isEmpty().escape()
];
validationGetFreeMastersBodyRules = [
    body('cityId', 'city_id is required').not().isEmpty().escape(),
    body('dateTime', 'dateTime is required').not().isEmpty(),
    body('clockSize', 'clockSize is required').not().isEmpty(),
];
validationUpdateMasterBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('city_id', 'city_id is required').not().isEmpty().escape()
];

router.post('/', checkRole("ADMIN"), validationCreateMasterBodyRules, checkRules, masterController.createMaster);
router.get('/', masterController.getAllMasters);
router.get('/:masterId', masterController.getOneMaster);
router.put('/', checkRole("ADMIN"), validationCreateMasterBodyRules, checkRules, masterController.updateMaster);
router.delete('/:masterId', checkRole("ADMIN"), masterController.deleteMaster);
/*router.post('/timeReservation'/!*,checkRole("ADMIN")*!/,masterController.timeReservation);*/
router.post('/getFreeMasters', validationGetFreeMastersBodyRules, checkRules, masterController.getFreeMasters);


module.exports = router