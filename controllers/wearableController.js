const getWearableDataByEmployeeId = async (req, res) => {
  try {
    const id = req.params.employeeId;
    const wearableData = await WearableData.find({ employeeId: id }).lean();
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wearable data', error: error.message });
  }
}; 