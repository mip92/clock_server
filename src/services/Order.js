class OneOrder{
    constructor(dateTime, order, user, master,city) {
        this.dateTime=dateTime
        this.orderId=order.id;
        this.clockSize=order.clockSize;
        this.userId=user.id;
        this.userEmail=user.email;
        this.userName=user.name;
        this.masterId=master.id;
        this.masterEmail=master.email;
        this.masterName=master.name;
        this.cityId=city.id;
        this.cityName=city.cityName
    }
}
module.exports = OneOrder;