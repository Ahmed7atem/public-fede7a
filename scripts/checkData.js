require('dotenv').config();
const mongoose = require('mongoose');
const { Employee, HealthData, WearableData, SleepData, Policy, Claim, Provider, ComplaintTicket } = require('../models/schemas');

const checkData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check Employee data
    console.log('\nEmployee Sample:');
    const employee = await Employee.findOne();
    console.log(employee ? employee.toObject() : 'No employee data found');

    // Check HealthData
    console.log('\nHealthData Sample:');
    const healthData = await HealthData.findOne();
    console.log(healthData ? healthData.toObject() : 'No health data found');

    // Check WearableData
    console.log('\nWearableData Sample:');
    const wearableData = await WearableData.findOne();
    console.log(wearableData ? wearableData.toObject() : 'No wearable data found');

    // Check SleepData
    console.log('\nSleepData Sample:');
    const sleepData = await SleepData.findOne();
    console.log(sleepData ? sleepData.toObject() : 'No sleep data found');

    // Check Policy
    console.log('\nPolicy Sample:');
    const policy = await Policy.findOne();
    console.log(policy ? policy.toObject() : 'No policy data found');

    // Check Claim
    console.log('\nClaim Sample:');
    const claim = await Claim.findOne();
    console.log(claim ? claim.toObject() : 'No claim data found');

    // Check Provider
    console.log('\nProvider Sample:');
    const provider = await Provider.findOne();
    console.log(provider ? provider.toObject() : 'No provider data found');

    // Check ComplaintTicket
    console.log('\nComplaintTicket Sample:');
    const complaint = await ComplaintTicket.findOne();
    console.log(complaint ? complaint.toObject() : 'No complaint data found');

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkData(); 