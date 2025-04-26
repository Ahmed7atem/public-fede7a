const getClaimsByEmployeeId = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const claims = await Claim.find({ employeeId: employeeId }).lean();
    res.json(claims);
  } catch (error) {
    console.error('Error fetching employee claims:', error);
    res.status(500).json({ message: 'Error fetching employee claims', error: error.message });
  }
}; 