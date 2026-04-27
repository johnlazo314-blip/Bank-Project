"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../db"));
// Create the User model class
class User extends sequelize_1.Model {
}
// Initialize the User model
User.init({
    UserID: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'user_id'
    },
    FirstName: {
        type: new sequelize_1.DataTypes.STRING(128),
        allowNull: false,
        field: 'first_name'
    },
    LastName: {
        type: new sequelize_1.DataTypes.STRING(128),
        allowNull: false,
        field: 'last_name'
    },
    Email: {
        type: new sequelize_1.DataTypes.STRING(128),
        allowNull: false,
        unique: true,
        field: 'email'
    },
    Role: {
        type: new sequelize_1.DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'user',
        field: 'role'
    },
}, {
    sequelize: db_1.default,
    tableName: 'users',
    timestamps: false
});
exports.default = User;
