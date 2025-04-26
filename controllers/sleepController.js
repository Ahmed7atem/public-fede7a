const getSleepDataByEmployeeId = async (req, res) => {
  try {
    const id = req.params.employeeId;
    console.log(`Looking for sleep data with employee ID: ${id}`);
    
    const sleepData = await SleepData.find({ employeeId: id }).sort({ startTime: -1 }).lean();
    
    if (sleepData.length === 0) {
      return res.status(404).json({ message: 'Sleep data not found for this employee' });
    }
    
    res.json(sleepData);
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    res.status(500).json({ message: 'Error fetching sleep data', error: error.message });
  }
}; 