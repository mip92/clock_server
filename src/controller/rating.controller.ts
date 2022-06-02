import {
    CreateRatingBody,
    CustomRequest,
    GetRatingByMasterParams
} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {RatingModel} from "../models/rating.model";
import {Rating, Order, User, ROLE, Master} from '../models';
import ApiError from '../exeptions/api-error';
import {OrderModel} from "../models/order.model";
import {v4 as uuidv4} from "uuid";
import {UserModel} from "../models/user.model";
import mail from "../services/mailServiсe";
import ratingService from "../services/ratingService";
import {Op} from "sequelize";
import pdfService from "../services/pdfService";


interface OrderWithUser extends OrderModel {
    user: UserModel
}

class RatingController {
    async createRating(req: CustomRequest<CreateRatingBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {key, rating, comment} = req.body
            if (rating < 0 || rating > 5) return next(ApiError.ExpectationFailed({
                value: rating,
                msg: "the rating must be positive and the maximum rating is 5",
                param: "rating",
                location: "body"
            }))
            const candidate: RatingModel | null = await Rating.findOne({where: {link: key}})
            if (!candidate) return next(ApiError.BadRequest("Ratings not found"))
            if (candidate.comment || candidate.rating) return next(ApiError.BadRequest("rating already posted"))
            const newRating = await candidate.update({comment, rating})
            !newRating && next(ApiError.BadRequest("rating and comment not created"))
            await ratingService.changeRating(newRating.masterId, next)
            return res.status(201).json(newRating)
        } catch (e: any) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    /*async getAllRatings(req, res, next){
        try {
            let {limit, offset, masterId} = req.query
            if (limit > 50) limit = 50
            if (!offset) offset = 0
            let ratings
            if (!masterId) ratings = await Rating.findAndCountAll({
                limit,
                offset,
            })
            if (masterId) ratings = await Rating.findAndCountAll({
                where:{masterId},
                limit,
                offset
            })
            if (!ratings) return next(ApiError.BadRequest("Ratings not found"))
            res.status(200).json(ratings)
        }catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }*/

    async getRatingByMaster(req: CustomRequest<null, GetRatingByMasterParams, null, null>, res: Response, next: NextFunction) {
        try {
            const masterId = req.params.masterId
            const average: number = await ratingService.changeRating(+masterId, next)
            res.status(200).json({averageRating: average, masterId: +masterId})
        } catch (e: any) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getLastComments(req: CustomRequest<null, GetRatingByMasterParams, null, null>, res: Response, next: NextFunction) {
        try {
            const masterId = req.params.masterId
            const lastComments: RatingModel[] = await Rating.findAll({
                    where: {
                        comment: {[Op.not]: null},
                        masterId: +masterId,
                    },
                    limit: 5,
                    order: [['createdAt', "DESC"]],
                    include: [{
                        model: Order,
                        attributes: {
                            exclude: ['id', 'clockSize', 'originalCityName', 'dealPrice', 'status', 'payPalOrderId',
                                'totalPrice', 'createdAt', 'updatedAt', 'masterBusyDateId', 'masterId', 'cityId']
                        },
                        include: [{
                            model: User, attributes: {
                                exclude: ['id', 'email', 'role', 'password', 'activationLink',
                                    'isActivated', 'createdAt', 'updatedAt']
                            },
                        }]
                    }]
                }
            )

            res.status(200).json(lastComments)
        } catch (e: any) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }


    async getLinkToCreateRating(orderId: string, next: NextFunction) {
        try {
            const rating: RatingModel | null = await Rating.findOne({where: {id: orderId}})
            if (rating) return next(ApiError.BadRequest("rating already posted"))
            // @ts-ignore
            const order: OrderWithUser | null = await Order.findOne({
                where: {id: orderId},
                include: [{
                    model: User, attributes: {
                        exclude: ['id', 'role', 'password', 'activationLink',
                            'isActivated', 'createdAt', 'updatedAt']
                    },
                }]
            })
            if (!order || !orderId) return next(ApiError.ExpectationFailed({
                value: orderId,
                msg: "order is not found",
                param: "orderId",
                location: "body"
            }))
            const uniqueKey: string = uuidv4();
            const newRating: RatingModel | null = await Rating.create({
                masterId: order.masterId,
                orderId: +orderId,
                link: uniqueKey
            });
            const link = `${process.env.CLIENT_URL}/rating/${newRating.link}`
            const pdfBase64 = await pdfService.createPdf(+orderId,next)
            if (!pdfBase64) return next(ApiError.BadRequest(`Problem with creating base64`))
            await mail.sendRatingMail(order.user.email, link, pdfBase64)
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }
}

export default new RatingController()