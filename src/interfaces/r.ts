import {Params, Query} from "express-serve-static-core";

interface LoginBody {
    email: string,
    password: string,
}

interface AuthRegistrationBody {
    firstPassword: string,
    secondPassword: string,
    isRulesChecked: boolean,
    isMaster: boolean,
    email: string,
    name: string,
    citiesId?: number[],
}

interface CreateCityBody {
    city: string
    price: number
}

interface UpdateCityBody {
    cityName: string
    price: number
}

interface CreateMasterBody {
    name: string,
    email: string,
    citiesId: string
}

interface UpdateMasterBody {
    id: number,
    name: string,
    email: string,
    citiesId: string,
}

interface GetFreeMastersBody {
    cityId: number,
    dateTime: Date,
    clockSize: number
}

interface ChangeEmailBody {
    password: string,
    currentEmail: string,
    newEmail: string
}

type GetAllMastersQuery = {
    limit?: string,
    offset?: string,
    cities?: string,
    sortBy?: string,
    select?: string,
    filter?: string
}
type MasterId = { masterId: string }
type CityIdType = { cityId: string }
type LimitOffsetType = {
    limit?: string,
    offset?: string,
    sortBy?: string,
    select?: string,
    filter?: string
}
type Link = { link: string }

interface CreateOrderBody {
    cityId: number,
    clockSize: number,
    dateTime: Date,
    email: string,
    masterId: number,
    name: string
}

type GetAllOrders = {
    limit?: string,
    offset?: string,
    masterId?: string
    userId?: string
    cities?: string,
    sortBy?: string,
    select?: string,
    filterMaster?: string,
    filterUser?: string,
    minDealPrice?: string,
    maxDealPrice?: string,
    minTotalPrice?: string,
    maxTotalPrice?: string,
    dateStart?: string,
    dateFinish?: string,
    clockSize?: string,
    status?: string
}
type GetOneOrderParams = { orderId: string }
type CreatePicturesParams = { orderId: string }

interface DeletePicturesBody {
    picturesId: number[]
}

interface CreateUserBody {
    email: string,
    name: string
}

type FindUserQuery = { email: string }
type GetOneUserParams = { userId: string }

interface UpdateUserBody {
    id: number,
    newEmail: string,
    newName: string
}

type DeleteUserParams = {
    userId: string
}

interface CreateRatingBody {
    orderId: number,
    masterId: number,
    rating: number
}

type GetRatingByMasterParams = { masterId: string }

interface CreatePayPalOrderBody {
    payPalOrderId: string
}


interface CustomRequest<U, T extends Params | null,
    C extends Query | null, K extends FileList | null> extends Express.Request {
    body: U,
    params: T,
    query: C,
    files: K
}

module.exports = {
    LoginBody, AuthRegistrationBody, CreateCityBody, UpdateCityBody, CreateMasterBody, UpdateMasterBody,
    GetFreeMastersBody, ChangeEmailBody, GetAllMastersQuery, MasterId, CityIdType, LimitOffsetType, Link,
    CreateOrderBody, GetAllOrders, GetOneOrderParams, CreatePicturesParams, DeletePicturesBody, CreateUserBody,
    FindUserQuery, GetOneUserParams, UpdateUserBody, DeleteUserParams, CreateRatingBody, GetRatingByMasterParams,
    CreatePayPalOrderBody, CustomRequest
}