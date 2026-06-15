const { body, param } = require("express-validator");
const { Project, User,  Role , sequelize, ProjectMember } = require("../models");
const { Op } = require("sequelize");
const { handleValidation } = require("../utils/validate");
const generateProjectCode = require("../utils/generateProjectCode");
const {appendRemark} = require("../utils/remarksLog");
const { createNotification } = require("./notifications.controller");
const PROJECT_TYPES = require("../constants/projectTypes");


// ── Validators ────────────────────────────────────────────────────────────────
const createProjectValidators = [
  body("name")
    .isString()
    .trim()
    .notEmpty(),

  body("description")
    .optional({ nullable: true })
    .isString(),

  
 // ✅ Correct
body("project_types")
  .isObject()
  .notEmpty(),

  // body("project_subtype")
  //   .notEmpty(),

  body("tech_details")
    .notEmpty(),

  body("development_status")
    .optional().notEmpty(),


body("remarks")
  .optional()
  .isArray(),
  handleValidation,
];

const updateProjectValidators = [
  param("id").isUUID(),

  body("name")
    .optional()
    .isString()
    .trim()
    .notEmpty(),

  body("description")
    .optional({ nullable: true })
    .isString(),

body("project_types")
.optional({nullable: true, checkFalsy: true})
  .isObject()
  .notEmpty(),

  // body("project_subtype")
  //   .optional({ nullable: true })
  //   .isString(),

  body("tech_details")
    .optional({ nullable: true })
    ,

  body("development_status")
    .optional({ nullable: true })
    .isString(),

  body("is_active")
    .optional()
    .isBoolean(),

    body("remarks")
  .optional()
  .isArray(),

  handleValidation,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const projectIncludes = [
  {
    model: User,
    as: "creator",
    attributes: ["id", "name", "employee_id"],
  },

  {
    separate: true,
    model: ProjectMember,
    as: "members",
    required: false,

    where: {
      is_active: true,
    },

    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "employee_id"],
      },

      {
        model: Role,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  },
];

const getUserRole = async (user_id) => {
  const user = await User.findByPk(user_id, {
    include: [{ model: Role}]
  });
  return user?.Role?.name; // "Team Lead", "Developer" etc.
};


const validateProjectTypes = (projectTypes) => {

  if (
    !projectTypes ||
    typeof projectTypes !== "object" ||
    Array.isArray(projectTypes)
  ) {
    return false;
  }

  for (const type in projectTypes) {

    // invalid type
    if (!PROJECT_TYPES[type]) {
      return false;
    }

    const subtypes = projectTypes[type];

    // must be array
    if (!Array.isArray(subtypes)) {
      return false;
    }

    for (const subtype of subtypes) {

      // invalid subtype
      if (!PROJECT_TYPES[type].includes(subtype)) {
        return false;
      }
    }
  }

  return true;
};


const createProject = async (req, res) => {
  const transaction = await sequelize.transaction();
   const io = req.app.get("io");
  try {
    const { name, description, project_types,  tech_details, development_status,  members = [] } = req.body;

    if (!name) {
      await transaction.rollback();
      return res.status(400).json({ message: "Name Field required!" });
    }

    if (!project_types) {
      await transaction.rollback();
      return res.status(400).json({ message: "Project type Field required!" });
    }

    // if (!project_subtype) {
    //   await transaction.rollback();
    //   return res.status(400).json({ message: "Project sub type Field required!" });
    // }
    if (!tech_details) {
      await transaction.rollback();
      return res.status(400).json({ message: "Details Field required!" });
    }


        if (!validateProjectTypes(project_types)) {

  await transaction.rollback();

  return res.status(400).json({
    message: "Invalid project types/subtypes",
  });
}

    const existingProject = await Project.findOne({
      where: {
        name: {
          [Op.iLike]: name,
        },
      },
      transaction,
    });

    if (existingProject) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Project already exists",
      });
    }

    // generate project code
    const code = await generateProjectCode(name, Project);

    
    let remarksLog = [];

