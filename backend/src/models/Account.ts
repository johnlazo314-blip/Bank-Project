import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import User from './User';

interface AccountAttributes {
  AccountID: number;
  UserID: number;
  AccountType: 'checking' | 'savings';
  Balance: number;
}

type AccountCreationAttributes = Optional<AccountAttributes, 'AccountID'>;

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
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

Account.belongsTo(User, { foreignKey: 'UserID', as: 'owner' });
User.hasMany(Account, { foreignKey: 'UserID', as: 'accounts' });

export default Account;
