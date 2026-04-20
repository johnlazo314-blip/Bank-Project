import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';

class User extends Model {
  public userID!: number;
  public FirstName!: string;
  public LastName!: string;
  public email!: string;
  public role!: 'user' | 'admin';
}

User.init({
  userID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'userID' // Explicitly map to the 'userID' column in the database
  },
  FirstName: {
    type: new DataTypes.STRING(128),
    allowNull: false,
    field: 'FirstName'
  },
  LastName: {
    type: new DataTypes.STRING(128),
    allowNull: false,
    field: 'LastName'
  },
  email: {
    type: new DataTypes.STRING(128),
    allowNull: false,
    unique: true,
    field: 'email'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user',
    field: 'role'
  },
}, {
  sequelize,
  tableName: 'Users', // Explicitly set the table name
  timestamps: false // Disable timestamps if you don't have createdAt/updatedAt columns
});

export default User;
