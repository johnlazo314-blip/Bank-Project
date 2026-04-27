import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import Account from './Account';

interface TransferAttributes {
  TransferID: number;
  FromAccountID: number;
  ToAccountID: number;
  Amount: number;
  Timestamp: Date;
}

type TransferCreationAttributes = Optional<TransferAttributes, 'TransferID' | 'Timestamp'>;

class Transfer extends Model<TransferAttributes, TransferCreationAttributes> implements TransferAttributes {
  public TransferID!: number;
  public FromAccountID!: number;
  public ToAccountID!: number;
  public Amount!: number;
  public Timestamp!: Date;
}

Transfer.init({
  TransferID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'transfer_id'
  },
  FromAccountID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'accounts', key: 'account_id' },
    field: 'from_account_id'
  },
  ToAccountID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'accounts', key: 'account_id' },
    field: 'to_account_id'
  },
  Amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'amount'
  },
  Timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'timestamp'
  }
}, {
  sequelize,
  tableName: 'transfers',
  timestamps: false
});

Transfer.belongsTo(Account, { foreignKey: 'FromAccountID', as: 'fromAccount' });
Transfer.belongsTo(Account, { foreignKey: 'ToAccountID', as: 'toAccount' });

export default Transfer;