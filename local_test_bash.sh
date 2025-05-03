#!/bin/bash

# --- Configuration ---
BASE_URL="http://localhost:8080/api/v1" # Adjust if your backend runs elsewhere
TIMESTAMP=$(date +%s)
REQ_USERNAME="testreq_rating_auto_${TIMESTAMP}" # Unique username
REQ_PASSWORD="password"
REQ_EMAIL="${REQ_USERNAME}@example.com" # Unique email
REQ_PHONE="079${TIMESTAMP: -7}" # Generate a unique-ish phone number
REQ_FIRSTNAME="TestReq"
REQ_LASTNAME="AutoRating"
REQ_BIRTHDATE="1990-01-15" # Example birth date

DRV_USERNAME="testdrv_rating_auto_${TIMESTAMP}" # Unique username
DRV_PASSWORD="password"
DRV_EMAIL="${DRV_USERNAME}@example.com" # Unique email
DRV_PHONE="078${TIMESTAMP: -7}" # Generate a different unique-ish phone number
DRV_FIRSTNAME="TestDrv"
DRV_LASTNAME="AutoRating"
DRV_BIRTHDATE="1988-05-20" # Example birth date
DRV_LICENSE_PLATE="ZH-AUTO-${TIMESTAMP: -6}" # Make license plate unique
DRV_PREFERRED_RANGE=100.0 # Example preferred range

# Driver Car Details
DRV_CAR_MODEL="Test Auto Car"
DRV_CAR_VOLUME=2.5 # Example volume capacity (m^3)
DRV_CAR_WEIGHT=500.0 # Example weight capacity (kg)
DRV_CAR_ELECTRIC=false
DRV_CAR_PIC_PATH="" # Optional path

# Driver Location Details
DRV_LOC_LAT=47.3769 # Example latitude (Zurich HB)
DRV_LOC_LON=8.5417 # Example longitude (Zurich HB)
DRV_LOC_ADDR="Zurich HB Auto Driver Location"

# Optional Paths (set to empty string if not needed for basic registration)
PROFILE_PIC_PATH=""
DRIVER_LICENSE_PATH=""
DRIVER_INSURANCE_PATH=""


# Use a date clearly in the past to ensure /complete and /fulfill work
# Get yesterday's date in YYYY-MM-DD format
YESTERDAY=$(date -v -1d '+%Y-%m-%d' 2>/dev/null || date --date="yesterday" '+%Y-%m-%d')
PAST_DATE="${YESTERDAY}T10:00:00Z" # Set time to 10:00 AM UTC yesterday
PAST_DATE_ACCEPTED="${YESTERDAY}T11:00:00Z" # Slightly different time for uniqueness
PAST_DATE_REQUESTED="${YESTERDAY}T12:00:00Z" # Slightly different time for uniqueness

echo "--- Starting Multi-Contract Test Setup ---" >&2 # Print initial message to stderr
echo "Using past date: $PAST_DATE" >&2

