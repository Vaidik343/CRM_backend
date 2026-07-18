const {Op} = require('sequelize');

const {InternTask, InternProject, Intern, User, sequelize} = require('../models')

const generateDisplayId = require("../utils/generateDisplayId");
const {appendRemark} = require("../utils/remarksLog");

// helpers 

const taskIncludes = [
  {
    model: InternProject,
    as: 'project',
    attributes: ['id', 'display_id', 'name'],
  },
  {
    model: User,
    as: 'assigner',
    attributes: ['id', 'name', 'employee_id'],
  },
];


// intern - create own task

const createTask = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const inter_id = req.intern.id;

      const {
      task,
      description,
      intern_project_id,
      due_date,
      remark,
    } = req.body;

    } catch (error) {
        
    }

}