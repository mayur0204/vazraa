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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "popular_destinations")
public class PopularDestination {

    @Id
    private String id;

    @Indexed
    private String city;

    private String state;

    private String name;

    private double latitude;

    private double longitude;

    private double radius; // in km

    private double demandMultiplier;

    /**
     * Category of this destination zone.
     * Values: AIRPORT, RAILWAY_STATION, BUS_STAND, IT_PARK,
     *         INDUSTRIAL_AREA, TOURIST_PLACE, SHOPPING_MALL,
     *         HOSPITAL, COLLEGE_UNIVERSITY, OTHER
     */
    private String category;

    @Builder.Default
    private boolean active = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
