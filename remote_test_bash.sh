#!/bin/bash

# --- Configuration ---
BASE_URL="https://sopra-fs25-group-39-server.oa.r.appspot.com/api/v1" # Adjust if your backend runs elsewhere
TIMESTAMP=$(date +%s)
REQ_USERNAME="TestCustomer" # Unique username
REQ_PASSWORD="password"
REQ_EMAIL="${REQ_USERNAME}@example.com" # Unique email
REQ_PHONE="079${TIMESTAMP: -7}" # Generate a unique-ish phone number
REQ_FIRSTNAME="TestReq"
REQ_LASTNAME="AutoRating"
REQ_BIRTHDATE="1990-01-15" # Example birth date

DRV_USERNAME="TestDriver" # Unique username
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

FUTURE_DATE_PART="2025-05-29" # Future date for contracts not yet completed/finalized

echo "--- Starting Multi-Contract Test Setup ---" >&2 # Print initial message to stderr
echo "Using YESTERDAY for past contracts: $YESTERDAY" >&2
echo "Using FUTURE_DATE_PART for future contracts: $FUTURE_DATE_PART" >&2

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


# --- Initialize arrays to store contract and offer IDs ---
declare -a CONTRACT_IDS_REQUESTED
declare -a CONTRACT_IDS_OFFERED
declare -a OFFER_IDS_OFFERED
declare -a CONTRACT_IDS_ACCEPTED
declare -a OFFER_IDS_ACCEPTED
declare -a CONTRACT_IDS_COMPLETED
declare -a OFFER_IDS_COMPLETED
declare -a CONTRACT_IDS_FINALIZED
declare -a OFFER_IDS_FINALIZED

