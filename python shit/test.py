import pandas as pd

def reassign_employee_ids(claims_csv_path, employees_csv_path, output_csv_path):
    # Read the CSVs
    claims_df = pd.read_csv(claims_csv_path)
    employees_df = pd.read_csv(employees_csv_path)

    # Step 1: Identify groups of claims based on consecutive EmployeePatientID
    groups = []
    current_group = [claims_df.iloc[0]['EmployeePatientID']]
    for i in range(1, len(claims_df)):
        current_id = claims_df.iloc[i]['EmployeePatientID']
        prev_id = claims_df.iloc[i-1]['EmployeePatientID']
        if current_id == prev_id:
            current_group.append(current_id)
        else:
            groups.append(current_group)
            current_group = [current_id]
    groups.append(current_group)  # Append the last group

    # Step 2: Get the list of Patient_IDs from employees CSV in order
    employee_ids = employees_df['Patient_ID'].tolist()

    # Step 3: Ensure there are enough employee IDs for the number of groups
    if len(groups) > len(employee_ids):
        raise ValueError(f"Number of claim groups ({len(groups)}) exceeds number of employees ({len(employee_ids)}).")

    # Step 4: Create a mapping from old EmployeePatientID to new Patient_ID
    id_mapping = {}
    for group, new_id in zip(groups, employee_ids):
        old_id = group[0]  # All IDs in the group are the same
        id_mapping[old_id] = new_id

    # Step 5: Update EmployeePatientID in claims dataframe
    claims_df['EmployeePatientID'] = claims_df['EmployeePatientID'].map(id_mapping)

    # Step 6: Save the updated claims CSV
    claims_df.to_csv(output_csv_path, index=False)
    print(f"Updated claims CSV saved to {output_csv_path}")

# Example usage
claims_csv_path = '/Volumes/MySSD/GP Code/public-fede7a/data/Claims-Updated.csv'  # Replace with your claims CSV file path
employees_csv_path = '/Volumes/MySSD/GP Code/public-fede7a/data/FinalDataSet.csv'  # Replace with your employees CSV file path
output_csv_path = '/Volumes/MySSD/GP Code/public-fede7a/data/Claims-Updated copy.csv'  # Output file path

reassign_employee_ids(claims_csv_path, employees_csv_path, output_csv_path)