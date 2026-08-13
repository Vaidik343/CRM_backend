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
      type: DataTypes.ENUM('aadhaar', 'voter_card', 'passport', 'driving_licence','noc'),
      allowNull: false,
    },

    // ── Original documents (set at registration, admin sees these) ─────────
    id_proof: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    college_detail: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
    resume: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_sem_marksheet: {
      type: DataTypes.STRING,
      allowNull: true,
    },
noc: {
  type: DataTypes.STRING,
  allowNull: true,
},
    // ── Updated documents (intern uploads from profile — pending admin review) ─
    // These never overwrite the originals automatically.
    // Admin can promote them by calling adminUpdateIntern with promote_document_fields.
    updated_id_proof: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    updated_photo: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    updated_resume: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    updated_last_sem_marksheet: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },

    // ── JSONB array of fields admin has verified ───────────────────────────
    // e.g. ['id_proof', 'photo', 'resume', 'last_sem_marksheet', 'document_type']
    verified_fields: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
  }, {
    tableName: 'intern_documents',
    timestamps: true,
    underscored: true,
  });

  return InternDocument;
};