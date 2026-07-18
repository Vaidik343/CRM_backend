'use strict';

const jwt    = require('jsonwebtoken');
const { Intern } = require('../models');

/**
 * Authenticate intern using JWT token.
 * Token must have type: 'intern' in payload.
 * Attaches intern to req.intern
 */
async function authenticateIntern(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token      = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing token.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // make sure this token belongs to an intern not an employee
    if (payload.type !== 'intern') {
      return res.status(403).json({ message: 'Access denied. Not an intern token.' });
    }

    const intern = await Intern.findByPk(payload.sub, {
      attributes: [
        'id', 'display_id', 'name', 'email',
        'intern_type', 'degree_type', 'college_name',
        'status', 'start_date', 'end_date',
        'mentor_id', 'enrollment_no',
      ],
    });

    if (!intern) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    if (intern.status === 'completed') {
      return res.status(403).json({ message: 'Your internship period has ended.' });
    }

    if (intern.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not active.' });
    }

    req.intern = intern.toJSON();
    next();

  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
}

module.exports = { authenticateIntern };