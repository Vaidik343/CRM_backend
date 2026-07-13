module.exports = (sequelize, DataTypes) => {

    const CompanySettings = sequelize.define(
        'CompanySettings', {
            id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    office_start_time : {
        type: DataTypes.TIME,
        allowNull: false,
    },
    full_day_notice_hours : {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    half_day_notice_hours : {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    },  {
      tableName: "company_settings",
      timestamps: true,
    },
)

return CompanySettings

}