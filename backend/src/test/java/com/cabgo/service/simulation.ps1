
$baseUrl = "http://localhost:8080/api"

Write-Host "==============================================" -ForegroundColor Green
Write-Host "   VAZRA MOBILITY E2E WORKFLOW SIMULATION    " -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Helper function for JSON requests
function Invoke-Post([string]$path, $body, $headers = @{}) {
    $url = "$baseUrl$path"
    $json = $body | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Uri $url -Method POST -Body $json -ContentType "application/json" -Headers $headers
        return $r
    } catch {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errText = $reader.ReadToEnd()
        Write-Host "ERROR on POST $path`: $_`nResponse: $errText" -ForegroundColor Red
        return $null
    }
}

function Invoke-Get([string]$path, $headers = @{}) {
    $url = "$baseUrl$path"
    try {
        $r = Invoke-RestMethod -Uri $url -Method GET -Headers $headers
        return $r
    } catch {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errText = $reader.ReadToEnd()
        Write-Host "ERROR on GET $path`: $_`nResponse: $errText" -ForegroundColor Red
        return $null
    }
}

function Invoke-Patch([string]$path, $body = $null, $headers = @{}) {
    $url = "$baseUrl$path"
    $json = if ($body) { $body | ConvertTo-Json } else { "{}" }
    try {
        $r = Invoke-RestMethod -Uri $url -Method PATCH -Body $json -ContentType "application/json" -Headers $headers
        return $r
    } catch {
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errText = $reader.ReadToEnd()
            Write-Host "ERROR on PATCH $path`: $_`nResponse: $errText" -ForegroundColor Red
        } else {
            Write-Host "ERROR on PATCH $path`: $_" -ForegroundColor Red
        }
        return $null
    }
}

# Generate unique numbers
$rand = New-Object Random
$randSuffix = $rand.Next(100000, 999999).ToString()
$custPhone = "911$randSuffix"
$driverPhone = "922$randSuffix"

Write-Host "Dynamic Customer Phone: $custPhone" -ForegroundColor Gray
Write-Host "Dynamic Driver Phone: $driverPhone" -ForegroundColor Gray

# 1. Register Customer
Write-Host "`n1. REGISTERING CUSTOMER..." -ForegroundColor Yellow
$custReg = @{
    name = "Ravi E2E Customer"
    phone = $custPhone
    email = "ravi.$randSuffix@e2e.com"
    password = "Customer@123"
}
$custRegResp = Invoke-Post "/customer/auth/register" $custReg
if ($custRegResp) {
    Write-Host "Customer Registration Succeeded!" -ForegroundColor Green
} else {
    Write-Host "Customer registration failed!" -ForegroundColor Red
    exit
}

# 2. Customer Login (Send OTP)
Write-Host "`n2. CUSTOMER LOGIN (SEND OTP)..." -ForegroundColor Yellow
$login = @{ phone = $custPhone }
$loginResp = Invoke-Post "/customer/auth/login" $login
Write-Host "OTP Request response: $($loginResp.message)" -ForegroundColor Gray

# 3. Customer OTP Verification
Write-Host "`n3. CUSTOMER OTP VERIFY..." -ForegroundColor Yellow
$verify = @{ phone = $custPhone; otp = "123456" }
$verifyResp = Invoke-Post "/customer/auth/verify-otp" $verify
$custToken = $verifyResp.data.accessToken
$custHeaders = @{ Authorization = "Bearer $custToken" }
Write-Host "Customer Access Token: $($custToken.Substring(0, 40))..." -ForegroundColor Green

