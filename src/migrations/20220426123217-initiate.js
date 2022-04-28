'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                        queryInterface.createTable('admins', {
                            id: {type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true},
                            email: {type: Sequelize.STRING, unique: true, allowNull: false},
                            password: {type: Sequelize.STRING, allowNull: false},
                            role: {type: Sequelize.STRING, allowNull: false, defaultValue: "ADMIN"},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false}
                        }, {transaction: t}),
                        queryInterface.createTable('cities', {
                            id: {type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true},
                            cityName: {type: Sequelize.STRING, unique: true, allowNull: false},
                            price: {type: Sequelize.FLOAT, allowNull: false},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false}
                        }, {transaction: t}),
                        queryInterface.createTable('masters', {
                            id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
                            name: {type: Sequelize.STRING, allowNull: false},
                            email: {type: Sequelize.STRING, unique: true, allowNull: false},
                            rating: {type: Sequelize.INTEGER, allowNull: false, defaultValue: 5},
                            role: {type: Sequelize.STRING, defaultValue: "MASTER"},
                            password: {type: Sequelize.STRING, unique: false, allowNull: false},
                            activationLink: {type: Sequelize.STRING, allowNull: true},
                            isActivated: {type: Sequelize.BOOLEAN, defaultValue: false},
                            isApproved: {type: Sequelize.BOOLEAN, defaultValue: false},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false}
                        }, {transaction: t}),
                        queryInterface.createTable('master_busyDates', {
                            id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
                            dateTime: {type: Sequelize.STRING},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false},
                            masterId: {
                                type: Sequelize.INTEGER,
                                references: {
                                    model: {
                                        tableName: 'masters', //masters??
                                        //schema: 'schema'
                                    },
                                    key: 'id',
                                }
                            }
                        }, {transaction: t}),
                        queryInterface.createTable('master_cities', {
                            id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false},
                            masterId: {
                                type: Sequelize.INTEGER,
                                references: {
                                    model: {
                                        tableName: 'masters', //masters??
                                        //schema: 'schema'
                                    }, key: 'id'
                                }
                            },
                            cityId: {
                                type: Sequelize.INTEGER, references: {
                                    model: {
                                        tableName: 'cities', //cities??
                                        //schema: 'schema'
                                    }, key: 'id'
                                }
                            }
                        }, {transaction: t}),
                        queryInterface.createTable('users', {
                            id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
                            email: {type: Sequelize.STRING, unique: true},
                            role: {type: Sequelize.STRING, defaultValue: "USER"},
                            name: {type: Sequelize.STRING, allowNull: false},
                            password: {type: Sequelize.STRING, unique: false, allowNull: true},
                            activationLink: {type: Sequelize.STRING, allowNull: true},
                            isActivated: {type: Sequelize.BOOLEAN, defaultValue: false},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false}
                        }, {transaction: t}),
                        queryInterface.createTable('orders', {
                            id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
                            clockSize: {type: Sequelize.INTEGER, allowNull: false},
                            originalCityName: {type: Sequelize.STRING, allowNull: false},
                            dealPrice: {type: Sequelize.FLOAT, allowNull: false},
                            status: {type: Sequelize.STRING, allowNull: false},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false},
                            userId: {
                                type: Sequelize.INTEGER,
                                references: {
                                    model: {
                                        tableName: 'users', //users??
                                        //schema: 'schema'
                                    },
                                    key: 'id'
                                }
                            },
                            masterBusyDateId: {
                                type: Sequelize.INTEGER,
                                references: {
                                    model: {
                                        tableName: 'master_busyDates', //master_busyDates??
                                        //schema: 'schema'
                                    },
                                    key: 'id'
                                }
                            },
                            masterId: {
                                type: Sequelize.INTEGER,
                                references: {
                                    model: {
                                        tableName: 'masters', //masters??
                                        //schema: 'schema'
                                    }, key: 'id'
                                }
                            },
                            cityId: {
                                type: Sequelize.INTEGER, references: {
                                    model: {
                                        tableName: 'cities', //cities??
                                        //schema: 'schema'
                                    }, key: 'id'
                                }
                            }
                        }, {transaction: t}),
                        queryInterface.createTable('pictures', {
                            id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
                            path: {type: Sequelize.STRING, unique: true, allowNull: true},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false}
                        }, {transaction: t}),
                        queryInterface.createTable('orderPictures', {
                            id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false},
                            pictureId: {
                                type: Sequelize.INTEGER, references: {
                                    model: {
                                        tableName: 'pictures', //pictures??
                                        //schema: 'schema'
                                    }, key: 'id'
                                }
                            },
                            orderId: {
                                type: Sequelize.INTEGER, references: {
                                    model: {
                                        tableName: 'orders', //orders??
                                        //schema: 'schema'
                                    }, key: 'id'
                                }
                            }
                        }, {transaction: t}),
                        queryInterface.createTable('ratings', {
                            id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
                            rating: {type: Sequelize.INTEGER, allowNull: true},
                            orderId: {type: Sequelize.INTEGER, unique: true},
                            createdAt: {type: Sequelize.DATE, allowNull: false},
                            updatedAt: {type: Sequelize.DATE, allowNull: false},
                            masterId: {
                                type: Sequelize.INTEGER,
                                references: {
                                    model: {
                                        tableName: 'masters', //masters??
                                        //schema: 'schema'
                                    }, key: 'id'
                                }
                            },
                        }, {transaction: t})
                    ]
                )
            }
        )
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                        queryInterface.dropTable('admins', {transaction: t}),
                        queryInterface.dropTable('cities', {transaction: t}),
                        queryInterface.dropTable('masters', {transaction: t}),
                        queryInterface.dropTable('master_busyDates', {transaction: t}),
                        queryInterface.dropTable('master_cities', {transaction: t}),
                        queryInterface.dropTable('orders', {transaction: t}),
                        queryInterface.dropTable('orderPictures', {transaction: t}),
                        queryInterface.dropTable('pictures', {transaction: t}),
                        queryInterface.dropTable('ratings', {transaction: t}),
                        queryInterface.dropTable('users', {transaction: t})
                    ]
                )
            }
        )
    }
};