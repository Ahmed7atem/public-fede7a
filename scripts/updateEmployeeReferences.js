const mongoose = require('mongoose');
require('dotenv').config();

// Import models from schemas.js
const {
    Employee,
    HealthData,
    WearableData,
    SleepData,
    Prediction,
    Claim,
    Policy
} = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

async function updateEmployeeReferences() {
    try {
        // Get collection counts before update
        const healthDataCount = await HealthData.countDocuments();
        const wearableDataCount = await WearableData.countDocuments();
        const sleepDataCount = await SleepData.countDocuments();
        const predictionCount = await Prediction.countDocuments();
        const claimCount = await Claim.countDocuments();

        console.log('\nCollection counts before update:');
        console.log(`HealthData: ${healthDataCount}`);
        console.log(`WearableData: ${wearableDataCount}`);
        console.log(`SleepData: ${sleepDataCount}`);
        console.log(`Prediction: ${predictionCount}`);
        console.log(`Claim: ${claimCount}\n`);

        // Drop indexes that might cause conflicts
        console.log('Dropping existing indexes...');
        await HealthData.collection.dropIndex('employee_1').catch(() => console.log('No employee index in HealthData'));
        await WearableData.collection.dropIndex('employee_1').catch(() => console.log('No employee index in WearableData'));
        await SleepData.collection.dropIndex('employee_1').catch(() => console.log('No employee index in SleepData'));
        await Prediction.collection.dropIndex('employee_1').catch(() => console.log('No employee index in Prediction'));
        await Claim.collection.dropIndex('patientId_1').catch(() => console.log('No patientId index in Claim'));

        // Update HealthData collection: rename 'employee' to 'employeeId'
        const healthDataResult = await HealthData.updateMany(
            { employee: { $exists: true } },
            [{ 
                $set: { 
                    employeeId: '$employee',
                    employee: '$$REMOVE'
                } 
            }]
        );
        console.log(`Updated ${healthDataResult.modifiedCount} HealthData records`);

        // Update WearableData collection: rename 'employee' to 'employeeId'
        const wearableDataResult = await WearableData.updateMany(
            { employee: { $exists: true } },
            [{ 
                $set: { 
                    employeeId: '$employee',
                    employee: '$$REMOVE'
                } 
            }]
        );
        console.log(`Updated ${wearableDataResult.modifiedCount} WearableData records`);

        // Update SleepData collection: rename 'employee' to 'employeeId'
        const sleepDataResult = await SleepData.updateMany(
            { employee: { $exists: true } },
            [{ 
                $set: { 
                    employeeId: '$employee',
                    employee: '$$REMOVE'
                } 
            }]
        );
        console.log(`Updated ${sleepDataResult.modifiedCount} SleepData records`);

        // Update Prediction collection: rename 'employee' to 'employeeId'
        const predictionResult = await Prediction.updateMany(
            { employee: { $exists: true } },
            [{ 
                $set: { 
                    employeeId: '$employee',
                    employee: '$$REMOVE'
                } 
            }]
        );
        console.log(`Updated ${predictionResult.modifiedCount} Prediction records`);

        // Update Claim collection: rename 'patientId' to 'employeeId'
        const claimResult = await Claim.updateMany(
            { patientId: { $exists: true } },
            [{ 
                $set: { 
                    employeeId: '$patientId',
                    patientId: '$$REMOVE'
                } 
            }]
        );
        console.log(`Updated ${claimResult.modifiedCount} Claim records`);

        // Create new indexes if needed
        console.log('\nCreating new indexes...');
        await HealthData.collection.createIndex({ employeeId: 1 });
        await WearableData.collection.createIndex({ employeeId: 1 });
        await SleepData.collection.createIndex({ employeeId: 1 });
        await Prediction.collection.createIndex({ employeeId: 1 });
        await Claim.collection.createIndex({ employeeId: 1 });

        // Verify the updates
        const healthDataWithNewField = await HealthData.countDocuments({ employeeId: { $exists: true } });
        const wearableDataWithNewField = await WearableData.countDocuments({ employeeId: { $exists: true } });
        const sleepDataWithNewField = await SleepData.countDocuments({ employeeId: { $exists: true } });
        const predictionWithNewField = await Prediction.countDocuments({ employeeId: { $exists: true } });
        const claimWithNewField = await Claim.countDocuments({ employeeId: { $exists: true } });

        console.log('\nDocuments with new employeeId field:');
        console.log(`HealthData: ${healthDataWithNewField}`);
        console.log(`WearableData: ${wearableDataWithNewField}`);
        console.log(`SleepData: ${sleepDataWithNewField}`);
        console.log(`Prediction: ${predictionWithNewField}`);
        console.log(`Claim: ${claimWithNewField}`);

        console.log('\nMigration completed successfully');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        mongoose.disconnect();
    }
}

updateEmployeeReferences(); 