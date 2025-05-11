import pandas as pd
import numpy as np
import uuid
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Load data
df_employees = pd.read_csv("data/FinalDataSet_2024.csv")
df_claims = pd.read_csv("data/Synthetic_Claims_2024.csv")

# Prepare data
# Convert ClaimDate to datetime, handling various formats
df_claims['ClaimDate'] = pd.to_datetime(df_claims['ClaimDate'], errors='coerce')
df_claims['Year'] = df_claims['ClaimDate'].dt.year
df_claims['Month'] = df_claims['ClaimDate'].dt.month

# Create group column for employees
df_employees['Has_Chronic_Disease'] = df_employees['Chronic_Disease'] != 'None'
df_employees['Group'] = (df_employees['Age_Group'] + '_' + 
                         df_employees['Gender'] + '_' + 
                         df_employees['Has_Chronic_Disease'].astype(str))

# Merge claims with employee data
df_merged = df_claims.merge(df_employees[['Patient_ID', 'Group', 'Age']], 
                           left_on='EmployeePatientID', 
                           right_on='Patient_ID', 
                           how='left')

# Calculate average claims per group (using 2022-2023 to avoid 2024 data leakage)
df_historical = df_merged[df_merged['Year'].isin([2022, 2023])]
claims_per_employee = df_historical.groupby(['Group', 'EmployeePatientID', 'Year'])\
    .size().reset_index(name='ClaimCount')
avg_claims_per_group = claims_per_employee.groupby('Group')['ClaimCount']\
    .mean().to_dict()

# Overall average for groups with no data
overall_avg_claims = claims_per_employee['ClaimCount'].mean() if not claims_per_employee.empty else 1.5

# Get distributions
# Monthly distribution
monthly_dist = df_claims['Month'].value_counts(normalize=True).to_dict()

# Categorical distributions
categorical_fields = ['ProviderID', 'ClaimStatus', 'ClaimType', 'ClaimSubmissionMethod']
categorical_dists = {}
for field in categorical_fields:
    categorical_dists[field] = df_claims[field].value_counts(normalize=True).to_dict()

# ClaimAmount distribution
df_claims['ClaimAmountNumeric'] = df_claims['ClaimAmount'].str.replace('[\$,]', '', regex=True).astype(float)
claim_amounts = df_claims['ClaimAmountNumeric'].dropna().values

# Group-specific diagnosis and procedure distributions
group_diagnosis_dists = df_merged.groupby('Group')['DiagnosisDescription']\
    .value_counts(normalize=True).unstack().fillna(0).to_dict()
group_procedure_dists = df_merged.groupby('Group')['ProcedureDescription']\
    .value_counts(normalize=True).unstack().fillna(0).to_dict()
group_specialty_dists = df_merged.groupby('Group')['ProviderSpecialty']\
    .value_counts(normalize=True).unstack().fillna(0).to_dict()

# Overall diagnosis, procedure, specialty distributions for fallback
overall_diagnosis_dist = df_claims['DiagnosisDescription'].value_counts(normalize=True).to_dict()
overall_procedure_dist = df_claims['ProcedureDescription'].value_counts(normalize=True).to_dict()
overall_specialty_dist = df_claims['ProviderSpecialty'].value_counts(normalize=True).to_dict()

# Employee info for PatientIncome, PatientMaritalStatus, PatientEmploymentStatus
employee_info = df_merged.groupby('EmployeePatientID').agg({
    'PatientIncome': 'last',
    'PatientMaritalStatus': 'last',
    'PatientEmploymentStatus': 'last'
}).to_dict('index')

# Overall distributions for employees without historical claims
overall_income_dist = df_claims['PatientIncome'].value_counts(normalize=True).to_dict()
overall_marital_dist = df_claims['PatientMaritalStatus'].value_counts(normalize=True).to_dict()
overall_employment_dist = df_claims['PatientEmploymentStatus'].value_counts(normalize=True).to_dict()

# Function to sample from dictionary distribution
def sample_from_dist(dist_dict):
    items, probs = zip(*dist_dict.items())
    return np.random.choice(items, p=probs)

# Generate synthetic claims
synthetic_claims = []
for _, employee in df_employees.iterrows():
    emp_id = employee['Patient_ID']
    group = employee['Group']
    age = employee['Age']
    
    # Get average claims for group
    avg_claims = avg_claims_per_group.get(group, overall_avg_claims)
    
    # Sample number of claims (Poisson distribution)
    num_claims = np.random.poisson(avg_claims)
    
    for _ in range(num_claims):
        claim = {}
        claim['ClaimID'] = str(uuid.uuid4())
        claim['EmployeePatientID'] = emp_id
        claim['ProviderID'] = sample_from_dist(categorical_dists['ProviderID'])
        
        # Sample ClaimAmount and format as string
        amount = np.random.choice(claim_amounts)
        claim['ClaimAmount'] = f"${amount:,.2f}"
        
        # Generate ClaimDate in 2024
        month = int(sample_from_dist(monthly_dist))
        day = random.randint(1, 28)  # Simplified to avoid month-end issues
        claim['ClaimDate'] = datetime(2024, month, day)
        
        # Set PatientAge (age in 2024)
        claim['PatientAge'] = age - 1
        
        # Sample ProviderSpecialty, DiagnosisDescription, ProcedureDescription
        claim['ProviderSpecialty'] = sample_from_dist(
            group_specialty_dists.get(group, overall_specialty_dist))
        claim['DiagnosisDescription'] = sample_from_dist(
            group_diagnosis_dists.get(group, overall_diagnosis_dist))
        claim['ProcedureDescription'] = sample_from_dist(
            group_procedure_dists.get(group, overall_procedure_dist))
        
        # Set PatientIncome, PatientMaritalStatus, PatientEmploymentStatus
        emp_info = employee_info.get(emp_id, {})
        claim['PatientIncome'] = emp_info.get('PatientIncome', 
                                             sample_from_dist(overall_income_dist))
        claim['PatientMaritalStatus'] = emp_info.get('PatientMaritalStatus', 
                                                    sample_from_dist(overall_marital_dist))
        claim['PatientEmploymentStatus'] = emp_info.get('PatientEmploymentStatus', 
                                                       sample_from_dist(overall_employment_dist))
        
        # Sample other fields
        claim['ClaimStatus'] = sample_from_dist(categorical_dists['ClaimStatus'])
        claim['ClaimType'] = sample_from_dist(categorical_dists['ClaimType'])
        claim['ClaimSubmissionMethod'] = sample_from_dist(categorical_dists['ClaimSubmissionMethod'])
        
        synthetic_claims.append(claim)

# Convert to DataFrame
df_synthetic = pd.DataFrame(synthetic_claims)

# Ensure all original columns are present
original_columns = ['ClaimID', 'EmployeePatientID', 'ProviderID', 'ClaimAmount', 
                    'ClaimDate', 'PatientAge', 'ProviderSpecialty', 'ClaimStatus', 
                    'PatientIncome', 'PatientMaritalStatus', 'PatientEmploymentStatus', 
                    'ClaimType', 'ClaimSubmissionMethod', 'DiagnosisDescription', 
                    'ProcedureDescription']
df_synthetic = df_synthetic[original_columns]

# Save to CSV
df_synthetic.to_csv('Synthetic_Claims_2023.csv', index=False)

print("Synthetic claims for 2024 generated and saved to 'Synthetic_Claims_2024.csv'")