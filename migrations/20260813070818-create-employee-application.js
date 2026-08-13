'use strict';

module.exports = {
  async up(queryInterface, DataTypes) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'employee_applications',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
          },

          display_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },

          first_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },

          last_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },

          email: {
            type: DataTypes.STRING,
            allowNull: false,
          },

          phone: {
            type: DataTypes.STRING,
            allowNull: false,
          },

          address: {
            type: DataTypes.TEXT,
            allowNull: false,
          },

          gender: {
            type: DataTypes.ENUM('male', 'female', 'other'),
            allowNull: false,
          },

          status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
          },

          rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
          },

          bank_name: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          account_number: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          ifsc_code: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          account_holder_name: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          offer_letter_path: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          offer_sent_at: {
            type: DataTypes.DATE,
            allowNull: true,
          },

          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },

          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      await queryInterface.createTable(
        'employee_application_documents',
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
            references: {
              model: 'employee_applications',
              key: 'id',
            },
            onDelete: 'CASCADE',
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

          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },

          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('employee_application_documents', { transaction });
      await queryInterface.dropTable('employee_applications', { transaction });

      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_employee_applications_gender";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_employee_applications_status";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_employee_application_documents_document_type";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_employee_application_documents_document_subtype";',
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};'use strict';

module.exports = {
  async up(queryInterface, DataTypes) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'employee_applications',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
          },

          display_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },

          first_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },

          last_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },

          email: {
            type: DataTypes.STRING,
            allowNull: false,
          },

          phone: {
            type: DataTypes.STRING,
            allowNull: false,
          },

          address: {
            type: DataTypes.TEXT,
            allowNull: false,
          },

          gender: {
            type: DataTypes.ENUM('male', 'female', 'other'),
            allowNull: false,
          },

          status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
          },

          rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
          },

          bank_name: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          account_number: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          ifsc_code: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          account_holder_name: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          offer_letter_path: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          offer_sent_at: {
            type: DataTypes.DATE,
            allowNull: true,
          },

          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },

          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      await queryInterface.createTable(
        'employee_application_documents',
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
            references: {
              model: 'employee_applications',
              key: 'id',
            },
            onDelete: 'CASCADE',
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

          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },

          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('employee_application_documents', { transaction });
      await queryInterface.dropTable('employee_applications', { transaction });

      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_employee_applications_gender";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_employee_applications_status";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_employee_application_documents_document_type";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_employee_application_documents_document_subtype";',
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};