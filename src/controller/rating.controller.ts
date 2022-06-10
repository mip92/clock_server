import {
    CreateRatingBody,
    CustomRequest,
    GetRatingByMasterParams, LinkParams
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
            const candidate: RatingModel | null = await Rating.findOne({where: {link: key}})
            if (!candidate) return next(ApiError.BadRequest("Ratings not found"))
            if (candidate.comment || candidate.rating) return next(ApiError.BadRequest("rating already posted"))
            const newRating = await candidate.update({comment, rating})
            !newRating && next(ApiError.BadRequest("rating and comment not created"))
            await ratingService.changeRating(newRating.masterId, next)
            return res.status(201).json(newRating)
        } catch (e: any) {
            next(ApiError.BadRequest(e))
        }
    }

    async getRatingByMaster(req: CustomRequest<null, GetRatingByMasterParams, null, null>, res: Response, next: NextFunction) {
        try {
            const masterId = req.params.masterId
            const ratings: RatingModel[] = await Rating.findAll({
                    where: {masterId: +masterId},
                }
            )
            if (!ratings) return next(ApiError.BadRequest("Ratings not found"))
            let arrayOfRatings:number[] = []
            //ratings.forEach((r)=>arrayOfRatings.push(r.rating)) //return after merging this branch in development
            const sum = arrayOfRatings.reduce((a, b) => a + b, 0);
            const average = (Math.ceil((sum / arrayOfRatings.length)*10)/10)
            //const average = Math.floor(sum / arr.length);
            res.status(200).json({averageRating: average, masterId: +masterId, ratings})
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
            const pdfBase64 = await pdfService.createPdf(+orderId, next)
            if (!pdfBase64) return next(ApiError.BadRequest(`Problem with creating pdf`))
            await mail.sendRatingMail(order.user.email, link, pdfBase64)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async isRatingComplete(req: CustomRequest<null, LinkParams, null, null>, res: Response, next: NextFunction) {
        try {
            const link = req.params.link

            const rating: RatingModel | null = await Rating.findOne({where: {link}})
            if (!rating || rating.rating || rating.comment) return next(ApiError.BadRequest("rating not available"))
            console.log(rating)
            res.status(200).json("checked")
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

export default new RatingController()