# 4. Register Driver
Write-Host "`n4. REGISTERING DRIVER..." -ForegroundColor Yellow
$driverReg = @{
    name = "Raju E2E Driver"
    phone = $driverPhone
    email = "raju.$randSuffix@e2e.com"
    password = "Driver@123"
    aadhaarNumber = "123456$randSuffix"
    licenseNumber = "KA-01-2024-$randSuffix"
    vehicleNumber = "KA-01-AB-$randSuffix"
    vehicleModel = "Toyota Etios"
    vehicleCategory = "SEDAN"
}
$driverRegResp = Invoke-Post "/driver/auth/register" $driverReg
if ($driverRegResp) {
    Write-Host "Driver Registration Succeeded!" -ForegroundColor Green
    $driverId = $driverRegResp.data.driver.id
} else {
    Write-Host "Driver registration failed!" -ForegroundColor Red
    exit
}

# 5. Driver Login (Send OTP)
Write-Host "`n5. DRIVER LOGIN (SEND OTP)..." -ForegroundColor Yellow
$dLogin = @{ phone = $driverPhone }
$dLoginResp = Invoke-Post "/driver/auth/login" $dLogin
Write-Host "Driver OTP Request response: $($dLoginResp.message)" -ForegroundColor Gray

# 6. Driver OTP Verification
Write-Host "`n6. DRIVER OTP VERIFY..." -ForegroundColor Yellow
$dVerify = @{ phone = $driverPhone; otp = "123456" }
$dVerifyResp = Invoke-Post "/driver/auth/verify-otp" $dVerify
$driverToken = $dVerifyResp.data.accessToken
$driverHeaders = @{ Authorization = "Bearer $driverToken" }
$driverId = $dVerifyResp.data.driver.id
Write-Host "Driver ID: $driverId" -ForegroundColor Gray
Write-Host "Driver Access Token: $($driverToken.Substring(0, 40))..." -ForegroundColor Green

# 7. Admin Login to Activate Driver
Write-Host "`n7. ADMIN LOGIN TO ACTIVATE DRIVER..." -ForegroundColor Yellow
$adminLogin = @{ email = "superadmin@vazraamobility.com"; password = "SuperAdmin@123" }
$adminLoginResp = Invoke-Post "/auth/login" $adminLogin
$adminToken = $adminLoginResp.data.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "Admin Access Token: $($adminToken.Substring(0, 40))..." -ForegroundColor Green

# Activate Driver Application
Write-Host "`n8. ACTIVATING DRIVER ONBOARDING..." -ForegroundColor Yellow
$activateResp = Invoke-Post "/admin/onboarding/applications/$driverId/activate" @{} $adminHeaders
if ($activateResp) {
    Write-Host "Driver onboarding application activated!" -ForegroundColor Green
}

# Also verify driver account status via admin action
$activateAccountResp = Invoke-Patch "/admin/drivers/$driverId/activate" @{} $adminHeaders
if ($activateAccountResp) {
    Write-Host "Driver account status activated!" -ForegroundColor Green
}

# 8. Driver goes ONLINE
Write-Host "`n9. DRIVER GOES ONLINE..." -ForegroundColor Yellow
$statusResp = Invoke-Patch "/driver/api/profile/status?status=ONLINE" @{} $driverHeaders
Write-Host "Driver status response: $($statusResp.message)" -ForegroundColor Green

# Driver sends Location heartbeat
$locationBody = @{ latitude = 12.9716; longitude = 77.5946 }
$locUpdate = Invoke-Patch "/driver/api/profile/location" $locationBody $driverHeaders
Write-Host "Driver location update response: $($locUpdate.message)" -ForegroundColor Green

# 9. Customer Fare Estimation
Write-Host "`n10. CUSTOMER FARE ESTIMATION..." -ForegroundColor Yellow
$estimation = Invoke-Get "/customer/rides/estimate?pickupLat=12.9716&pickupLng=77.5946&dropLat=13.0358&dropLng=77.5970" $custHeaders
if ($estimation) {
    Write-Host "Fare Estimation: PASS" -ForegroundColor Green
    $estimation.data.fares | ForEach-Object {
        Write-Host "   $($_.category): Rs. $($_.fare) ($($_.eta))"
    }
}

