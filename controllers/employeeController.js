const pool = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getAllEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT HEX(id) AS id, name, email, age, gender, children, smoker, role FROM employee');
    res.json(rows.map(row => ({
      ...row,
      id: row.id ? `${row.id.match(/.{1,8}/g).join('-')}` : null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employeeId = Buffer.from(req.params.id.replace(/-/g, ''), 'hex');
    const [rows] = await pool.query('SELECT HEX(id) AS id, name, email, age, gender, children, smoker, role FROM employee WHERE id = ?', [employeeId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({
      ...rows[0],
      id: rows[0].id ? `${rows[0].id.match(/.{1,8}/g).join('-')}` : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, age, gender, children, smoker, role } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const id = Buffer.from(require('crypto').randomUUID().replace(/-/g, ''), 'hex');
    const password = require('crypto').randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO employee (id, name, email, age, gender, password, children, smoker, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        name,
        email,
        age || 0,
        gender || 'Unknown',
        hashedPassword,
        children || 0,
        smoker != null ? (smoker ? 1 : 0) : 0,
        role || 'employee'
      ]
    );
    res.status(201).json({
      id: `${id.toString('hex').match(/.{1,8}/g).join('-')}`,
      name,
      email,
      age: age || 0,
      gender: gender || 'Unknown',
      children: children || 0,
      smoker: smoker != null ? (smoker ? 1 : 0) : 0,
      role: role || 'employee',
      password
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employeeId = Buffer.from(req.params.id.replace(/-/g, ''), 'hex');
    const { name, email, age, gender, children, smoker, role } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const [result] = await pool.query(
      'UPDATE employee SET name = ?, email = ?, age = ?, gender = ?, children = ?, smoker = ?, role = ? WHERE id = ?',
      [
        name,
        email,
        age || 0,
        gender || 'Unknown',
        children || 0,
        smoker != null ? (smoker ? 1 : 0) : 0,
        role || 'employee',
        employeeId
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({
      id: req.params.id,
      name,
      email,
      age: age || 0,
      gender: gender || 'Unknown',
      children: children || 0,
      smoker: smoker != null ? (smoker ? 1 : 0) : 0,
      role: role || 'employee'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employeeId = Buffer.from(req.params.id.replace(/-/g, ''), 'hex');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
    const [result] = await pool.query('DELETE FROM employee WHERE id = ?', [employeeId]);
    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;