# --- Create 5 REQUESTED Contracts ---
echo "--- Creating 5 REQUESTED Contracts ---" >&2
for i in {1..5}
do
    echo "Creating REQUESTED Contract $i/5..." >&2
    MOVE_DATETIME_CURRENT="${FUTURE_DATE_PART}T$(printf "%02d" $((9 + i))):00:00Z" # e.g., 10:00, 11:00 ... 14:00
    WEIGHT_CURRENT=$(echo "scale=1; 2.0 + $i" | bc)
    PRICE_CURRENT=$(echo "scale=2; 20.0 + $i * 2" | bc)

    contract_payload_requested=$(cat <<EOF
{
  "title": "Requested Move ${TIMESTAMP} Iteration $i",
  "contractDescription": "Testing requested flow - Iteration $i",
  "moveDateTime": "$MOVE_DATETIME_CURRENT",
  "fromLocation": {"latitude": 47.3500, "longitude": 8.5500, "formattedAddress": "Zurich Requested From Iteration $i"},
  "toLocation": {"latitude": 47.3600, "longitude": 8.5600, "formattedAddress": "Zurich Requested To Iteration $i"},
  "weight": $WEIGHT_CURRENT, "height": 1.0, "width": 1.0, "length": 0.5,
  "fragile": false, "coolingRequired": true, "rideAlong": false,
  "manPower": 1, "price": $PRICE_CURRENT, "requesterId": $REQ_USER_ID
}
EOF
)
    contract_response_req=$(make_request "POST" "$BASE_URL/contracts" "$contract_payload_requested" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create REQUESTED Contract $i"

    CONTRACT_ID_REQ=$(echo "$contract_response_req" | jq -r '.contract.contractId // .contractId')
    if [[ -z "$CONTRACT_ID_REQ" || "$CONTRACT_ID_REQ" == "null" ]]; then
        handle_failure "Parse Contract ID REQUESTED $i. Response: $contract_response_req"
    fi
    CONTRACT_IDS_REQUESTED+=("$CONTRACT_ID_REQ")
    echo "   REQUESTED Contract $i ID: $CONTRACT_ID_REQ created." >&2
done

# --- Create 5 OFFERED Contracts ---
echo "--- Creating 5 OFFERED Contracts ---" >&2
for i in {1..5}
do
    echo "Creating OFFERED Contract $i/5..." >&2
    MOVE_DATETIME_CURRENT="${FUTURE_DATE_PART}T$(printf "%02d" $((9 + i))):05:00Z" # Offset minutes for uniqueness
    WEIGHT_CURRENT=$(echo "scale=1; 15.0 + $i" | bc)
    PRICE_CURRENT=$(echo "scale=2; 70.0 + $i * 2" | bc)

    contract_payload_offered=$(cat <<EOF
{
  "title": "Offered Move ${TIMESTAMP} Iteration $i",
  "contractDescription": "Testing offered flow - Iteration $i",
  "moveDateTime": "$MOVE_DATETIME_CURRENT",
  "fromLocation": {"latitude": 47.3800, "longitude": 8.5800, "formattedAddress": "Zurich Offered From Iteration $i"},
  "toLocation": {"latitude": 47.3900, "longitude": 8.5900, "formattedAddress": "Zurich Offered To Iteration $i"},
  "weight": $WEIGHT_CURRENT, "height": 1.0, "width": 1.0, "length": 3.0,
  "fragile": false, "coolingRequired": false, "rideAlong": false,
  "manPower": 3, "price": $PRICE_CURRENT, "requesterId": $REQ_USER_ID
}
EOF
)
    contract_response_off=$(make_request "POST" "$BASE_URL/contracts" "$contract_payload_offered" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract for OFFERED $i"

    CONTRACT_ID_OFF=$(echo "$contract_response_off" | jq -r '.contract.contractId // .contractId')
    if [[ -z "$CONTRACT_ID_OFF" || "$CONTRACT_ID_OFF" == "null" ]]; then
        handle_failure "Parse Contract ID for OFFERED $i. Response: $contract_response_off"
    fi
    CONTRACT_IDS_OFFERED+=("$CONTRACT_ID_OFF")
    echo "   Contract for OFFERED $i ID: $CONTRACT_ID_OFF created." >&2

    echo "   Creating Offer for OFFERED Contract $i..." >&2
    offer_response_off=$(make_request "POST" "$BASE_URL/offers" \
        "{\"contractId\": $CONTRACT_ID_OFF, \"driverId\": $DRV_USER_ID}" \
        "UserId: $DRV_USER_ID" "Authorization: $DRV_TOKEN") || handle_failure "Create Offer for OFFERED Contract $i"

    OFFER_ID_OFF=$(echo "$offer_response_off" | jq -r '.offer.offerId // .offerId')
    if [[ -z "$OFFER_ID_OFF" || "$OFFER_ID_OFF" == "null" ]]; then
        handle_failure "Parse Offer ID for OFFERED Contract $i. Response: $offer_response_off"
    fi
    OFFER_IDS_OFFERED+=("$OFFER_ID_OFF")
    echo "   OFFERED Contract $i (Contract ID: $CONTRACT_ID_OFF, Offer ID: $OFFER_ID_OFF) setup complete." >&2
done

# --- Create 5 ACCEPTED Contracts ---
echo "--- Creating 5 ACCEPTED Contracts ---" >&2
for i in {1..5}
do
    echo "Creating ACCEPTED Contract $i/5..." >&2
    MOVE_DATETIME_CURRENT="${FUTURE_DATE_PART}T$(printf "%02d" $((9 + i))):10:00Z"
    WEIGHT_CURRENT=$(echo "scale=1; 10.0 + $i" | bc)
    PRICE_CURRENT=$(echo "scale=2; 50.0 + $i * 2" | bc)

    contract_payload_accepted=$(cat <<EOF
{
  "title": "Accepted Move ${TIMESTAMP} Iteration $i",
  "contractDescription": "Testing accepted flow - Iteration $i",
  "moveDateTime": "$MOVE_DATETIME_CURRENT",
  "fromLocation": {"latitude": 47.4000, "longitude": 8.5000, "formattedAddress": "Zurich Accepted From Iteration $i"},
  "toLocation": {"latitude": 47.4100, "longitude": 8.5100, "formattedAddress": "Zurich Accepted To Iteration $i"},
  "weight": $WEIGHT_CURRENT, "height": 1.0, "width": 1.0, "length": 2.0,
  "fragile": true, "coolingRequired": false, "rideAlong": true,
  "manPower": 2, "price": $PRICE_CURRENT, "requesterId": $REQ_USER_ID
}
EOF
)
    contract_response_acc=$(make_request "POST" "$BASE_URL/contracts" "$contract_payload_accepted" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract for ACCEPTED $i"

    CONTRACT_ID_ACC=$(echo "$contract_response_acc" | jq -r '.contract.contractId // .contractId')
    if [[ -z "$CONTRACT_ID_ACC" || "$CONTRACT_ID_ACC" == "null" ]]; then
        handle_failure "Parse Contract ID for ACCEPTED $i. Response: $contract_response_acc"
    fi
    CONTRACT_IDS_ACCEPTED+=("$CONTRACT_ID_ACC")
    echo "   Contract for ACCEPTED $i ID: $CONTRACT_ID_ACC created." >&2

    echo "   Creating Offer for ACCEPTED Contract $i..." >&2
    offer_response_acc=$(make_request "POST" "$BASE_URL/offers" \
        "{\"contractId\": $CONTRACT_ID_ACC, \"driverId\": $DRV_USER_ID}" \
        "UserId: $DRV_USER_ID" "Authorization: $DRV_TOKEN") || handle_failure "Create Offer for ACCEPTED Contract $i"

    OFFER_ID_ACC=$(echo "$offer_response_acc" | jq -r '.offer.offerId // .offerId')
    if [[ -z "$OFFER_ID_ACC" || "$OFFER_ID_ACC" == "null" ]]; then
        handle_failure "Parse Offer ID for ACCEPTED Contract $i. Response: $offer_response_acc"
    fi
    OFFER_IDS_ACCEPTED+=("$OFFER_ID_ACC")
    echo "   Offer for ACCEPTED Contract $i ID: $OFFER_ID_ACC created." >&2

    echo "   Accepting Offer for ACCEPTED Contract $i..." >&2
    make_request "PUT" "$BASE_URL/offers/$OFFER_ID_ACC/status?status=ACCEPTED" "" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Accept Offer for ACCEPTED Contract $i"
    echo "   ACCEPTED Contract $i (Contract ID: $CONTRACT_ID_ACC, Offer ID: $OFFER_ID_ACC) setup complete." >&2
done

# --- Create 5 COMPLETED Contracts ---
echo "--- Creating 5 COMPLETED Contracts ---" >&2
for i in {1..5}
do
    echo "Creating COMPLETED Contract $i/5..." >&2
    MOVE_DATETIME_CURRENT="${YESTERDAY}T$(printf "%02d" $((9 + i))):15:00Z" # Past date
    WEIGHT_CURRENT=$(echo "scale=1; 5.0 + $i" | bc)
    PRICE_CURRENT=$(echo "scale=2; 30.0 + $i * 2" | bc)

    contract_payload_completed=$(cat <<EOF
{
  "title": "Completed Move ${TIMESTAMP} Iteration $i",
  "contractDescription": "Testing completed flow - Iteration $i",
  "moveDateTime": "$MOVE_DATETIME_CURRENT",
  "fromLocation": {"latitude": 47.3769, "longitude": 8.5417, "formattedAddress": "Zurich Completed From Iteration $i"},
  "toLocation": {"latitude": 47.3780, "longitude": 8.5400, "formattedAddress": "Zurich Completed To Iteration $i"},
  "weight": $WEIGHT_CURRENT, "height": 1.0, "width": 1.0, "length": 1.0,
  "fragile": false, "coolingRequired": false, "rideAlong": false,
  "manPower": 1, "price": $PRICE_CURRENT, "requesterId": $REQ_USER_ID
}
EOF
)
    contract_response_comp=$(make_request "POST" "$BASE_URL/contracts" "$contract_payload_completed" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract for COMPLETED $i"

    CONTRACT_ID_COMP=$(echo "$contract_response_comp" | jq -r '.contract.contractId // .contractId')
    if [[ -z "$CONTRACT_ID_COMP" || "$CONTRACT_ID_COMP" == "null" ]]; then
        handle_failure "Parse Contract ID for COMPLETED $i. Response: $contract_response_comp"
    fi
    CONTRACT_IDS_COMPLETED+=("$CONTRACT_ID_COMP")
    echo "   Contract for COMPLETED $i ID: $CONTRACT_ID_COMP created." >&2

    echo "   Creating Offer for COMPLETED Contract $i..." >&2
    offer_response_comp=$(make_request "POST" "$BASE_URL/offers" \
        "{\"contractId\": $CONTRACT_ID_COMP, \"driverId\": $DRV_USER_ID}" \
        "UserId: $DRV_USER_ID" "Authorization: $DRV_TOKEN") || handle_failure "Create Offer for COMPLETED Contract $i"

    OFFER_ID_COMP=$(echo "$offer_response_comp" | jq -r '.offer.offerId // .offerId')
    if [[ -z "$OFFER_ID_COMP" || "$OFFER_ID_COMP" == "null" ]]; then
        handle_failure "Parse Offer ID for COMPLETED Contract $i. Response: $offer_response_comp"
    fi
    OFFER_IDS_COMPLETED+=("$OFFER_ID_COMP") # Store if needed for summary, though not strictly necessary for just completed status
    echo "   Offer for COMPLETED Contract $i ID: $OFFER_ID_COMP created." >&2

    echo "   Accepting Offer for COMPLETED Contract $i..." >&2
    make_request "PUT" "$BASE_URL/offers/$OFFER_ID_COMP/status?status=ACCEPTED" "" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Accept Offer for COMPLETED Contract $i"

    echo "   Completing Contract $i..." >&2
    make_request "PUT" "$BASE_URL/contracts/$CONTRACT_ID_COMP/complete" "" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Complete Contract $i"
    echo "   COMPLETED Contract $i (Contract ID: $CONTRACT_ID_COMP) setup complete." >&2
done

# --- Create 5 FINALIZED Contracts ---
echo "--- Creating 5 FINALIZED Contracts ---" >&2
for i in {1..5}
do
    echo "Creating FINALIZED Contract $i/5..." >&2
    MOVE_DATETIME_CURRENT="${YESTERDAY}T$(printf "%02d" $((9 + i))):20:00Z" # Past date, different time
    WEIGHT_CURRENT=$(echo "scale=1; 5.0 + $i" | bc)
    PRICE_CURRENT=$(echo "scale=2; 30.0 + $i * 2" | bc)

    contract_payload_finalized=$(cat <<EOF
{
  "title": "Finalized Move ${TIMESTAMP} Iteration $i",
  "contractDescription": "Testing finalized flow - Iteration $i",
  "moveDateTime": "$MOVE_DATETIME_CURRENT",
  "fromLocation": {"latitude": 47.3769, "longitude": 8.5417, "formattedAddress": "Zurich Finalized From Iteration $i"},
  "toLocation": {"latitude": 47.3780, "longitude": 8.5400, "formattedAddress": "Zurich Finalized To Iteration $i"},
  "weight": $WEIGHT_CURRENT, "height": 1.0, "width": 1.0, "length": 1.0,
  "fragile": false, "coolingRequired": false, "rideAlong": false,
  "manPower": 1, "price": $PRICE_CURRENT, "requesterId": $REQ_USER_ID
}
EOF
)
    contract_response_fin=$(make_request "POST" "$BASE_URL/contracts" "$contract_payload_finalized" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN") || handle_failure "Create Contract for FINALIZED $i"

    CONTRACT_ID_FIN=$(echo "$contract_response_fin" | jq -r '.contract.contractId // .contractId')
    if [[ -z "$CONTRACT_ID_FIN" || "$CONTRACT_ID_FIN" == "null" ]]; then
        handle_failure "Parse Contract ID for FINALIZED $i. Response: $contract_response_fin"
    fi
    CONTRACT_IDS_FINALIZED+=("$CONTRACT_ID_FIN")
    echo "   Contract for FINALIZED $i ID: $CONTRACT_ID_FIN created." >&2

    echo "   Creating Offer for FINALIZED Contract $i..." >&2
    offer_response_fin=$(make_request "POST" "$BASE_URL/offers" \
        "{\"contractId\": $CONTRACT_ID_FIN, \"driverId\": $DRV_USER_ID}" \
        "UserId: $DRV_USER_ID" "Authorization: $DRV_TOKEN") || handle_failure "Create Offer for FINALIZED Contract $i"

    OFFER_ID_FIN=$(echo "$offer_response_fin" | jq -r '.offer.offerId // .offerId')
    if [[ -z "$OFFER_ID_FIN" || "$OFFER_ID_FIN" == "null" ]]; then
        handle_failure "Parse Offer ID for FINALIZED Contract $i. Response: $offer_response_fin"
    fi
    OFFER_IDS_FINALIZED+=("$OFFER_ID_FIN") # Store if needed for summary
    echo "   Offer for FINALIZED Contract $i ID: $OFFER_ID_FIN created." >&2

    echo "   Accepting Offer for FINALIZED Contract $i..." >&2
    make_request "PUT" "$BASE_URL/offers/$OFFER_ID_FIN/status?status=ACCEPTED" "" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Accept Offer for FINALIZED Contract $i"

    echo "   Completing FINALIZED Contract $i..." >&2
    make_request "PUT" "$BASE_URL/contracts/$CONTRACT_ID_FIN/complete" "" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Complete Contract for FINALIZED $i"

    echo "   Finalizing Contract $i..." >&2
    make_request "PUT" "$BASE_URL/contracts/$CONTRACT_ID_FIN/fulfill" "" \
        "UserId: $REQ_USER_ID" "Authorization: $REQ_TOKEN" || handle_failure "Finalize Contract (Fulfill) $i"
    echo "   FINALIZED Contract $i (Contract ID: $CONTRACT_ID_FIN) setup complete." >&2
done


# --- Final Summary ---
echo "--- Multi-Contract Test Setup Complete ---" >&2
echo "Requester: $REQ_USERNAME / $REQ_PASSWORD (UserID: $REQ_USER_ID, Phone: $REQ_PHONE)" >&2
echo "Driver: $DRV_USERNAME / $DRV_PASSWORD (UserID: $DRV_USER_ID, Phone: $DRV_PHONE)" >&2
echo "" >&2

echo "--- Summary of Created Contracts (5 of each type) ---" >&2
echo "" >&2

echo "REQUESTED Contracts (Total: ${#CONTRACT_IDS_REQUESTED[@]}):" >&2
for id in "${CONTRACT_IDS_REQUESTED[@]}"; do echo "  ID: $id" >&2; done
echo "" >&2

echo "OFFERED Contracts (Total: ${#CONTRACT_IDS_OFFERED[@]}):" >&2
for idx in "${!CONTRACT_IDS_OFFERED[@]}"; do
  echo "  Contract ID: ${CONTRACT_IDS_OFFERED[$idx]}, Offer ID: ${OFFER_IDS_OFFERED[$idx]}" >&2
done
echo "" >&2

echo "ACCEPTED Contracts (Total: ${#CONTRACT_IDS_ACCEPTED[@]}):" >&2
for idx in "${!CONTRACT_IDS_ACCEPTED[@]}"; do
  echo "  Contract ID: ${CONTRACT_IDS_ACCEPTED[$idx]}, Offer ID: ${OFFER_IDS_ACCEPTED[$idx]}" >&2
done
echo "" >&2

echo "COMPLETED Contracts (Total: ${#CONTRACT_IDS_COMPLETED[@]}):" >&2
# For completed, offer ID might also be relevant if needed for debugging/verification
for idx in "${!CONTRACT_IDS_COMPLETED[@]}"; do
  echo "  Contract ID: ${CONTRACT_IDS_COMPLETED[$idx]}, Offer ID: ${OFFER_IDS_COMPLETED[$idx]}" >&2
done
echo "" >&2

echo "FINALIZED Contracts (Total: ${#CONTRACT_IDS_FINALIZED[@]}):" >&2
for idx in "${!CONTRACT_IDS_FINALIZED[@]}"; do
  echo "  Contract ID: ${CONTRACT_IDS_FINALIZED[$idx]}, Offer ID: ${OFFER_IDS_FINALIZED[$idx]}" >&2
done
echo "" >&2

echo "Script finished successfully." >&2

