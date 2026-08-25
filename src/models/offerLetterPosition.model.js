'use strict';

module.exports = (sequelize, DataTypes) => {
  const OfferLetterPosition = sequelize.define(
    'OfferLetterPosition',
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
      tableName: 'offer_letter_positions',
      timestamps: true,
    }
  );
  return OfferLetterPosition;
};
