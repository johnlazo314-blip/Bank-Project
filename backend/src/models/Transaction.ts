import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import Account from './Account';
import Transfer from './Transfer';

interface TransactionAttributes {
  TransactionID: number;
  AccountID: number;
  Amount: number;
  TransactionType: 'withdrawal' | 'deposit' | 'transfer';
  TransferID: number | null;
  Timestamp: Date;
}

type TransactionCreationAttributes = Optional<TransactionAttributes, 'TransactionID' | 'TransferID' | 'Timestamp'>;

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public TransactionID!: number;
  public AccountID!: number;
  public Amount!: number;
  public TransactionType!: 'withdrawal' | 'deposit' | 'transfer';
  public TransferID!: number | null;
  public Timestamp!: Date;
}

Transaction.init({
  TransactionID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'transaction_id'
  },
  AccountID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'accounts', key: 'account_id' },
    field: 'account_id'
  },
  Amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'amount'
  },
  TransactionType: {
    type: DataTypes.ENUM('withdrawal', 'deposit', 'transfer'),
    allowNull: false,
    field: 'transaction_type'
  },
  TransferID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'transfers', key: 'transfer_id' },
    field: 'transfer_id'
  },
  Timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'timestamp'
  }
}, {
  sequelize,
  tableName: 'transactions',
  timestamps: false
});

Transaction.belongsTo(Account, { foreignKey: 'AccountID', as: 'account' });
Transaction.belongsTo(Transfer, { foreignKey: 'TransferID', as: 'transfer' });

export default Transaction;
