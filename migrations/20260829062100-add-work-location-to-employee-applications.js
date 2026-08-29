'use strict';

module.exports = {
  async up(queryInterface, DataTypes) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'employee_applications',
        'work_location_type',
        {
          type: DataTypes.ENUM('in_office', 'out_of_office'),
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'employee_applications',
        'work_location',
        {
          type: DataTypes.STRING,
          allowNull: true,
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
      await queryInterface.removeColumn('employee_applications', 'work_location', { transaction });
      await queryInterface.removeColumn('employee_applications', 'work_location_type', { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_employee_applications_work_location_type";',
        { transaction }
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};