// if fronted sends initial remark
if(req.body.remark)
{
  remarksLog = appendRemark({
 existingRemarks: [],
    text:req.body.remark,
    user_id:req.user.id,
    user_name:req.user.name
  }
    
  )
  // console.log("🚀 ~ createProject ~ remarksLog:", remarksLog)
}



    const project = await Project.create({
      name,
      code,
      description: description || null,
      project_types: project_types || {},
      // project_subtype: project_subtype || null,
      tech_details: tech_details || null,
      development_status,
      created_by: req.user.id,
      is_active: true,
      remarks : remarksLog
    }, { transaction });
    // console.log("🚀 ~ createProject ~ project:", project)

    // Validate that members is an array if passed
    if (members && !Array.isArray(members)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "members must be an array"
      });
    }

    const createdMembers = [];
    const skippedMembers = [];

    if (members && members.length > 0) {
      for (const item of members) {
        const { user_id, role_id } = item;

        if (!user_id) {
          skippedMembers.push({
            user_id: null,
            reason: "User ID is required"
          });
          continue;
        }

        // Check user exists
        const user = await User.findByPk(user_id, { transaction });

        if (!user) {
          skippedMembers.push({
            user_id,
            reason: "User not found"
          });
          continue;
        }

        // prevent duplicate member
        const existingMember = await ProjectMember.findOne({
          where: {
            project_id: project.id,
            user_id
          },
          transaction
        });

        if (existingMember) {
          // reactivate if previously removed
          if (!existingMember.is_active) {
            await existingMember.update(
              { is_active: true, role_id: role_id || existingMember.role_id },
              { transaction }
            );

            createdMembers.push(existingMember);
            continue;
          }

          skippedMembers.push({
            user_id,
            reason: "User already exists in this project"
          });

          continue;
        }

        // create member
        const newMember = await ProjectMember.create({
          project_id: project.id,
          user_id,
          role_id: role_id || null,
          is_active: true
        }, { transaction });

        createdMembers.push(newMember);
      }

      // If they explicitly passed members but none of them could be added,
      // rollback the transaction and return a 400.
      if (createdMembers.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "No members were added",
          skipped_members: skippedMembers,
        });
      }
    }


    await transaction.commit();

        for (const member of createdMembers) {
  await createNotification(io, {
    user_id: member.user_id,
    type:    "PROJECT_ADDED",
    title:   "Added to Project",
    message: `You have been added to project: ${project.name}`,
    data:    { project_id: project.id, code: project.code },
  });
}

    await project.reload({ include: projectIncludes });
    return res.status(201).json({ project });
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error("createProject error:", err);

    return res.status(500).json({ message: "Internal server error" });
  }
}


const listProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim();

    let where = { is_active: true };

    if (!req.user.is_admin) {
      const memberships = await ProjectMember.findAll({
        where: { user_id: req.user.id, is_active: true },
        attributes: ["project_id"],
      });
      const projectIds = memberships.map((m) => m.project_id);

      if (!projectIds.length) {
        return res.status(200).json({
          message: "No projects found",
          data: [],
          total: 0,
          page,
          limit,
        });
      }

      where.id = { [Op.in]: projectIds };
    }

    if (search) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { code: { [Op.iLike]: `%${search}%` } },
          ],
        },
      ];
    }

    const { count, rows } = await Project.findAndCountAll({
      limit,
      offset,
      where,
      include: projectIncludes,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return res.status(200).json({
      message: "List of Projects",
      data: rows,
      total: count,
      page,
      limit,
    });
  } catch (err) {
    console.error("listProjects error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, { include: projectIncludes });
    if (!project) return res.status(404).json({ message: "Project not found" });
     // Employee access check
    if (!req.user.is_admin) {

      const member = await ProjectMember.findOne({
        where: {
          project_id: project.id,
          user_id: req.user.id,
          is_active: true,
        },
      });

      if (!member) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    }
    return res.status(200).json({ project });
  } catch (err) {
    console.error("getProject error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const updateProject = async (req, res) => {
  try {

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const patch = {};

    [
       "name",
  "description",
  "project_types",
  // "project_subtype",
  "tech_details",
  "development_status",
  "remarks",
  "is_active",
  
    ].forEach((field) => {

      if (typeof req.body[field] !== "undefined") {
        patch[field] = req.body[field];
      }
    });

     if(req.body.remark)
    {
     patch.remarks = appendRemark({
  existingRemarks: project.remarks,
  text: req.body.remark,
  user_id: req.user.id,
  user_name:req.user.name
});
    }



if (
  typeof req.body.project_types !== "undefined" &&
  !validateProjectTypes(req.body.project_types)
) {

  return res.status(400).json({
    message: "Invalid project types/subtypes",
  });
}
  const up = await project.update(patch);
    // console.log("🚀 ~ updateProject ~ up:", up)
    await project.reload({ include: projectIncludes }); 
    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });

  } catch (err) {

    console.error("updateProject error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};




// ─────────────────────────────────────────────
// DELETE PROJECT
// ─────────────────────────────────────────────
const deleteProject = async (req, res) => {
  try {

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    await project.update({
      is_active: false,
    });

    return res.status(200).json({
      message: "Project deleted successfully",
    });

  } catch (err) {

    console.error("deleteProject error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


//update member role

const updateMemberRole = async (req, res) => {
  try {
    const {role_id} = req.body;

    const memberId = req.params.id;
    const member = await ProjectMember.findByPk(memberId);

    if(!member)
    {
      return res.status(404).json({
        message:"Member not found"
      });
    }

    const role = await Role.findByPk(role_id);

    if(!role)
    {
      return res.status(404).json({message:"This role id does not exist!"})
    }

    await member.update({role_id});

    res.status(200).json({message:"role updated", member})
  } catch (error) {
    res.status(500).json({message:"Something went wrong!"});
  }

}
 
const removeMember = async (req, res) => {
  try {
    const memberId = req.params.id;

    const member = await ProjectMember.findByPk(memberId);

    if(!member)
    {
      return res.status(404).json({
        message:"Member not found",
      });
    }

    // prevent self-removal
// if(member.user_id === req.user.id)
    //soft delete
      await member.update({
        is_active:false,
      });

      res.status(200).json({
        message: "Project member removed  successfully",
      });

  } catch (error) {
    //  console.log("🚀 ~ removeMember ~ error:", error)
         res.status(500).json({message:"Something went wrong!"});  
           
  }

}

const addProjectMembers = async (req, res) => {
  const transaction = await sequelize.transaction();
  const io = req.app.get("io");
  try {
    const projectId = req.params.id;
    
    // Check if the project exists and is active
    const project = await Project.findByPk(projectId, { transaction });
    if (!project || !project.is_active) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Project not found or is inactive"
      });
    }

    const { members = [] } = req.body;

    // Validate that members is an array and not empty
    if (!Array.isArray(members)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "members must be an array"
      });
    }

    if (members.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "members array cannot be empty"
      });
    }

    const createdMembers = [];
    const skippedMembers = [];

    for (const item of members) {
      const { user_id, role_id } = item;

      if (!user_id) {
        skippedMembers.push({
          user_id: null,
          reason: "User ID is required"
        });
        continue;
      }

      // Check if user exists
      const user = await User.findByPk(user_id, { transaction });
      if (!user) {
        skippedMembers.push({
          user_id,
          reason: "User not found"
        });
        continue;
      }

      // Check if role is provided and exists
      if (role_id) {
        const role = await Role.findByPk(role_id, { transaction });
        if (!role) {
          skippedMembers.push({
            user_id,
            reason: `Role ID ${role_id} does not exist`
          });
          continue;
        }
      }

      // Prevent duplicate active member
      const existingMember = await ProjectMember.findOne({
        where: {
          project_id: projectId,
          user_id
        },
        transaction
      });

      if (existingMember) {
        // Reactivate if previously removed
        if (!existingMember.is_active) {
          await existingMember.update(
            { is_active: true, role_id: role_id || existingMember.role_id },
            { transaction }
          );
          createdMembers.push(existingMember);
          continue;
        }

        skippedMembers.push({
          user_id,
          reason: "User already exists in this project"
        });
        continue;
      }

      // Create new active ProjectMember
      const newMember = await ProjectMember.create({
        project_id: projectId,
        user_id,
        role_id: role_id || null,
        is_active: true
      }, { transaction });

      createdMembers.push(newMember);
    }

    // If none of the passed members could be added/updated, rollback
    if (createdMembers.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "No members were added",
        skipped_members: skippedMembers
      });
    }

    await transaction.commit();

    // Reload project with the updated association to return
    const updatedProject = await Project.findByPk(projectId, { include: projectIncludes });

    for(const member of createdMembers)
    {
      await createNotification(io, {
        user_id: member.user_id,
        type: "PROJECT_ADDED",
        title: "Added to Project",
        message: `You have been added to project: ${project.name}`,
        data: {project_id: project.id, code: project.code}
      })
    }
    return res.status(200).json({
      message: "Members added successfully",
      project: updatedProject,
      created_members: createdMembers,
      skipped_members: skippedMembers
    });

  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error("addProjectMembers error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  updateMemberRole,
  removeMember,
  addProjectMembers,
  createProjectValidators,
  updateProjectValidators,
};
