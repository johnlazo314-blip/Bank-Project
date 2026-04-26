import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface UserAttributes {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Role: 'user' | 'admin';
}

type UserCreationAttributes = Optional<UserAttributes, 'UserID'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public UserID!: number;
  public FirstName!: string;
  public LastName!: string;
  public Email!: string;
  public Role!: 'user' | 'admin';
}

// Initialize the User model
User.init({
  UserID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'user_id'
  },
  FirstName: {
    type: new DataTypes.STRING(128),
    allowNull: false,
    field: 'first_name'
  },
  LastName: {
    type: new DataTypes.STRING(128),
    allowNull: false,
    field: 'last_name'
  },
  Email: {
    type: new DataTypes.STRING(128),
    allowNull: false,
    unique: true,
    field: 'email'
  },
  Role: {
    type: new DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'user',
    field: 'role'
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: false
});

export default User;
