#!/bin/bash

# API URL
API_URL="https://public-fede7a.vercel.app"

# Function to test API endpoints
test_endpoint() {
  local endpoint=$1
  local method=$2
  local data=$3
  local token=$4
  
  echo "Testing $method $endpoint"
  
  if [ -z "$token" ]; then
    # No token provided, make a request without authentication
    if [ -z "$data" ]; then
      # No data provided, make a GET request
      response=$(curl -s -X $method "$API_URL$endpoint")
    else
      # Data provided, make a request with data
      response=$(curl -s -X $method -H "Content-Type: application/json" -d "$data" "$API_URL$endpoint")
    fi
  else
    # Token provided, make an authenticated request
    if [ -z "$data" ]; then
      # No data provided, make a GET request
      response=$(curl -s -X $method -H "Authorization: Bearer $token" "$API_URL$endpoint")
    else
      # Data provided, make a request with data
      response=$(curl -s -X $method -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$data" "$API_URL$endpoint")
    fi
  fi
  
  echo "Response: $response"
  echo ""
  
  # Return the response for further processing
  echo "$response"
}

# 1. Test health endpoint
test_endpoint "/health" "GET"

# 2. Login as admin
admin_login_data='{"email": "admin@medbond.com", "password": "adminPass2025"}'
admin_login_response=$(test_endpoint "/api/auth/login" "POST" "$admin_login_data")

# Extract token and employee ID from login response
admin_token=$(echo $admin_login_response | grep -o '"token":"[^"]*' | sed 's/"token":"//')
admin_id=$(echo $admin_login_response | grep -o '"id":"[^"]*' | sed 's/"id":"//')
admin_id_mongodb=$(echo $admin_login_response | grep -o '"_id":"[^"]*' | sed 's/"_id":"//')

echo "Admin Token: $admin_token"
echo "Admin ID (UUID): $admin_id"
echo "Admin ID (MongoDB): $admin_id_mongodb"

# 3. Test getting profile
test_endpoint "/api/auth/profile" "GET" "" "$admin_token"

# 4. Test getting all data (admin only)
test_endpoint "/api/all-data" "GET" "" "$admin_token"

# 5. Login as employee
employee_login_data='{"email": "employee8f7b7927@example.com", "password": "password123"}'
employee_login_response=$(test_endpoint "/api/auth/login" "POST" "$employee_login_data")

# Extract token and employee ID from login response
employee_token=$(echo $employee_login_response | grep -o '"token":"[^"]*' | sed 's/"token":"//')
employee_id=$(echo $employee_login_response | grep -o '"id":"[^"]*' | sed 's/"id":"//')
employee_id_mongodb=$(echo $employee_login_response | grep -o '"_id":"[^"]*' | sed 's/"_id":"//')

echo "Employee Token: $employee_token"
echo "Employee ID (UUID): $employee_id"
echo "Employee ID (MongoDB): $employee_id_mongodb"

# 6. Test getting employee profile
test_endpoint "/api/auth/profile" "GET" "" "$employee_token"

# 7. Test getting employee by ID
test_endpoint "/api/employees/$employee_id" "GET" "" "$admin_token"

# Script completed
echo "Testing complete!" 