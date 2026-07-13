package com.cabgo.service;

import com.cabgo.dto.FareRequest;
import com.cabgo.dto.FareResponse;
import com.cabgo.dto.request.RideBookingRequest;
import com.cabgo.dto.response.FareEstimationResponse;
import com.cabgo.enums.RideStatus;
import com.cabgo.enums.VehicleCategory;
import com.cabgo.exception.BadRequestException;
import com.cabgo.exception.ResourceNotFoundException;
import com.cabgo.model.Ride;
import com.cabgo.repository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RideBookingService {

    private final RideRepository rideRepository;
    private final GoogleMapsService googleMapsService;
    private final FareService fareService;

    public FareEstimationResponse getFareEstimation(Double pLat, Double pLog, Double dLat, Double dLog) {
        GoogleMapsService.DistanceResult route = googleMapsService.getDistance(pLat, pLog, dLat, dLog);
        double distance = route.distanceKm();
        int duration = route.durationMinutes();

        List<FareEstimationResponse.VehicleFare> fares = Arrays.stream(VehicleCategory.values())
                .map(category -> {
                    double fareVal = 50.0;
                    try {
                        FareResponse est = fareService.estimateFare(FareRequest.builder()
                                .pickupLat(pLat)
                                .pickupLng(pLog)
                                .dropLat(dLat)
                                .dropLng(dLog)
                                .city("Bengaluru")
                                .vehicleType(category.name())
                                .build());
                        fareVal = est.getEstimatedFare();
                    } catch (Exception e) {
                        log.warn("Failed to get DB-driven estimate for booking: {}. Falling back.", category);
                        fareVal = calculateFallbackFare(category, distance);
                    }
                    return FareEstimationResponse.VehicleFare.builder()
                            .category(category)
                            .fare(fareVal)
                            .eta(route.durationText())
                            .build();
                })
                .collect(Collectors.toList());

        return FareEstimationResponse.builder()
                .distance(Math.round(distance * 100.0) / 100.0)
                .duration(duration)
                .fares(fares)
                .build();
    }

    public Ride bookRide(String customerId, RideBookingRequest request) {
        // Check if customer already has an active ride
        List<RideStatus> activeStatuses = Arrays.asList(
                RideStatus.REQUESTED, RideStatus.SEARCHING, RideStatus.DRIVER_ASSIGNED, 
                RideStatus.DRIVER_ARRIVING, RideStatus.RIDE_STARTED, RideStatus.ONGOING);
        
        rideRepository.findFirstByCustomerIdAndStatusInOrderByCreatedAtDesc(customerId, activeStatuses)
                .ifPresent(r -> {
                    throw new BadRequestException("You already have an active ride");
                });

        // Calculate fare using the FareService engine
        double fareVal = 50.0;
        GoogleMapsService.DistanceResult route = googleMapsService.getDistance(
                request.getPickupLatitude(), request.getPickupLongitude(),
                request.getDropLatitude(), request.getDropLongitude()
        );
        double distance = route.distanceKm();

        try {
            FareResponse est = fareService.estimateFare(FareRequest.builder()
                    .pickupLat(request.getPickupLatitude())
                    .pickupLng(request.getPickupLongitude())
                    .dropLat(request.getDropLatitude())
                    .dropLng(request.getDropLongitude())
                    .city("Bengaluru")
                    .vehicleType(request.getVehicleCategory().name())
                    .build());
            fareVal = est.getEstimatedFare();
        } catch (Exception e) {
            log.warn("Failed dynamic fare calculation during booking. Falling back to default.");
            fareVal = calculateFallbackFare(request.getVehicleCategory(), distance);
        }

        Ride ride = Ride.builder()
                .customerId(customerId)
                .pickupLocation(request.getPickupLocation())
                .pickupLatitude(request.getPickupLatitude())
                .pickupLongitude(request.getPickupLongitude())
                .dropLocation(request.getDropLocation())
                .dropLatitude(request.getDropLatitude())
                .dropLongitude(request.getDropLongitude())
                .vehicleCategory(request.getVehicleCategory())
                .status(RideStatus.REQUESTED)
                .distance(distance)
                .duration((double) route.durationMinutes())
                .estimatedFare(fareVal)
                .fare(fareVal)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus("PENDING")
                .bookingTime(LocalDateTime.now())
                .otp(String.format("%04d", new Random().nextInt(10000)))
                .build();

        return rideRepository.save(ride);
    }

    public Ride getActiveRide(String customerId) {
        List<RideStatus> activeStatuses = Arrays.asList(
                RideStatus.REQUESTED, RideStatus.SEARCHING, RideStatus.DRIVER_ASSIGNED, 
                RideStatus.DRIVER_ARRIVING, RideStatus.RIDE_STARTED, RideStatus.ONGOING);
        
        return rideRepository.findFirstByCustomerIdAndStatusInOrderByCreatedAtDesc(customerId, activeStatuses)
                .orElseThrow(() -> new ResourceNotFoundException("No active ride found"));
    }

    public void cancelRide(String rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found"));
        
        if (ride.getStatus() == RideStatus.COMPLETED || ride.getStatus() == RideStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel a finished ride");
        }
        
        ride.setStatus(RideStatus.CANCELLED);
        rideRepository.save(ride);
    }

    private double calculateFallbackFare(VehicleCategory category, double distance) {
        double baseFare = switch (category) {
            case MINI -> 40.0;
            case HATCHBACK -> 45.0;
            case SEDAN -> 80.0;
            case SUV -> 120.0;
            case BIKE -> 20.0;
            case AUTO -> 30.0;
            case LUXURY -> 150.0;
        };
        double perKmRate = switch (category) {
            case MINI -> 10.0;
            case HATCHBACK -> 11.0;
            case SEDAN -> 15.0;
            case SUV -> 20.0;
            case BIKE -> 5.0;
            case AUTO -> 8.0;
            case LUXURY -> 25.0;
        };
        return baseFare + (distance * perKmRate);
    }
}
