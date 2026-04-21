import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';
import User from './User';

interface AccountAttributes {
  AccountID: number;
  UserID: number;
  AccountType: 'checking' | 'savings';
  Balance: number;
}

class Account extends Model<AccountAttributes> implements AccountAttributes {
  public AccountID!: number;
  public UserID!: number;
  public AccountType!: 'checking' | 'savings';
  public Balance!: number;
}

Account.init({
  AccountID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'account_id'
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
    field: 'user_id'
  },
  AccountType: {
    type: DataTypes.ENUM('checking', 'savings'),
    allowNull: false,
    field: 'account_type'
  },
  Balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'balance'
  },
}, {
  sequelize,
  tableName: 'accounts',
  timestamps: false
});

Account.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
User.hasMany(Account, { foreignKey: 'user_id', as: 'accounts' });

export default Account;
