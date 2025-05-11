const mongoose = require('mongoose');
const { Claim, Dependent } = require('../models/schemas');
require('dotenv').config();

async function updateClaimsForDependents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all claims
    const claims = await Claim.find().lean();
    console.log(`Found ${claims.length} total claims`);

    // Group claims by employeeId
    const claimsByEmployee = {};
    claims.forEach(claim => {
      const employeeId = claim.employeeId; // Fixed: using correct field name
      if (!claimsByEmployee[employeeId]) {
        claimsByEmployee[employeeId] = [];
      }
      claimsByEmployee[employeeId].push(claim);
    });

    // Log the top 25 employees by claim count
    const employeeClaimCounts = Object.entries(claimsByEmployee)
      .map(([employeeId, claims]) => ({ employeeId, count: claims.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    console.log('\nTop 25 employees by claim count:');
    employeeClaimCounts.forEach(({ employeeId, count }, index) => {
      console.log(`${index + 1}. Employee ${employeeId}: ${count} claims`);
    });

    // Get employees with multiple claims
    const employeesWithMultipleClaims = Object.entries(claimsByEmployee)
      .filter(([_, claims]) => claims.length > 1)
      .map(([employeeId, claims]) => ({ employeeId, claims }));
    
    console.log(`\nFound ${employeesWithMultipleClaims.length} employees with multiple claims`);

    // For each employee with multiple claims
    let updatedClaims = 0;
    for (const { employeeId, claims } of employeesWithMultipleClaims) {
      // Get dependents for this employee
      const dependents = await Dependent.find({ employeeId }).lean();
      
      if (dependents.length > 0) {
        console.log(`\nProcessing employee ${employeeId}:`);
        console.log(`- Has ${claims.length} claims`);
        console.log(`- Has ${dependents.length} dependents`);
        
        // Calculate how many claims to reassign (50% rounded down)
        const claimsToReassign = Math.floor(claims.length / 2);
        console.log(`- Will reassign ${claimsToReassign} claims to dependents`);
        
        // Randomly select claims to reassign
        const claimsToUpdate = claims
          .sort(() => Math.random() - 0.5)
          .slice(0, claimsToReassign);
        
        // For each claim to update, randomly assign it to a dependent
        for (const claim of claimsToUpdate) {
          const randomDependent = dependents[Math.floor(Math.random() * dependents.length)];
          
          // Update the claim
          await Claim.findByIdAndUpdate(claim._id, {
            $set: {
              claimFor: 'dependent',
              claimForId: randomDependent.dependentId,
              claimAmount: Math.round(claim.claimAmount * (0.7 + Math.random() * 0.6))
            }
          });
          
          updatedClaims++;
        }

        // Update remaining claims to explicitly mark them as employee claims
        const remainingClaims = claims.filter(c => 
          !claimsToUpdate.some(ct => ct._id.toString() === c._id.toString())
        );
        
        for (const claim of remainingClaims) {
          await Claim.findByIdAndUpdate(claim._id, {
            $set: {
              claimFor: 'employee',
              claimForId: employeeId
            }
          });
        }
      } else {
        // If no dependents, mark all claims as employee claims
        for (const claim of claims) {
          await Claim.findByIdAndUpdate(claim._id, {
            $set: {
              claimFor: 'employee',
              claimForId: employeeId
            }
          });
        }
      }
    }

    console.log(`\nUpdated ${updatedClaims} claims to be dependent claims`);
    
    // Verify the updates
    const totalClaims = await Claim.countDocuments();
    const employeeClaims = await Claim.countDocuments({ 'claimFor.type': 'employee' });
    const dependentClaims = await Claim.countDocuments({ 'claimFor.type': 'dependent' });
    
    console.log('\nFinal claim distribution:');
    console.log(`Total claims: ${totalClaims}`);
    console.log(`Employee claims: ${employeeClaims}`);
    console.log(`Dependent claims: ${dependentClaims}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updateClaimsForDependents(); 