module.exports = (sequelize, DataTypes) => {
  const InternDocument = sequelize.define('InternDocument', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    intern_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // ID proof type — which kind of ID they uploaded
    document_type: {
      type: DataTypes.ENUM('aadhaar', 'voter_card', 'passport', 'driving_licence'),
      allowNull: false,
    },
    // required — path to ID proof file
    id_proof: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // required — path to passport photo
    photo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // optional — JSONB because it's text fields (college name, course, year etc.)
    college_detail: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
    // optional — path to resume file
    resume: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // optional — path to marksheet file
    last_sem_marksheet: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'intern_documents',
    timestamps: true,
  });

  return InternDocument;
};