# 10. Customer books a ride
Write-Host "`n11. CUSTOMER BOOKS A RIDE..." -ForegroundColor Yellow
$booking = @{
    pickupLocation = "Majestic Palace"
    pickupLatitude = 12.9716
    pickupLongitude = 77.5946
    dropLocation = "Bengaluru Airport"
    dropLatitude = 13.1986
    dropLongitude = 77.7066
    vehicleCategory = "SEDAN"
    paymentMethod = "CASH"
}
$bookingResp = Invoke-Post "/customer/rides/book" $booking $custHeaders
if ($bookingResp) {
    $rideId = $bookingResp.data.id
    Write-Host "Ride Booked successfully!" -ForegroundColor Green
    Write-Host "Ride ID: $rideId" -ForegroundColor Green
    Write-Host "Ride Status: $($bookingResp.data.status)" -ForegroundColor Gray
} else {
    Write-Host "Ride booking failed!" -ForegroundColor Red
}

# 11. Driver fetches available requests
Write-Host "`n12. DRIVER FETCHING AVAILABLE REQUESTS..." -ForegroundColor Yellow
$requests = Invoke-Get "/driver/api/rides/requests" $driverHeaders
if ($requests) {
    Write-Host "Available requests count: $($requests.data.Count)" -ForegroundColor Green
    $requests.data | ForEach-Object {
        Write-Host "   Ride ID: $($_.id) | Pickup: $($_.pickupLocation) | Status: $($_.status)"
    }
}

# 12. Driver accepts ride
if ($rideId) {
    Write-Host "`n13. DRIVER ACCEPTING RIDE..." -ForegroundColor Yellow
    $acceptResp = Invoke-Post "/driver/api/rides/$rideId/accept" @{} $driverHeaders
    if ($acceptResp) {
        Write-Host "Ride accepted by driver!" -ForegroundColor Green
        Write-Host "New Ride Status: $($acceptResp.data.status)" -ForegroundColor Gray
    }
    
    # 13. Driver updates status to ARRIVED
    Write-Host "`n14. DRIVER UPDATING RIDE TO ARRIVED..." -ForegroundColor Yellow
    $arrivedResp = Invoke-Patch "/driver/api/rides/$rideId/status?status=ARRIVED" @{} $driverHeaders
    if ($arrivedResp) {
        Write-Host "Ride status updated to ARRIVED: PASS" -ForegroundColor Green
    }
    
    # 14. Driver updates status to ONGOING (starts ride)
    Write-Host "`n15. DRIVER STARTING THE RIDE (ONGOING)..." -ForegroundColor Yellow
    $ongoingResp = Invoke-Patch "/driver/api/rides/$rideId/status?status=ONGOING" @{} $driverHeaders
    if ($ongoingResp) {
        Write-Host "Ride status updated to ONGOING: PASS" -ForegroundColor Green
    }
    
    # 15. Driver updates status to COMPLETED (finishes ride)
    Write-Host "`n16. DRIVER COMPLETING THE RIDE (COMPLETED)..." -ForegroundColor Yellow
    $completedResp = Invoke-Patch "/driver/api/rides/$rideId/status?status=COMPLETED" @{} $driverHeaders
    if ($completedResp) {
        Write-Host "Ride status updated to COMPLETED: PASS" -ForegroundColor Green
        Write-Host "Fare Charged: Rs. $($completedResp.data.fare)" -ForegroundColor Green
    }
}

# 16. Verify Driver Earnings in Profile
Write-Host "`n17. VERIFYING DRIVER PROFILE EARNINGS..." -ForegroundColor Yellow
$profileResp = Invoke-Get "/driver/api/profile" $driverHeaders
if ($profileResp) {
    Write-Host "PASS: Earnings is: Rs. $($profileResp.data.totalEarnings) | Total Rides: $($profileResp.data.totalRides)" -ForegroundColor Green
}

Write-Host "`nE2E SIMULATION COMPLETED." -ForegroundColor Green
