package com.cabgo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "cities")
public class City {

    @Id
    private String id;

    @Indexed(unique = true)
    private String name;

    private String district;

    private String state;

    private String country;

    private String description;

    @Builder.Default
    private boolean active = true;

    private List<String> serviceAreas;

    private Double latitude;

    private Double longitude;

    /** Operating radius in km */
    private Double radius;

    private String timezone;

    /** Global demand multiplier for this city (e.g. 1.1 = +10%) */
    @Builder.Default
    private Double demandMultiplier = 1.0;

    /** Whether airport surcharge is applicable for this city */
    @Builder.Default
    private boolean airportSurchargeEnabled = false;

    /** Fixed airport surcharge amount in INR */
    @Builder.Default
    private Double airportSurchargeAmount = 0.0;

    /** Whether toll charges apply in this city */
    @Builder.Default
    private boolean tollEnabled = false;

    /** Estimated average toll charge in INR */
    @Builder.Default
    private Double averageTollCharge = 0.0;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
