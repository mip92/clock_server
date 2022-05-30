import {
    CreateRatingBody,
    CustomRequest,
    GetRatingByMasterParams
} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {RatingModel} from "../models/rating.model";
import {Rating, Order, User, ROLE} from '../models';
import ApiError from '../exeptions/api-error';
import {OrderModel} from "../models/order.model";
import {v4 as uuidv4} from "uuid";
import {UserModel} from "../models/user.model";
import mail from "../services/mailServiсe";

type ParamsOrderId = {
    orderId: string
}

interface OrderWithUser extends OrderModel{
    user:UserModel
}

class RatingController {
    async createRating(req: CustomRequest<CreateRatingBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId, rating, comment} = req.body
            console.log(orderId, rating, comment)
            if (rating < 0 || rating > 5) return next(ApiError.ExpectationFailed({
                value: rating,
                msg: "the rating must be positive and the maximum rating is 5",
                param: "rating",
                location: "body"
            }))
            const order: OrderModel | null = await Order.findOne({where: {id: orderId}})
            if (!order) return next(ApiError.ExpectationFailed({
                value: orderId,
                msg: "order is not found",
                param: "orderId",
                location: "body"
            }))
            const isRatingExhibited: RatingModel | null = await Rating.findOne({where: {orderId}});
            if (isRatingExhibited) return next(ApiError.BadRequest("rating already posted"))
            const newRating: RatingModel = await Rating.create({masterId: order.masterId, orderId, rating, comment});
            !newRating && next(ApiError.BadRequest("rating and comment not created"))
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
            const ratings: RatingModel[] = await Rating.findAll({
                    where: {masterId: +masterId},
                }
            )
            if (!ratings) return next(ApiError.BadRequest("Ratings not found"))
            let arrayOfRatings: number[] = []
            ratings.forEach((r) => arrayOfRatings.push(r.rating))
            const sum = arrayOfRatings.reduce((a, b) => a + b, 0);
            const average = (Math.ceil((sum / arrayOfRatings.length) * 10) / 10)
            res.status(200).json({averageRating: average, masterId: +masterId})
        } catch (e: any) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getLastComments(req: CustomRequest<null, GetRatingByMasterParams, null, null>, res: Response, next: NextFunction) {
        try {
            const masterId = req.params.masterId
            const lastComments: RatingModel[] = await Rating.findAll({
                    where: {masterId: +masterId},
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


    async getLinkToCreateRating(req: CustomRequest<null, ParamsOrderId, null, null>, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId
            const rating: RatingModel | null = await Rating.findOne({where: {id: orderId}})
            if (rating) return next(ApiError.BadRequest("rating already posted"))
            // @ts-ignore
            const order: OrderWithUser  | null = await Order.findOne({
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
            const link = `${process.env.API_URL}/api/auth/activate/${uniqueKey}`
            const newRating: RatingModel = await Rating.create({masterId: order.masterId, orderId: +orderId, link});
            await mail.sendRatingMail(order.user.email, newRating.link)
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }
}

export default new RatingController()