'use strict';

module.exports = (sequelize, DataTypes) => {
  const OfferLetterAddress = sequelize.define(
    'OfferLetterAddress',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'offer_letter_addresses',
      timestamps: true,
    }
  );
  return OfferLetterAddress;
};
