const {Op} = require('sequelize');
const {User, sequelize} = require('../models');

//admin put employee on probation

const startProbation = async (req, res) => {

    const t = await sequelize.transaction();
    try {
        const {id} = req.params;
        const {probation_start , probation_end} = req.body;

        //validation 
 if (!probation_start || !probation_end) {
      await t.rollback();
      return res.status(400).json({ message: 'probation_start and probation_end are required.' });
    }

    if (isNaN(new Date(probation_start)) || isNaN(new Date(probation_end))) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid dates.' });
    }

    if (new Date(probation_start) >= new Date(probation_end)) {
      await t.rollback();
      return res.status(400).json({ message: 'probation_end must be after probation_start.' });
    }


     const user = await User.findByPk(id);

    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Employee not found.' });
    }

    if (user.is_admin) {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot put an admin on probation.' });
    }

    if (user.is_probation) {
      await t.rollback();
      return res.status(400).json({ message: 'Employee is already on probation.' });
    }

    if (!user.is_active) {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot put an inactive employee on probation.' });
    }

     await user.update({
      is_probation:     true,
      probation_start,
      probation_end,
      probation_status: 'active',
    }, { transaction: t });

    await t.commit();

    return res.status(200).json({
      message: 'Employee placed on probation.',
      user: {
        id:               user.id,
        name:             user.name,
        employee_id:      user.employee_id,
        is_probation:     user.is_probation,
        probation_start:  user.probation_start,
        probation_end:    user.probation_end,
        probation_status: user.probation_status,
      },
    });


    } catch (error) {
       await t.rollback();
       return res.status(500).json({ message: err.message });
    }

}

// passProbation 

const passProbation = async(req, res) => {
    const t = await sequelize.transaction();
    try {
        const {id} = req.params;

        const user = await User.findByPk(id);

        if(!user)
        {
            await t.rollback();
            return res.status(404).json({message: 'Employee not found.'});
        }

        if(!user.is_probation)
        {
            await t.rollback();
            return res.status(400).json({message: 'Employee is not on probation'});
        }

        if(user.probation_status !=='active')
        {
            await t.rollback();
            return res.status(400).json({
                message: `Probation is already ${user.probation_status}.`,
            });
        }

        await user.update({
            is_probation: false,
            probation_start: 'passed',
        }, {transaction: t});

        await t.commit();

        return res.status(200).json({
            message: 'Probation passed. Employee is now a confirmed employee.',
            user: {
                id: user.id,
                name: user.name,
                employee_id: user.employee_id,
                is_probation: user.is_probation,
                probation_status: user.probation_status
            },
        })
    } catch (error) {
        await t.rollback();
        return res.status(500).json({message: err.message});
    }
};


// admin - terminate probation

const terminateProbation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Termination reason is required.' });
    }

    const user = await User.findByPk(id);

    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Employee not found.' });
    }

    if (!user.is_probation) {
      await t.rollback();
      return res.status(400).json({ message: 'Employee is not on probation.' });
    }

    if (user.probation_status !== 'active') {
      await t.rollback();
      return res.status(400).json({
        message: `Probation is already ${user.probation_status}.`,
      });
    }

    await user.update({
      is_probation:     false,
      probation_status: 'terminated',
      is_active:        false,  // deactivate account
    }, { transaction: t });

    await t.commit();

    return res.status(200).json({
      message: 'Employee terminated and account deactivated.',
      user: {
        id:               user.id,
        name:             user.name,
        employee_id:      user.employee_id,
        is_active:        user.is_active,
        probation_status: user.probation_status,
      },
    });

  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// admin - get all probation

const getProbationEmployees = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { probation_status, search } = req.query;

    const where = { is_probation: true };

    // allow filtering by status too
    // e.g. ?probation_status=active shows only active probation
    // ?probation_status=all shows all including passed/terminated
    if (probation_status && probation_status !== 'all') {
      where.probation_status = probation_status;
    } else if (!probation_status) {
      // default — show only active probation employees
      where.probation_status = 'active';
    }

    if (search) {
      where[Op.or] = [
        { name:        { [Op.iLike]: `%${search}%` } },
        { employee_id: { [Op.iLike]: `%${search}%` } },
        { email:       { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 'name', 'employee_id', 'email',
        'is_active', 'is_probation',
        'probation_start', 'probation_end', 'probation_status',
        'createdAt',
      ],
      order:    [['probation_start', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total:      count,
      page,
      totalPages: Math.ceil(count / limit),
      employees:  rows,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────────
// ADMIN — Get Single Probation Employee
// ─────────────────────────────────────────────

const getProbationEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: [
        'id', 'name', 'employee_id', 'email',
        'is_active', 'is_probation',
        'probation_start', 'probation_end', 'probation_status',
        'createdAt',
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    if (!user.is_probation && !user.probation_status) {
      return res.status(400).json({ message: 'This employee has no probation record.' });
    }

    return res.status(200).json({ employee: user });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────────
// ADMIN — Update Probation Dates
// (extend or adjust probation period)
// ─────────────────────────────────────────────

const updateProbationDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { probation_start, probation_end } = req.body;

    if (!probation_start && !probation_end) {
      return res.status(400).json({
        message: 'At least one of probation_start or probation_end is required.',
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    if (!user.is_probation || user.probation_status !== 'active') {
      return res.status(400).json({
        message: 'Employee is not on active probation.',
      });
    }

    const newStart = probation_start || user.probation_start;
    const newEnd   = probation_end   || user.probation_end;

    if (new Date(newStart) >= new Date(newEnd)) {
      return res.status(400).json({
        message: 'probation_end must be after probation_start.',
      });
    }

    await user.update({
      probation_start: newStart,
      probation_end:   newEnd,
    });

    return res.status(200).json({
      message: 'Probation dates updated.',
      user: {
        id:               user.id,
        name:             user.name,
        employee_id:      user.employee_id,
        probation_start:  user.probation_start,
        probation_end:    user.probation_end,
        probation_status: user.probation_status,
      },
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  startProbation,
  passProbation,
  terminateProbation,
  getProbationEmployees,
  getProbationEmployee,
  updateProbationDates,
};
