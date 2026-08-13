

module.exports = (sequelize, DataTypes) => {
  const EmployeeApplicationDocument = sequelize.define(
    'EmployeeApplicationDocument',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      document_type: {
        type: DataTypes.ENUM(
          'photo_id',
          'address_id',
          'educational_certificate',
          'bank_document'
        ),
        allowNull: false,
      },
      // null for educational_certificate and bank_document
      document_subtype: {
        type: DataTypes.ENUM(
          'aadhaar',
          'voter_card',
          'passport',
          'driving_licence',
          'light_bill',
          'gas_bill'
        ),
        allowNull: true,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      original_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      uploaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'employee_application_documents',
      underscored: true,
      timestamps: true,
    }
  );

  return EmployeeApplicationDocument;
};