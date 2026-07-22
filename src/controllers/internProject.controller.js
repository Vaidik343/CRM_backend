const { Op, where } = require('sequelize');

const {
  InternProject,
  InternTask,
  User,
  Intern,
  sequelize,
} = require('../models');

const generateDisplayId = require('../utils/generateDisplayId');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const projectIncludes = [
  {
    model: User,
    as: 'mentor',
    attributes: ['id', 'name', 'employee_id'],
  },
];

// ─────────────────────────────────────────────
// INTERN — Create Project
// ─────────────────────────────────────────────


const createProject = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const intern_id = req.intern.id;

         const { name, description, tech_details, mentor_id } = req.body;

         if(!name || !name.trim())
         {
            await t.rollback();
            return res.status(400).json({message: 'Project  name is required.'}); 
         }

         const existing = await InternProject.findOne({ where: {intern_id}});
         if(existing)
         {
            await t.rollback();

            return res.status(409).json({
                message: 'You already have a project defined. You can only have one project'
            });
         }

         // 3 validate mentor if provided
         if(mentor_id)
         {
            const mentor = await User.findByPk(mentor_id);
            if(!mentor)
            {
                await t.rollback();
                return res.status(404).json({message: 'Mentor not found.'});
            }
         }

         // 4. generate display id 

            const display_id = generateDisplayId({
      prefix:     'IP',
      employeeId: req.intern.enrollment_no,
    });

     // ── 5. Create project ──
    const project = await InternProject.create({
      intern_id,
      display_id,
      name:         name.trim(),
      description:  description?.trim() || null,
      tech_details: tech_details        || null,
      mentor_id:    mentor_id           || req.intern.mentor_id || null,
    }, { transaction: t });

    await t.commit();

    await project.reload({ include: projectIncludes });

    return res.status(201).json({
      message: 'Project created successfully.',
      project,
    });

    } catch (error) {
        await t.rollback();
    return res.status(500).json({ message: error.message });
    }
}

// inter get own project

const getMyProject = async () => {
    try {
        const intern_id = req.intern.id;

        const project = await InternProject.findOne({
            where: {intern_id},
            include: projectIncludes,
        });

        if(!project)
        {
            return res.status(404).json({message: 'No project found.'});
        }

        return res.status(200).json({project});


    } catch (error) {
        return res.status(500).json({message: error.message});
    }
};

// inter - update own project

const updateProject = async (req, res) => {
    try {
        const intern_id = req.intern.id;
        const {name, description, tech_details} = req.body;

        const project = await InternProject.findOne({where: {intern_id}});

        if (!project) {
      return res.status(404).json({ message: 'No project found.' });
    }

    // note intern cannot change mentor - only admin can

    await project.update({
        name: name?.trim() || project.name,
        description: description !=undefined ? description?.trim() || null : project.description,

        tech_details: tech_details != undefined ? tech_details : project.tech_details,
    });

    await project.reload({include: projectIncludes});

    return res.status(200).json({
        message: 'Project updated successfully.',
        project,
    });
    } catch (error) {
         return res.status(500).json({ message: error.message });
    }

}

// admin - get intern's project


const getInternProject = async (req, res) => {
  try {
    const { intern_id } = req.params;

    const project = await InternProject.findOne({
      where: { intern_id },
      include: projectIncludes,
    });

    if (!project) {
      return res.status(404).json({
        message: "No project found for this intern.",
      });
    }

    return res.status(200).json({ project });

  } catch (error) {
    console.log("🚀 ~ getInternProject ~ error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// admin update intern's project (mentor only)

const adminUpdateProject = async (req, res) => {
    try {
        const {intern_id} = req.params;
        const {mentor_id} = req.body;

        const project = await InternProject.findOne({where: {intern_id}});

         if (!project) {
      return res.status(404).json({ message: 'No project found for this intern.' });
    }

    if (mentor_id) {
      const mentor = await User.findByPk(mentor_id);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found.' });
      }
    }

    await project.update({
      mentor_id: mentor_id || project.mentor_id,
    });

    await project.reload({ include: projectIncludes });

    return res.status(200).json({
      message: 'Project updated.',
      project,
    });


    } catch (error) {
        return res.status(500).json({ message: err.message });
    }
}


module.exports = {
  createProject,
  getMyProject,
  updateProject,
  getInternProject,
  adminUpdateProject,
};