# --- Helper function for making requests and checking errors ---
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local headers=()
    shift 3
    while [[ $# -gt 0 ]]; do
        headers+=("-H" "$1")
        shift
    done

    # Print request info to stderr
    echo "Request: $method $url" >&2
    if [[ -n "$data" ]]; then
        echo "Data: $data" >&2
    fi

    # Capture stderr as well to see curl errors, store response and http code together
    response_and_code=$(curl -s -w "\\n%{http_code}" -X "$method" "${headers[@]}" -H "Content-Type: application/json" ${data:+-d "$data"} "$url" 2>&1)
    curl_exit_code=$?

    # Check if curl itself reported an error (exit code != 0) AND if the output doesn't end with a 3-digit number (HTTP code)
    if [[ $curl_exit_code -ne 0 && ! "$response_and_code" =~ [0-9]{3}$ ]]; then
        echo "Error: curl command failed. Exit code: $curl_exit_code" >&2
        echo "Curl output: $response_and_code" >&2
        return 1 # Use return code for failure within function
    fi

    http_code=$(tail -n1 <<< "$response_and_code")
    body=$(sed '$ d' <<< "$response_and_code")

    # Check if http_code is a valid number (robustness check)
    if ! [[ "$http_code" =~ ^[0-9]+$ ]]; then
       echo "Error: Failed to get valid HTTP code from response." >&2
       echo "Raw response including potential errors: $response_and_code" >&2
       return 1 # Use return code for failure within function
    fi

    # Print response code to stderr
    echo "Response Code: $http_code" >&2

    if [[ $http_code -lt 200 || $http_code -ge 300 ]]; then
        echo "Error: Request failed with status code $http_code" >&2
        # Attempt to parse error message from JSON response, default to raw body if not JSON
        error_message=$(echo "$body" | jq -r '.message // .error // .' 2>/dev/null || echo "$body")
        echo "Error Details: $error_message" >&2
        return 1 # Use return code for failure within function
    fi

    # On success, print ONLY the body to stdout
    echo "$body"
    return 0 # Indicate success
}


# --- Main Script Logic ---

# Function to handle request failure
handle_failure() {
    local step_name=$1
    echo "Error during step: $step_name. Aborting script." >&2
    exit 1
}

# 1. Create Requester
echo "1. Creating Requester ($REQ_USERNAME)..." >&2
requester_payload=$(cat <<EOF
{
  "user": {
    "username": "$REQ_USERNAME",
    "password": "$REQ_PASSWORD",
    "email": "$REQ_EMAIL",
    "userAccountType": "REQUESTER",
    "firstName": "$REQ_FIRSTNAME",
    "lastName": "$REQ_LASTNAME",
    "phoneNumber": "$REQ_PHONE",
    "birthDate": "$REQ_BIRTHDATE",
    "profilePicturePath": "$PROFILE_PIC_PATH"
  }
}
EOF
)
make_request "POST" "$BASE_URL/auth/register" "$requester_payload" || handle_failure "Create Requester"

# 2. Create Driver
echo "2. Creating Driver ($DRV_USERNAME)..." >&2
driver_payload=$(cat <<EOF
{
  "user": {
    "username": "$DRV_USERNAME",
    "password": "$DRV_PASSWORD",
    "email": "$DRV_EMAIL",
    "userAccountType": "DRIVER",
    "firstName": "$DRV_FIRSTNAME",
    "lastName": "$DRV_LASTNAME",
    "phoneNumber": "$DRV_PHONE",
    "birthDate": "$DRV_BIRTHDATE",
    "profilePicturePath": "$PROFILE_PIC_PATH",
    "driverLicensePath": "$DRIVER_LICENSE_PATH",
    "driverInsurancePath": "$DRIVER_INSURANCE_PATH",
    "preferredRange": $DRV_PREFERRED_RANGE
  },
  "car": {
    "carModel": "$DRV_CAR_MODEL",
    "volumeCapacity": $DRV_CAR_VOLUME,
    "weightCapacity": $DRV_CAR_WEIGHT,
    "electric": $DRV_CAR_ELECTRIC,
    "licensePlate": "$DRV_LICENSE_PLATE",
    "carPicturePath": "$DRV_CAR_PIC_PATH"
  },
  "location": {
    "latitude": $DRV_LOC_LAT,
    "longitude": $DRV_LOC_LON,
    "formattedAddress": "$DRV_LOC_ADDR"
  }
}
EOF
)
make_request "POST" "$BASE_URL/auth/register" "$driver_payload" || handle_failure "Create Driver"

# 3. Login Requester & Get Credentials
echo "3. Logging in Requester..." >&2
login_req_response=$(make_request "POST" "$BASE_URL/auth/login" \
    "{\"username\": \"$REQ_USERNAME\", \"password\": \"$REQ_PASSWORD\"}") || handle_failure "Login Requester"

REQ_USER_ID=$(echo "$login_req_response" | jq -r '.userId')
REQ_TOKEN=$(echo "$login_req_response" | jq -r '.token')
if [[ -z "$REQ_USER_ID" || "$REQ_USER_ID" == "null" || -z "$REQ_TOKEN" || "$REQ_TOKEN" == "null" ]]; then
    echo "Error: Failed to parse Requester UserID or Token from login response." >&2
    echo "Raw response was: $login_req_response" >&2
    exit 1
fi
echo "   Requester UserID: $REQ_USER_ID" >&2
echo "   Requester Token: $REQ_TOKEN" >&2


# --- Scenario 1: Finalized Contract ---
echo "--- Scenario 1: Creating FINALIZED Contract ---" >&2

# 4. Create Contract (Proposal) in the Past (for Finalized)
echo "4. Creating Contract 1 (for Finalized)..." >&2
contract_response_finalized=$(make_request "POST" "$BASE_URL/contracts" \
    "{\"title\": \"Finalized Move ${TIMESTAMP}\", \"contractDescription\": \"Testing finalized flow\", \"moveDateTime\": \"2025-05-29T10:00:00Z\", \"fromLocation\": {\"latitude\": 47.3769, \"longitude\": 8.5417, \"formattedAddress\": \"Zurich HB Finalized From\"}, \"toLocation\": {\"latitude\": 47.3780, \"longitude\": 8.5400, \"formattedAddress\": \"Zurich Main Station Finalized To\"}, \"weight\": 5.0, \"height\": 1.0, \"width\": 1.0, \"length\": 1.0, \"fragile\": false, \"coolingRequired\": false, \"rideAlong\": false, \"manPower\": 1, \"price\": 30.0, \"requesterId\": $REQ_USER_ID}" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract 1 (Finalized)"

CONTRACT_ID_FINALIZED=$(echo "$contract_response_finalized" | jq -r '.contract.contractId // .contractId')
if [[ -z "$CONTRACT_ID_FINALIZED" || "$CONTRACT_ID_FINALIZED" == "null" ]]; then
    echo "Error: Failed to parse Contract ID 1 (Finalized)." >&2
    echo "Raw response was: $contract_response_finalized" >&2
    exit 1
fi
echo "   Contract ID (Finalized): $CONTRACT_ID_FINALIZED" >&2

# 5. Login Driver & Get Credentials (Only need to do this once)
echo "5. Logging in Driver..." >&2
login_drv_response=$(make_request "POST" "$BASE_URL/auth/login" \
    "{\"username\": \"$DRV_USERNAME\", \"password\": \"$DRV_PASSWORD\"}") || handle_failure "Login Driver"

DRV_USER_ID=$(echo "$login_drv_response" | jq -r '.userId')
DRV_TOKEN=$(echo "$login_drv_response" | jq -r '.token')
if [[ -z "$DRV_USER_ID" || "$DRV_USER_ID" == "null" || -z "$DRV_TOKEN" || "$DRV_TOKEN" == "null" ]]; then
    echo "Error: Failed to parse Driver UserID or Token from login response." >&2
    echo "Raw response was: $login_drv_response" >&2
    exit 1
fi
echo "   Driver UserID: $DRV_USER_ID" >&2
echo "   Driver Token: $DRV_TOKEN" >&2

# 6. Create Offer for Finalized Contract (Driver)
echo "6. Creating Offer for Finalized Contract..." >&2
offer_response_finalized=$(make_request "POST" "$BASE_URL/offers" \
    "{\"contractId\": $CONTRACT_ID_FINALIZED, \"driverId\": $DRV_USER_ID}" \
    "UserId: $DRV_USER_ID" "Authorization: $DRV_TOKEN") || handle_failure "Create Offer (Finalized)"

OFFER_ID_FINALIZED=$(echo "$offer_response_finalized" | jq -r '.offer.offerId // .offerId')
if [[ -z "$OFFER_ID_FINALIZED" || "$OFFER_ID_FINALIZED" == "null" ]]; then
    echo "Error: Failed to parse Offer ID (Finalized)." >&2
    echo "Raw response was: $offer_response_finalized" >&2
    exit 1
fi
echo "   Offer ID (Finalized): $OFFER_ID_FINALIZED" >&2

# 7. Accept Offer for Finalized Contract (Requester)
echo "7. Accepting Offer for Finalized Contract..." >&2
make_request "PUT" "$BASE_URL/offers/$OFFER_ID_FINALIZED/status?status=ACCEPTED" "" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Accept Offer (Finalized)"

# 8. Complete Finalized Contract (Requester) using the new manual endpoint
echo "8. Completing Finalized Contract..." >&2
make_request "PUT" "$BASE_URL/contracts/$CONTRACT_ID_FINALIZED/complete" "" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Complete Contract (Finalized)"

# 9. Finalize Contract (Requester) - UNCOMMENTED TO MAKE IT FINALIZED
echo "9. Finalizing Contract..." >&2
make_request "PUT" "$BASE_URL/contracts/$CONTRACT_ID_FINALIZED/fulfill" "" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Finalize Contract (Fulfill)"


# --- Scenario 2: Accepted Contract ---
echo "--- Scenario 2: Creating ACCEPTED Contract ---" >&2

# 10. Create Second Contract (for Accepted state)
echo "10. Creating Contract 2 (for Accepted)..." >&2
contract_response_accepted=$(make_request "POST" "$BASE_URL/contracts" \
    "{\"title\": \"Accepted Move ${TIMESTAMP}\", \"contractDescription\": \"Testing accepted flow\", \"moveDateTime\": \"2025-05-29T11:00:00Z\", \"fromLocation\": {\"latitude\": 47.4000, \"longitude\": 8.5000, \"formattedAddress\": \"Zurich Accepted From\"}, \"toLocation\": {\"latitude\": 47.4100, \"longitude\": 8.5100, \"formattedAddress\": \"Zurich Accepted To\"}, \"weight\": 10.0, \"height\": 1.0, \"width\": 1.0, \"length\": 2.0, \"fragile\": true, \"coolingRequired\": false, \"rideAlong\": true, \"manPower\": 2, \"price\": 50.0, \"requesterId\": $REQ_USER_ID}" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract 2 (Accepted)"

CONTRACT_ID_ACCEPTED=$(echo "$contract_response_accepted" | jq -r '.contract.contractId // .contractId')
if [[ -z "$CONTRACT_ID_ACCEPTED" || "$CONTRACT_ID_ACCEPTED" == "null" ]]; then
    echo "Error: Failed to parse Contract ID 2 (Accepted)." >&2
    echo "Raw response was: $contract_response_accepted" >&2
    exit 1
fi
echo "   Contract ID (Accepted): $CONTRACT_ID_ACCEPTED" >&2

# 11. Create Offer for Second Contract (Driver)
echo "11. Creating Offer for Accepted Contract..." >&2
offer_response_accepted=$(make_request "POST" "$BASE_URL/offers" \
    "{\"contractId\": $CONTRACT_ID_ACCEPTED, \"driverId\": $DRV_USER_ID}" \
    "UserId: $DRV_USER_ID" "Authorization: $DRV_TOKEN") || handle_failure "Create Offer (Accepted)"

OFFER_ID_ACCEPTED=$(echo "$offer_response_accepted" | jq -r '.offer.offerId // .offerId')
if [[ -z "$OFFER_ID_ACCEPTED" || "$OFFER_ID_ACCEPTED" == "null" ]]; then
    echo "Error: Failed to parse Offer ID (Accepted)." >&2
    echo "Raw response was: $offer_response_accepted" >&2
    exit 1
fi
echo "   Offer ID (Accepted): $OFFER_ID_ACCEPTED" >&2

# 12. Accept Offer for Second Contract (Requester)
echo "12. Accepting Offer for Accepted Contract..." >&2
make_request "PUT" "$BASE_URL/offers/$OFFER_ID_ACCEPTED/status?status=ACCEPTED" "" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Accept Offer (Accepted)"


# --- Scenario 3: Cancelled Requested Contract ---
echo "--- Scenario 3: Creating cancelled REQUESTED Contract ---" >&2

# 13. Create Third Contract (for Requested state)
echo "13. Creating Contract 3 (for Requested)..." >&2
contract_response_requested=$(make_request "POST" "$BASE_URL/contracts" \
    "{\"title\": \"Requested Move ${TIMESTAMP}\", \"contractDescription\": \"Testing requested flow\", \"moveDateTime\": \"$PAST_DATE_REQUESTED\", \"fromLocation\": {\"latitude\": 47.3500, \"longitude\": 8.5500, \"formattedAddress\": \"Zurich Requested From\"}, \"toLocation\": {\"latitude\": 47.3600, \"longitude\": 8.5600, \"formattedAddress\": \"Zurich Requested To\"}, \"weight\": 2.0, \"height\": 1.0, \"width\": 1.0, \"length\": 0.5, \"fragile\": false, \"coolingRequired\": true, \"rideAlong\": false, \"manPower\": 1, \"price\": 20.0, \"requesterId\": $REQ_USER_ID}" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract 3 (Requested)"

CONTRACT_ID_REQUESTED=$(echo "$contract_response_requested" | jq -r '.contract.contractId // .contractId')
if [[ -z "$CONTRACT_ID_REQUESTED" || "$CONTRACT_ID_REQUESTED" == "null" ]]; then
    echo "Error: Failed to parse Contract ID 3 (Requested)." >&2
    echo "Raw response was: $contract_response_requested" >&2
    exit 1
fi
echo "   Contract ID (Requested): $CONTRACT_ID_REQUESTED" >&2


# --- Scenario 4: Cancelled Offered Contract ---
echo "--- Scenario 4: Creating cancelled OFFERED Contract ---" >&2

# 14. Create Fourth Contract (for Offered state)
echo "14. Creating Contract 4 (for Offered)..." >&2
contract_response_offered=$(make_request "POST" "$BASE_URL/contracts" \
    "{\"title\": \"Offered Move ${TIMESTAMP}\", \"contractDescription\": \"Testing offered flow\", \"moveDateTime\": \"$PAST_DATE_REQUESTED\", \"fromLocation\": {\"latitude\": 47.3800, \"longitude\": 8.5800, \"formattedAddress\": \"Zurich Offered From\"}, \"toLocation\": {\"latitude\": 47.3900, \"longitude\": 8.5900, \"formattedAddress\": \"Zurich Offered To\"}, \"weight\": 15.0, \"height\": 1.0, \"width\": 1.0, \"length\": 3.0, \"fragile\": false, \"coolingRequired\": false, \"rideAlong\": false, \"manPower\": 3, \"price\": 70.0, \"requesterId\": $REQ_USER_ID}" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract 4 (Offered)"

CONTRACT_ID_OFFERED=$(echo "$contract_response_offered" | jq -r '.contract.contractId // .contractId')
if [[ -z "$CONTRACT_ID_OFFERED" || "$CONTRACT_ID_OFFERED" == "null" ]]; then
    echo "Error: Failed to parse Contract ID 4 (Offered)." >&2
    echo "Raw response was: $contract_response_offered" >&2
    exit 1
fi
echo "   Contract ID (Offered): $CONTRACT_ID_OFFERED" >&2

# 15. Create Offer for Fourth Contract (Driver)
echo "15. Creating Offer for Offered Contract..." >&2
offer_response_offered=$(make_request "POST" "$BASE_URL/offers" \
    "{\"contractId\": $CONTRACT_ID_OFFERED, \"driverId\": $DRV_USER_ID}" \
    "UserId: $DRV_USER_ID" "Authorization: $DRV_TOKEN") || handle_failure "Create Offer (Offered)"

OFFER_ID_OFFERED=$(echo "$offer_response_offered" | jq -r '.offer.offerId // .offerId')
if [[ -z "$OFFER_ID_OFFERED" || "$OFFER_ID_OFFERED" == "null" ]]; then
    echo "Error: Failed to parse Offer ID (Offered)." >&2
    echo "Raw response was: $offer_response_offered" >&2
    exit 1
fi
echo "   Offer ID (Offered): $OFFER_ID_OFFERED" >&2
# Note: We stop here for the OFFERED state. The requester does not accept this offer.

# --- Scenario 5: Requested Contract ---
echo "--- Scenario 5: Creating REQUESTED Contract ---" >&2

# 15. Create Fifth Contract (for Requested state)
echo "15. Creating Contract 5 (for Requested)..." >&2
contract_response_requested=$(make_request "POST" "$BASE_URL/contracts" \
    "{\"title\": \"Requested Move ${TIMESTAMP}\", \"contractDescription\": \"Testing requested flow\", \"moveDateTime\": \"2025-05-29T12:00:00Z\", \"fromLocation\": {\"latitude\": 47.3500, \"longitude\": 8.5500, \"formattedAddress\": \"Zurich Requested From\"}, \"toLocation\": {\"latitude\": 47.3600, \"longitude\": 8.5600, \"formattedAddress\": \"Zurich Requested To\"}, \"weight\": 2.0, \"height\": 1.0, \"width\": 1.0, \"length\": 0.5, \"fragile\": false, \"coolingRequired\": true, \"rideAlong\": false, \"manPower\": 1, \"price\": 20.0, \"requesterId\": $REQ_USER_ID}" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract 5 (Requested)"

CONTRACT_ID_REQUESTED=$(echo "$contract_response_requested" | jq -r '.contract.contractId // .contractId')
if [[ -z "$CONTRACT_ID_REQUESTED" || "$CONTRACT_ID_REQUESTED" == "null" ]]; then
    echo "Error: Failed to parse Contract ID 5 (Requested)." >&2
    echo "Raw response was: $contract_response_requested" >&2
    exit 1
fi
echo "   Contract ID (Requested): $CONTRACT_ID_REQUESTED" >&2


# --- Scenario 6: Offered Contract ---
echo "--- Scenario 6: Creating OFFERED Contract ---" >&2

# 16. Create Sixth Contract (for Offered state)
echo "16. Creating Contract 6 (for Offered)..." >&2
contract_response_offered=$(make_request "POST" "$BASE_URL/contracts" \
    "{\"title\": \"Offered Move ${TIMESTAMP}\", \"contractDescription\": \"Testing offered flow\", \"moveDateTime\": \"2025-05-29T13:00:00Z\", \"fromLocation\": {\"latitude\": 47.3800, \"longitude\": 8.5800, \"formattedAddress\": \"Zurich Offered From\"}, \"toLocation\": {\"latitude\": 47.3900, \"longitude\": 8.5900, \"formattedAddress\": \"Zurich Offered To\"}, \"weight\": 15.0, \"height\": 1.0, \"width\": 1.0, \"length\": 3.0, \"fragile\": false, \"coolingRequired\": false, \"rideAlong\": false, \"manPower\": 3, \"price\": 70.0, \"requesterId\": $REQ_USER_ID}" \
    "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract 6 (Offered)"

CONTRACT_ID_OFFERED=$(echo "$contract_response_offered" | jq -r '.contract.contractId // .contractId')
if [[ -z "$CONTRACT_ID_OFFERED" || "$CONTRACT_ID_OFFERED" == "null" ]]; then
    echo "Error: Failed to parse Contract ID 6 (Offered)." >&2
    echo "Raw response was: $contract_response_offered" >&2
    exit 1
fi
echo "   Contract ID (Offered): $CONTRACT_ID_OFFERED" >&2

# 17. Create Offer for Sixth Contract (Driver)
echo "17. Creating Offer for Offered Contract..." >&2
offer_response_offered=$(make_request "POST" "$BASE_URL/offers" \
    "{\"contractId\": $CONTRACT_ID_OFFERED, \"driverId\": $DRV_USER_ID}" \
    "UserId: $DRV_USER_ID" "Authorization: $DRV_TOKEN") || handle_failure "Create Offer (Offered)"

OFFER_ID_OFFERED=$(echo "$offer_response_offered" | jq -r '.offer.offerId // .offerId')
if [[ -z "$OFFER_ID_OFFERED" || "$OFFER_ID_OFFERED" == "null" ]]; then
    echo "Error: Failed to parse Offer ID (Offered)." >&2
    echo "Raw response was: $offer_response_offered" >&2
    exit 1
fi
echo "   Offer ID (Offered): $OFFER_ID_OFFERED" >&2
# Note: We stop here for the OFFERED state. The requester does not accept this offer.


# --- Final Summary ---
echo "--- Multi-Contract Test Setup Complete ---" >&2
echo "Requester: $REQ_USERNAME / $REQ_PASSWORD (UserID: $REQ_USER_ID, Phone: $REQ_PHONE)" >&2
echo "Driver: $DRV_USERNAME / $DRV_PASSWORD (UserID: $DRV_USER_ID, Phone: $DRV_PHONE)" >&2
echo "" >&2
echo "Contract 1 (Finalized): ID $CONTRACT_ID_FINALIZED (Completed and Finalized by Requester $REQ_USERNAME)" >&2
echo "Contract 2 (Accepted): ID $CONTRACT_ID_ACCEPTED (Accepted by Requester, ready for completion)" >&2
echo "Contract 3 (Requested, but cancelled): ID $CONTRACT_ID_REQUESTED (Created by Requester, no offers yet)" >&2
echo "Contract 4 (Offered, but cancelled): ID $CONTRACT_ID_OFFERED (Offer $OFFER_ID_OFFERED made by Driver, pending Requester acceptance)" >&2
echo "Contract 5 (Requested): ID $CONTRACT_ID_REQUESTED (Created by Requester, no offers yet)" >&2
echo "Contract 6 (Offered): ID $CONTRACT_ID_OFFERED (Offer $OFFER_ID_OFFERED made by Driver, pending Requester acceptance)" >&2

