package com.cabgo.service;

import com.cabgo.model.Pricing;
import org.springframework.stereotype.Component;

@Component
public class FareCalculator {

    public static class CalculationBreakdown {
        public double base;
        public double distance;
        public double time;
        public double waiting;
        public double airportSurcharge;
        public double trafficMultiplier;
        public double demandMultiplier;
        public double peakMultiplier;
        public double weekendMultiplier;
        public double festivalMultiplier;
        public double gstAmount;

        public CalculationBreakdown(double base, double distance, double time, double waiting, double airportSurcharge,
                                    double trafficMultiplier, double demandMultiplier, double peakMultiplier,
                                    double weekendMultiplier, double festivalMultiplier, double gstAmount) {
            this.base = base;
            this.distance = distance;
            this.time = time;
            this.waiting = waiting;
            this.airportSurcharge = airportSurcharge;
            this.trafficMultiplier = trafficMultiplier;
            this.demandMultiplier = demandMultiplier;
            this.peakMultiplier = peakMultiplier;
            this.weekendMultiplier = weekendMultiplier;
            this.festivalMultiplier = festivalMultiplier;
            this.gstAmount = gstAmount;
        }
    }

    public static class CalculateResult {
        public final long finalFare;
        public final CalculationBreakdown breakdown;

        public CalculateResult(long finalFare, CalculationBreakdown breakdown) {
            this.finalFare = finalFare;
            this.breakdown = breakdown;
        }
    }

    public CalculateResult calculateFare(
            Pricing pricing,
            double distanceKm,
            double normalDurationMinutes,
            double trafficMultiplier,
            double destinationMultiplier,
            double peakMultiplier,
            double weekendMultiplier,
            double festivalMultiplier,
            double waitingMinutes) {

        double baseFare = pricing.getBaseFare() != null ? pricing.getBaseFare() : 50.0;
        double distanceCharge = distanceKm * (pricing.getPerKmRate() != null ? pricing.getPerKmRate() : 12.0);
        double timeCharge = normalDurationMinutes * (pricing.getPerMinuteRate() != null ? pricing.getPerMinuteRate() : 1.0);
        double waitingCharge = waitingMinutes * (pricing.getWaitingChargePerMin() != null ? pricing.getWaitingChargePerMin() : 1.0);
        double airportSurcharge = pricing.getAirportSurcharge() != null ? pricing.getAirportSurcharge() : 0.0;

        double subtotal = baseFare + distanceCharge + timeCharge + waitingCharge + airportSurcharge;
        double dynamicFare = subtotal;

        // Apply multipliers
        dynamicFare *= trafficMultiplier;
        dynamicFare *= destinationMultiplier;
        dynamicFare *= peakMultiplier;
        dynamicFare *= weekendMultiplier;
        dynamicFare *= festivalMultiplier;

        // Calculate GST
        double gstRate = pricing.getGstPercentage() != null ? pricing.getGstPercentage() : 5.0;
        double gstAmount = dynamicFare * (gstRate / 100.0);
        double totalFare = dynamicFare + gstAmount;

        long finalFare = Math.round(totalFare);

        CalculationBreakdown breakdown = new CalculationBreakdown(
            baseFare,
            distanceCharge,
            timeCharge,
            waitingCharge,
            airportSurcharge,
            trafficMultiplier,
            destinationMultiplier,
            peakMultiplier,
            weekendMultiplier,
            festivalMultiplier,
            gstAmount
        );

        return new CalculateResult(finalFare, breakdown);
      }
}
