const { WearableData } = require('../models/schemas');

exports.getAllWearableData = async (req, res) => {
  try {
    const wearableData = await WearableData.find();
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.getWearableDataById = async (req, res) => {
  try {
    const wearableData = await WearableData.findById(req.params.id);
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }
    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.createWearableData = async (req, res) => {
  try {
    const {
      employee,
      logDate,
      stepCount,
      activeEnergy,
      exerciseTime,
      heartRate,
      heartRateVariability,
      sleepQuality,
      timeInBed,
      walkingDistance
    } = req.body;

    if (!employee || !logDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const wearableData = new WearableData({
      employee,
      logDate,
      stepCount: stepCount || 0,
      activeEnergy: activeEnergy || 0,
      exerciseTime: exerciseTime || 0,
      heartRate: heartRate || 0,
      heartRateVariability: heartRateVariability || 0,
      sleepQuality: sleepQuality || 0,
      timeInBed: timeInBed || 0,
      walkingDistance: walkingDistance || 0
    });

    await wearableData.save();

    res.status(201).json(wearableData);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.updateWearableData = async (req, res) => {
  try {
    const wearableData = await WearableData.findById(req.params.id);
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }

    const {
      logDate,
      stepCount,
      activeEnergy,
      exerciseTime,
      heartRate,
      heartRateVariability,
      sleepQuality,
      timeInBed,
      walkingDistance
    } = req.body;

    if (logDate) wearableData.logDate = logDate;
    if (stepCount !== undefined) wearableData.stepCount = stepCount;
    if (activeEnergy !== undefined) wearableData.activeEnergy = activeEnergy;
    if (exerciseTime !== undefined) wearableData.exerciseTime = exerciseTime;
    if (heartRate !== undefined) wearableData.heartRate = heartRate;
    if (heartRateVariability !== undefined) wearableData.heartRateVariability = heartRateVariability;
    if (sleepQuality !== undefined) wearableData.sleepQuality = sleepQuality;
    if (timeInBed !== undefined) wearableData.timeInBed = timeInBed;
    if (walkingDistance !== undefined) wearableData.walkingDistance = walkingDistance;

    await wearableData.save();

    res.json(wearableData);
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
};

exports.deleteWearableData = async (req, res) => {
  try {
    const wearableData = await WearableData.findById(req.params.id);
    if (!wearableData) {
      return res.status(404).json({ message: 'Wearable data not found' });
    }

    await wearableData.deleteOne();

    res.json({ message: 'Wearable data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Server error - ${error.message}` });
  }
}; 