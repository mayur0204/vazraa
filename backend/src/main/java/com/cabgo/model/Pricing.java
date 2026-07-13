package com.cabgo.model;

import com.cabgo.enums.VehicleCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "pricing")
public class Pricing {

    @Id
    private String id;

    private VehicleCategory category;

    // ── Core Fare ───────────────────────────────────────────────────────────────
    private Double baseFare;

    private Double perKmRate;

    /** Charge per minute while the ride is in progress */
    private Double perMinuteRate;

    /** Separate waiting charge per minute while driver is waiting at pickup */
    @Builder.Default
    private Double waitingChargePerMin = 1.0;

    private Double minimumFare;

    // ── Cancellation ────────────────────────────────────────────────────────────
    /** Flat cancellation fee charged after grace period (in INR) */
    @Builder.Default
    private Double cancellationFee = 50.0;

    /** Free cancellation window in minutes after booking */
    @Builder.Default
    private Integer cancellationGraceMinutes = 5;

    // ── Taxes ───────────────────────────────────────────────────────────────────
    /** GST percentage applied on the total fare */
    @Builder.Default
    private Double gstPercentage = 5.0;

    // ── Airport Surcharge ───────────────────────────────────────────────────────
    /** Extra surcharge for rides to/from airports (in INR) */
    @Builder.Default
    private Double airportSurcharge = 0.0;

    // ── Surge / Peak Hour ───────────────────────────────────────────────────────
    private Double surgePriceMultiplier;

    @Builder.Default
    private boolean surgePricingEnabled = false;

    /** Multiplier during defined peak hours */
    @Builder.Default
    private Double peakHourMultiplier = 1.25;

    /** Multiplier on weekends (Sat & Sun) */
    @Builder.Default
    private Double weekendMultiplier = 1.1;

    // ── Night Pricing ───────────────────────────────────────────────────────────
    private Double nightSurgeMultiplier;

    @Builder.Default
    private boolean nightPricingEnabled = false;

    /** Night pricing start hour (0–23), default 22:00 */
    private Integer nightStartHour;

    /** Night pricing end hour (0–23), default 06:00 */
    private Integer nightEndHour;

    // ── Commission ──────────────────────────────────────────────────────────────
    private Double commissionPercentage;

    // ── Scope ───────────────────────────────────────────────────────────────────
    /** null = global pricing, non-null = city-specific override */
    private String cityId;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private String updatedBy;
}
