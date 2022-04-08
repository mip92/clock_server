class OneOrder{
    constructor(dateTime, order, user, master,originalCity, city) {
        this.dateTime=dateTime
        this.orderId=order.id;
        this.clockSize=order.clockSize;
        this.userId=user.id;
        this.userEmail=user.email;
        this.userName=user.name;
        this.masterId=master.id;
        this.masterEmail=master.email;
        this.masterName=master.name;
        this.cityName=originalCity
        this.cityId=city.id;
        this.dealPrice=order.dealPrice
        this.statusId=order.statusId
        //this.cityName=city.cityName
    }
}
module.exports = OneOrder;