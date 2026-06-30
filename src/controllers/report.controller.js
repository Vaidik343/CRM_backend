const { Op } = require("sequelize");
const { Task, Call, WorkLog, User, Project, Role, ProjectMember } = require("../models");



const callIncludes = [
  {
    model: User,
    as: "caller",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: User,
    as: "transferredTo",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: User,
    as: "taskAssignee",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: Project,
    as: "project",
    attributes: ["id", "name"],
  }
];


const taskIncludes = [
  {
    model: User,
    as: "assignee",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: User,
    as: "assigner",
    attributes: ["id", "name", "employee_id"],
  },

  {
    model: Project,
    as: "project",
    attributes: ["id", "name", "code"],
  },

  {
    model: Call,
    as: "call",
    attributes: ["id", "display_id"],
  },
];


const workLogIncludes = [
  { model: User, as: "user", attributes: ["id", "name", "employee_id",] },
  {model: Project,   attributes: ["id", "name"]}
];

// GET /api/reports/:id/calls
const getEmployeeCalls = async (req, res) => {
  try {
    const { id } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim();
    const project_id = req.query.project_id?.trim();


    const employee = await User.findByPk(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });


    const { from, to } = req.query;

    // ── Date range logic (unchanged in behavior, just computed before assembly) ──
    let dateWhere = {};
    if (from && to) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateWhere = { createdAt: { [Op.between]: [start, end] } };
    } else if (!req.user.is_admin && req.query.all_dates !== "true") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      dateWhere = { createdAt: { [Op.between]: [start, end] } };
    }

    
    // ── Assemble all conditions into one array, wrapped once at the end ──
    const conditions = [];

    conditions.push({
    [Op.or]: [
        { user_id: id },
        { transfer_to: id },
        // { task_assigned_to: id },
        { attendees: { [Op.contains]: [id] } }
    ]
});

    if (Object.keys(dateWhere).length) conditions.push(dateWhere);

    if (project_id) conditions.push({ project_id });

    if (search) {
      conditions.push({
        [Op.or]: [
          { caller_name: { [Op.iLike]: `%${search}%` } },
          { caller_number: { [Op.iLike]: `%${search}%` } },
          { display_id: { [Op.iLike]: `%${search}%` } },

            { "$project.name$": { [Op.iLike]: `%${search}%` } },
      { "$project.code$": { [Op.iLike]: `%${search}%` } },

    
        ],
      });
    }

    const where = { [Op.and]: conditions };
    const { count, rows } = await Call.findAndCountAll({
      where,
      include: callIncludes,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.json({ data: rows, total: count, page, limit });
  } catch (err) {
    console.error("getEmployeeCalls error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};



// GET /api/reports/:id/tasks
const getEmployeeTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim();
  
    const due_filter = req.query.due_filter; // "overdue" | "due_soon" | undefined
   
 const employee = await User.findByPk(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });


const { from, to } = req.query;
let dateWhere = {};
if (from && to) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  dateWhere = { createdAt: { [Op.between]: [start, end] } };
} else if (!req.user.is_admin && req.query.all_dates !== "true") {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  dateWhere = { createdAt: { [Op.between]: [start, end] } };
}

    // Get all teams user belongs to
    const membership = await ProjectMember.findAll({
      where: { user_id: req.user.id },
    });
    const projectIds = membership.map((m) => m.project_id);

    // Get user role to determine visibility scope
    // const userRole = await getUserRole(req.user.id);
    // const isLead = ["Team Lead", "Project Manager"].includes(userRole);

    // let where = {};
    // if (req.user.is_admin) {
    //   where = {};                          // Admin: see all tasks
    // } else if (isLead) {
    //   where = { team_id: teamIds };        // Lead/PM: see all tasks in their teams
    // } else {
    //   where = { assigned_to: req.user.id }; // Developer: see only own tasks
    // }


    // ── Assemble all conditions into one array, wrapped once at the end ──
    const conditions = [];

    conditions.push({
       [Op.or]: [{ assigned_to: id }, { assigned_by: id }] 
  });

    // Employee: dateWhere always applies (today/7-day default or explicit range).
    // Admin: dateWhere only applies if explicitly provided via from/to.
    if (!req.user.is_admin) {
      if (Object.keys(dateWhere).length) conditions.push(dateWhere);
    } else if (from && to) {
      if (Object.keys(dateWhere).length) conditions.push(dateWhere);
    }



    if (search) {
      conditions.push({
        [Op.or]: [
          { task: { [Op.iLike]: `%${search}%` } },
          { display_id: { [Op.iLike]: `%${search}%` } },

            { "$project.name$": { [Op.iLike]: `%${search}%` } },
      { "$project.code$": { [Op.iLike]: `%${search}%` } },

      { "$assignee.name$": { [Op.iLike]: `%${search}%` } },
      { "$assignee.employee_id$": { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const now = new Date();

    if (due_filter === "overdue") {
      conditions.push({
        due_date: { [Op.lt]: now },
        status: { [Op.ne]: "closed" },
      });
    } else if (due_filter === "due_soon") {
      const in48hrs = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      conditions.push({
        due_date: { [Op.between]: [now, in48hrs] },
        status: { [Op.ne]: "closed" },
      });
    }


    const project_id = req.query.project_id;

if (project_id) {
    conditions.push({
        project_id
    });
}

    const where = { [Op.and]: conditions };


    const { count, rows } = await Task.findAndCountAll({
      where,
      include: taskIncludes,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.json({ data: rows, total: count, page, limit });
  } catch (err) {
    console.error("getEmployeeTasks error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// GET /api/reports/:id/worklogs
const getEmployeeWorkLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim();

     const employee = await User.findByPk(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const { from, to } = req.query;

const conditions = [];

// Always show only this employee's worklogs
conditions.push({
  user_id: id,
});

// Date filter
if (from && to) {
  conditions.push({
    date: {
      [Op.between]: [from, to],
    },
  });
}

// Search
if (search) {
  conditions.push({
    [Op.or]: [
      { description: { [Op.iLike]: `%${search}%` } },
      { "$Project.name$": { [Op.iLike]: `%${search}%` } },
    ],
  });
}


   const project_id = req.query.project_id;
  console.log("🚀 ~ getEmployeeWorkLogs ~ FULL QUERY:", req.query);
console.log("🚀 ~ getEmployeeWorkLogs ~ project_id:", project_id);

if (project_id) {
    conditions.push({
        project_id
    });
}

const where = {
  [Op.and]: conditions,
};
const test = await WorkLog.findOne({ include: workLogIncludes });
console.log("🚀 ~ getEmployeeWorkLogs ~ test:", test)

const { count, rows } = await WorkLog.findAndCountAll({
  where,
  include: workLogIncludes,
  order: [["date", "DESC"]],
  limit,
  offset,
});


    return res.json({ data: rows, total: count, page, limit });
  } catch (err) {
    console.error("getEmployeeWorkLogs error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.reportController = { getEmployeeCalls, getEmployeeTasks, getEmployeeWorkLogs };