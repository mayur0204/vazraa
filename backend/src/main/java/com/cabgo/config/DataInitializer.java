package com.cabgo.config;

import com.cabgo.enums.AdminRole;
import com.cabgo.enums.VehicleCategory;
import com.cabgo.model.Admin;
import com.cabgo.model.City;
import com.cabgo.model.FestivalConfig;
import com.cabgo.model.PopularDestination;
import com.cabgo.model.Pricing;
import com.cabgo.repository.AdminRepository;
import com.cabgo.repository.CityRepository;
import com.cabgo.repository.DriverRepository;
import com.cabgo.repository.FestivalConfigRepository;
import com.cabgo.repository.PopularDestinationRepository;
import com.cabgo.repository.PricingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final PricingRepository pricingRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final CityRepository cityRepository;
    private final PopularDestinationRepository popularDestinationRepository;
    private final FestivalConfigRepository festivalConfigRepository;

    @Override
    public void run(String... args) {
        try {
            seedSuperAdmin();
            seedGlobalPricing();
            seedDriver();
            seedKarnatakaCities();
            seedPopularDestinations();
            seedFestivals();
        } catch (Exception e) {
            log.warn("MongoDB unavailable during startup — skipping seed data initialization. Cause: {}", e.getMessage());
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Karnataka Cities — All 22 major cities
    // ────────────────────────────────────────────────────────────────────────────
    private void seedKarnatakaCities() {
        seedCity("Bengaluru",     "Bengaluru Urban",   12.9716, 77.5946, 55.0, true,  true,  50.0, true,  40.0, "MINI:50:14:1.5, SEDAN:70:18:2.0, SUV:90:22:2.5, AUTO:35:11:1.0, BIKE:20:7:0.8");
        seedCity("Mysuru",        "Mysuru",            12.2958, 76.6394, 30.0, false, false, 0.0,  false, 0.0,  "MINI:40:12:1.2, SEDAN:60:15:1.5, SUV:80:19:2.0, AUTO:30:10:0.9");
        seedCity("Mangaluru",     "Dakshina Kannada",  12.9141, 74.8560, 25.0, true,  true,  40.0, false, 0.0,  "MINI:45:13:1.3, SEDAN:65:16:1.7, SUV:85:20:2.2, AUTO:32:10:0.95");
        seedCity("Hubballi",      "Dharwad",           15.3647, 75.1240, 20.0, false, false, 0.0,  false, 0.0,  "MINI:35:11:1.0, SEDAN:55:14:1.3, SUV:75:18:1.8, AUTO:28:9:0.8");
        seedCity("Dharwad",       "Dharwad",           15.4589, 75.0078, 15.0, false, false, 0.0,  false, 0.0,  "MINI:30:10:0.9, SEDAN:50:13:1.2, SUV:70:17:1.6, AUTO:25:8:0.75");
        seedCity("Belagavi",      "Belagavi",          15.8497, 74.4977, 20.0, false, false, 0.0,  false, 0.0,  "MINI:35:11:1.0, SEDAN:55:14:1.3, SUV:75:18:1.8, AUTO:28:9:0.8");
        seedCity("Kalaburagi",    "Kalaburagi",        17.3297, 76.8343, 18.0, false, false, 0.0,  false, 0.0,  "MINI:32:10:0.9, SEDAN:50:13:1.2, SUV:70:17:1.6, AUTO:26:8:0.75");
        seedCity("Shivamogga",    "Shivamogga",        13.9299, 75.5681, 18.0, false, false, 0.0,  false, 0.0,  "MINI:32:10:0.9, SEDAN:50:13:1.2, SUV:70:17:1.6, AUTO:26:8:0.75");
        seedCity("Davanagere",    "Davanagere",        14.4644, 75.9218, 15.0, false, false, 0.0,  false, 0.0,  "MINI:30:10:0.9, SEDAN:48:12:1.1, SUV:68:16:1.5, AUTO:25:8:0.7");
        seedCity("Tumakuru",      "Tumakuru",          13.3392, 77.1140, 18.0, false, false, 0.0,  false, 0.0,  "MINI:35:11:1.0, SEDAN:55:14:1.3, SUV:75:18:1.8, AUTO:28:9:0.8");
        seedCity("Ballari",       "Ballari",           15.1394, 76.9214, 15.0, false, false, 0.0,  false, 0.0,  "MINI:30:10:0.9, SEDAN:48:12:1.1, SUV:65:16:1.5, AUTO:24:8:0.7");
        seedCity("Hassan",        "Hassan",            13.0033, 76.1004, 15.0, false, false, 0.0,  false, 0.0,  "MINI:30:10:0.9, SEDAN:48:12:1.1, SUV:65:16:1.5, AUTO:24:8:0.7");
        seedCity("Udupi",         "Udupi",             13.3409, 74.7421, 15.0, false, false, 0.0,  false, 0.0,  "MINI:32:10:0.9, SEDAN:50:13:1.2, SUV:68:16:1.5, AUTO:26:8:0.75");
        seedCity("Chitradurga",   "Chitradurga",       14.2251, 76.3983, 12.0, false, false, 0.0,  false, 0.0,  "MINI:28:9:0.85, SEDAN:45:11:1.0, SUV:62:15:1.4, AUTO:22:7:0.65");
        seedCity("Vijayapura",    "Vijayapura",        16.8302, 75.7100, 15.0, false, false, 0.0,  false, 0.0,  "MINI:30:10:0.9, SEDAN:48:12:1.1, SUV:65:16:1.5, AUTO:24:8:0.7");
        seedCity("Raichur",       "Raichur",           16.2120, 77.3439, 12.0, false, false, 0.0,  false, 0.0,  "MINI:28:9:0.85, SEDAN:45:11:1.0, SUV:62:15:1.4, AUTO:22:7:0.65");
        seedCity("Kolar",         "Kolar",             13.1357, 78.1294, 12.0, false, false, 0.0,  false, 0.0,  "MINI:28:9:0.85, SEDAN:45:11:1.0, SUV:62:15:1.4, AUTO:22:7:0.65");
        seedCity("Chikkamagaluru","Chikkamagaluru",    13.3153, 75.7754, 12.0, false, false, 0.0,  false, 0.0,  "MINI:30:10:0.9, SEDAN:48:12:1.1, SUV:65:16:1.5, AUTO:24:8:0.7");
        seedCity("Mandya",        "Mandya",            12.5218, 76.8951, 12.0, false, false, 0.0,  false, 0.0,  "MINI:28:9:0.85, SEDAN:45:11:1.0, SUV:62:15:1.4, AUTO:22:7:0.65");
        seedCity("Ramanagara",    "Ramanagara",        12.7161, 77.2820, 10.0, false, false, 0.0,  false, 0.0,  "MINI:28:9:0.85, SEDAN:45:11:1.0, SUV:62:15:1.4, AUTO:22:7:0.65");
        seedCity("Bidar",         "Bidar",             17.9104, 77.5199, 12.0, false, false, 0.0,  false, 0.0,  "MINI:28:9:0.85, SEDAN:45:11:1.0, SUV:62:15:1.4, AUTO:22:7:0.65");
        seedCity("Gadag",         "Gadag",             15.4317, 75.6241, 10.0, false, false, 0.0,  false, 0.0,  "MINI:26:8:0.8,  SEDAN:42:10:0.95, SUV:60:14:1.3, AUTO:20:7:0.6");
    }

    /**
     * Seed a city and its per-category pricing.
     * pricingSpec format: "CATEGORY:base:perKm:perMin, ..."
     */
    private void seedCity(String name, String district, double lat, double lng,
                          double radius, boolean airportEnabled, boolean airportSurchargeEnabled,
                          double airportSurcharge, boolean tollEnabled, double avgToll,
                          String pricingSpec) {
        if (cityRepository.existsByName(name)) return;

        City city = City.builder()
            .name(name)
            .district(district)
            .state("Karnataka")
            .country("India")
            .active(true)
            .latitude(lat)
            .longitude(lng)
            .radius(radius)
            .timezone("Asia/Kolkata")
            .demandMultiplier(1.0)
            .airportSurchargeEnabled(airportSurchargeEnabled)
            .airportSurchargeAmount(airportSurcharge)
            .tollEnabled(tollEnabled)
            .averageTollCharge(avgToll)
            .build();
        city = cityRepository.save(city);

        for (String spec : pricingSpec.split(",")) {
            String[] parts = spec.trim().split(":");
            if (parts.length < 4) continue;
            VehicleCategory cat;
            try { cat = VehicleCategory.valueOf(parts[0].trim()); } catch (Exception e) { continue; }
            double base   = Double.parseDouble(parts[1].trim());
            double perKm  = Double.parseDouble(parts[2].trim());
            double perMin = Double.parseDouble(parts[3].trim());
            seedCityPricing(city.getId(), cat, base, perKm, perMin);
        }
        log.info("✅ Seeded city: {}", name);
    }

    private void seedCityPricing(String cityId, VehicleCategory category, double base, double perKm, double perMinute) {
        if (pricingRepository.findByCategoryAndCityId(category, cityId).isPresent()) return;
        Pricing pr = Pricing.builder()
            .cityId(cityId)
            .category(category)
            .baseFare(base)
            .perKmRate(perKm)
            .perMinuteRate(perMinute)
            .waitingChargePerMin(1.0)
            .minimumFare(base + 10.0)
            .cancellationFee(50.0)
            .cancellationGraceMinutes(5)
            .gstPercentage(5.0)
            .airportSurcharge(0.0)
            .peakHourMultiplier(1.25)
            .weekendMultiplier(1.1)
            .commissionPercentage(20.0)
            .surgePriceMultiplier(1.5)
            .surgePricingEnabled(false)
            .nightSurgeMultiplier(1.25)
            .nightPricingEnabled(false)
            .nightStartHour(22)
            .nightEndHour(6)
            .updatedBy("system")
            .updatedAt(LocalDateTime.now())
            .build();
        pricingRepository.save(pr);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Popular Destinations — 60+ zones across all 22 Karnataka cities
    // ────────────────────────────────────────────────────────────────────────────
    private void seedPopularDestinations() {
        if (popularDestinationRepository.count() > 0) return;

        List<PopularDestination> destinations = Arrays.asList(
            // ── Bengaluru ──────────────────────────────────────────────────────
            dest("Bengaluru", "Kempegowda International Airport",  13.1986, 77.7066, 3.0, 1.20, "AIRPORT"),
            dest("Bengaluru", "Bengaluru City Railway Station",    12.9779, 77.5730, 1.5, 1.10, "RAILWAY_STATION"),
            dest("Bengaluru", "Majestic (KSRTC Central Bus Stand)",12.9779, 77.5730, 1.5, 1.08, "BUS_STAND"),
            dest("Bengaluru", "Electronic City Phase 1",           12.8564, 77.6749, 2.0, 1.12, "IT_PARK"),
            dest("Bengaluru", "Whitefield ITPL",                   12.9830, 77.7479, 2.0, 1.12, "IT_PARK"),
            dest("Bengaluru", "Manyata Tech Park",                 13.0478, 77.6200, 2.0, 1.10, "IT_PARK"),
            dest("Bengaluru", "MG Road Metro Station",             12.9744, 77.6074, 1.0, 1.12, "RAILWAY_STATION"),
            dest("Bengaluru", "Koramangala Sony World Junction",   12.9345, 77.6269, 1.5, 1.10, "OTHER"),
            dest("Bengaluru", "Indiranagar 100ft Road",            12.9784, 77.6408, 1.0, 1.08, "OTHER"),
            dest("Bengaluru", "Hebbal Flyover",                    13.0355, 77.5970, 1.5, 1.10, "OTHER"),
            dest("Bengaluru", "Silk Board Junction",               12.9176, 77.6227, 1.5, 1.12, "OTHER"),
            dest("Bengaluru", "Bannerghatta Road IT Corridor",     12.8957, 77.6007, 2.0, 1.10, "IT_PARK"),
            dest("Bengaluru", "Devanahalli Town",                  13.2489, 77.7119, 1.5, 1.08, "OTHER"),
            dest("Bengaluru", "Rajiv Gandhi University of Health Sciences", 12.9341, 77.5948, 1.0, 1.05, "COLLEGE_UNIVERSITY"),
            dest("Bengaluru", "Victoria Hospital",                 12.9618, 77.5677, 1.0, 1.08, "HOSPITAL"),

            // ── Mysuru ────────────────────────────────────────────────────────
            dest("Mysuru", "Mysuru Palace",                        12.3051, 76.6551, 1.0, 1.15, "TOURIST_PLACE"),
            dest("Mysuru", "Mysuru Railway Station",               12.3163, 76.6433, 1.0, 1.10, "RAILWAY_STATION"),
            dest("Mysuru", "Mysuru KSRTC Bus Stand",               12.3127, 76.6441, 1.0, 1.08, "BUS_STAND"),
            dest("Mysuru", "Mysuru Zoo",                           12.3023, 76.6644, 1.0, 1.10, "TOURIST_PLACE"),
            dest("Mysuru", "Chamundeshwari Temple",                12.2723, 76.6697, 1.5, 1.12, "TOURIST_PLACE"),
            dest("Mysuru", "University of Mysore",                 12.3286, 76.6520, 1.0, 1.05, "COLLEGE_UNIVERSITY"),
            dest("Mysuru", "JSS Medical College",                  12.2993, 76.6422, 1.0, 1.05, "HOSPITAL"),

            // ── Mangaluru ─────────────────────────────────────────────────────
            dest("Mangaluru", "Mangaluru International Airport",   12.9612, 74.8900, 2.5, 1.18, "AIRPORT"),
            dest("Mangaluru", "Mangaluru Central Railway Station", 12.8710, 74.8430, 1.0, 1.10, "RAILWAY_STATION"),
            dest("Mangaluru", "KSRTC Bus Stand Mangaluru",         12.8690, 74.8440, 1.0, 1.08, "BUS_STAND"),
            dest("Mangaluru", "Panambur Beach",                    12.9372, 74.7963, 1.5, 1.10, "TOURIST_PLACE"),
            dest("Mangaluru", "Mangaluru University",              12.8941, 74.9145, 1.0, 1.05, "COLLEGE_UNIVERSITY"),
            dest("Mangaluru", "KMC Hospital",                      12.8635, 74.8439, 1.0, 1.08, "HOSPITAL"),

            // ── Hubballi ──────────────────────────────────────────────────────
            dest("Hubballi", "Hubballi Airport",                   15.3611, 75.0849, 2.0, 1.15, "AIRPORT"),
            dest("Hubballi", "Hubballi Railway Station",           15.3507, 75.1296, 1.0, 1.10, "RAILWAY_STATION"),
            dest("Hubballi", "Hubballi KSRTC Bus Stand",           15.3494, 75.1356, 1.0, 1.08, "BUS_STAND"),
            dest("Hubballi", "KIMS Hospital Hubballi",             15.3628, 75.1240, 1.0, 1.08, "HOSPITAL"),

            // ── Belagavi ──────────────────────────────────────────────────────
            dest("Belagavi", "Belagavi Airport",                   15.8593, 74.6185, 2.0, 1.15, "AIRPORT"),
            dest("Belagavi", "Belagavi Railway Station",           15.8608, 74.5121, 1.0, 1.10, "RAILWAY_STATION"),
            dest("Belagavi", "KSRTC Bus Stand Belagavi",           15.8508, 74.5024, 1.0, 1.08, "BUS_STAND"),
            dest("Belagavi", "KLE Technological University",       15.8574, 74.5088, 1.0, 1.05, "COLLEGE_UNIVERSITY"),

            // ── Shivamogga ────────────────────────────────────────────────────
            dest("Shivamogga", "Shivamogga Airport",               13.9786, 75.5371, 2.0, 1.15, "AIRPORT"),
            dest("Shivamogga", "Shivamogga Railway Station",       13.9293, 75.5617, 1.0, 1.10, "RAILWAY_STATION"),
            dest("Shivamogga", "KSRTC Bus Stand Shivamogga",       13.9319, 75.5620, 1.0, 1.08, "BUS_STAND"),
            dest("Shivamogga", "McGann Hospital",                  13.9308, 75.5604, 1.0, 1.08, "HOSPITAL"),

            // ── Tumakuru ──────────────────────────────────────────────────────
            dest("Tumakuru", "Tumakuru Railway Station",            13.3421, 77.1009, 1.0, 1.08, "RAILWAY_STATION"),
            dest("Tumakuru", "KSRTC Bus Stand Tumakuru",            13.3378, 77.1062, 1.0, 1.06, "BUS_STAND"),
            dest("Tumakuru", "SIT Campus Tumakuru",                 13.3275, 77.1252, 1.0, 1.06, "COLLEGE_UNIVERSITY"),
            dest("Tumakuru", "SIMS Hospital Tumakuru",              13.3412, 77.1008, 1.0, 1.05, "HOSPITAL"),

            // ── Kalaburagi ────────────────────────────────────────────────────
            dest("Kalaburagi", "Kalaburagi Airport",               17.3296, 76.8209, 2.0, 1.15, "AIRPORT"),
            dest("Kalaburagi", "Kalaburagi Railway Station",       17.3291, 76.8222, 1.0, 1.10, "RAILWAY_STATION"),
            dest("Kalaburagi", "Gulbarga University",              17.3297, 76.8210, 1.0, 1.05, "COLLEGE_UNIVERSITY"),

            // ── Davanagere ────────────────────────────────────────────────────
            dest("Davanagere", "Davanagere Railway Station",        14.4651, 75.9253, 1.0, 1.08, "RAILWAY_STATION"),
            dest("Davanagere", "KSRTC Bus Stand Davanagere",        14.4637, 75.9243, 1.0, 1.06, "BUS_STAND"),
            dest("Davanagere", "Bapuji Hospital",                   14.4628, 75.9248, 1.0, 1.08, "HOSPITAL"),

            // ── Ballari ───────────────────────────────────────────────────────
            dest("Ballari", "Ballari Railway Station",              15.1379, 76.9218, 1.0, 1.08, "RAILWAY_STATION"),
            dest("Ballari", "Ballari VIMS Hospital",                15.1393, 76.9202, 1.0, 1.05, "HOSPITAL"),

            // ── Hassan ────────────────────────────────────────────────────────
            dest("Hassan", "Hassan Railway Station",                13.0062, 76.1028, 1.0, 1.08, "RAILWAY_STATION"),
            dest("Hassan", "Hassan KSRTC Bus Stand",                13.0053, 76.1020, 1.0, 1.06, "BUS_STAND"),

            // ── Udupi ─────────────────────────────────────────────────────────
            dest("Udupi", "Udupi Sri Krishna Temple",               13.3407, 74.7476, 1.0, 1.12, "TOURIST_PLACE"),
            dest("Udupi", "Udupi Bus Stand",                        13.3409, 74.7421, 1.0, 1.08, "BUS_STAND"),
            dest("Udupi", "Manipal Hospital Udupi",                 13.3548, 74.7878, 1.5, 1.08, "HOSPITAL"),

            // ── Vijayapura ────────────────────────────────────────────────────
            dest("Vijayapura", "Gol Gumbaz",                        16.8302, 75.7200, 1.0, 1.15, "TOURIST_PLACE"),
            dest("Vijayapura", "Vijayapura Railway Station",        16.8287, 75.7158, 1.0, 1.08, "RAILWAY_STATION"),

            // ── Mandya ────────────────────────────────────────────────────────
            dest("Mandya", "Mandya Railway Station",                12.5228, 76.8941, 1.0, 1.06, "RAILWAY_STATION"),
            dest("Mandya", "KR Sagar Dam (Brindavan Gardens)",      12.4234, 76.5727, 2.0, 1.15, "TOURIST_PLACE"),

            // ── Chikkamagaluru ────────────────────────────────────────────────
            dest("Chikkamagaluru", "Mullayanagiri Trek Base",       13.3966, 75.7337, 2.0, 1.12, "TOURIST_PLACE"),
            dest("Chikkamagaluru", "Chikkamagaluru Bus Stand",      13.3153, 75.7754, 1.0, 1.05, "BUS_STAND"),

            // ── Ramanagara ────────────────────────────────────────────────────
            dest("Ramanagara", "Ramanagara Bus Stand",              12.7161, 77.2820, 1.0, 1.05, "BUS_STAND"),
            dest("Ramanagara", "Ramadevarabetta Vulture Sanctuary", 12.6973, 77.2784, 2.0, 1.10, "TOURIST_PLACE"),

            // ── Kolar ─────────────────────────────────────────────────────────
            dest("Kolar", "Kolar Gold Fields (KGF)",               12.9614, 78.2708, 2.0, 1.10, "TOURIST_PLACE"),
            dest("Kolar", "Kolar Bus Stand",                       13.1357, 78.1294, 1.0, 1.05, "BUS_STAND"),

            // ── Bidar ─────────────────────────────────────────────────────────
            dest("Bidar", "Bidar Fort",                            17.9147, 77.5276, 1.5, 1.10, "TOURIST_PLACE"),
            dest("Bidar", "Bidar Railway Station",                 17.9049, 77.5142, 1.0, 1.08, "RAILWAY_STATION"),

            // ── Dharwad ───────────────────────────────────────────────────────
            dest("Dharwad", "Karnataka University Dharwad",         15.4500, 75.0139, 1.0, 1.05, "COLLEGE_UNIVERSITY"),
            dest("Dharwad", "Dharwad Bus Stand",                   15.4589, 75.0078, 1.0, 1.05, "BUS_STAND"),

            // ── Raichur ───────────────────────────────────────────────────────
            dest("Raichur", "Raichur Railway Station",              16.2082, 77.3436, 1.0, 1.08, "RAILWAY_STATION"),
            dest("Raichur", "NTPC Raichur Thermal Power Station",  16.1786, 77.2959, 2.0, 1.06, "INDUSTRIAL_AREA"),

            // ── Gadag ─────────────────────────────────────────────────────────
            dest("Gadag", "Trikuteshwara Temple Gadag",            15.4284, 75.6208, 1.0, 1.10, "TOURIST_PLACE"),
            dest("Gadag", "Gadag Railway Station",                 15.4317, 75.6241, 1.0, 1.06, "RAILWAY_STATION"),

            // ── Chitradurga ───────────────────────────────────────────────────
            dest("Chitradurga", "Chitradurga Fort",                14.2338, 76.3921, 1.5, 1.12, "TOURIST_PLACE"),
            dest("Chitradurga", "Chitradurga Bus Stand",           14.2251, 76.3983, 1.0, 1.05, "BUS_STAND")
        );

        popularDestinationRepository.saveAll(destinations);
        log.info("✅ Seeded {} popular destinations across Karnataka.", destinations.size());
    }

    private PopularDestination dest(String city, String name, double lat, double lng,
                                    double radius, double multiplier, String category) {
        return PopularDestination.builder()
            .city(city)
            .state("Karnataka")
            .name(name)
            .latitude(lat)
            .longitude(lng)
            .radius(radius)
            .demandMultiplier(multiplier)
            .category(category)
            .active(true)
            .build();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Karnataka Festivals & Events
    // ────────────────────────────────────────────────────────────────────────────
    private void seedFestivals() {
        if (festivalConfigRepository.count() > 0) return;
        LocalDate today = LocalDate.now();
        List<FestivalConfig> list = Arrays.asList(
            FestivalConfig.builder().name("Dasara (Mysuru Dasara)").startDate(today.withMonth(10).withDayOfMonth(2)).endDate(today.withMonth(10).withDayOfMonth(12)).multiplier(1.20).build(),
            FestivalConfig.builder().name("Ganesh Chaturthi").startDate(today.withMonth(9).withDayOfMonth(7)).endDate(today.withMonth(9).withDayOfMonth(17)).multiplier(1.15).build(),
            FestivalConfig.builder().name("Karnataka Rajyotsava").startDate(LocalDate.of(today.getYear(), 11, 1)).endDate(LocalDate.of(today.getYear(), 11, 1)).multiplier(1.15).build(),
            FestivalConfig.builder().name("Ugadi").startDate(today.withMonth(3).withDayOfMonth(20)).endDate(today.withMonth(3).withDayOfMonth(21)).multiplier(1.12).build(),
            FestivalConfig.builder().name("New Year").startDate(LocalDate.of(today.getYear() + 1, 1, 1)).endDate(LocalDate.of(today.getYear() + 1, 1, 1)).multiplier(1.25).build()
        );
        festivalConfigRepository.saveAll(list);
        log.info("✅ Seeded {} Karnataka festival configurations.", list.size());
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Test Driver (Karnataka vehicle)
    // ────────────────────────────────────────────────────────────────────────────
    private void seedDriver() {
        if (driverRepository.findByPhone("9876543210").isPresent()) return;
        com.cabgo.model.Driver driver = com.cabgo.model.Driver.builder()
            .name("Test Driver")
            .phone("9876543210")
            .email("driver@vazraamobility.com")
            .password(passwordEncoder.encode("Driver@123"))
            .vehicleNumber("KA01AB1234")   // Karnataka registration
            .vehicleModel("Swift Dzire")
            .vehicleCategory(VehicleCategory.SEDAN)
            .verificationStatus(com.cabgo.enums.VerificationStatus.APPROVED)
            .status(com.cabgo.enums.DriverStatus.OFFLINE)
            .rating(4.5)
            .totalRides(120)
            .totalEarnings(45000.0)
            .createdAt(LocalDateTime.now())
            .build();
        driverRepository.save(driver);
        log.info("✅ Test Driver seeded: 9876543210 / OTP: 123456 | Vehicle: KA01AB1234");
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Super Admin & Admin accounts
    // ────────────────────────────────────────────────────────────────────────────
    private void seedSuperAdmin() {
        if (adminRepository.findByEmail("superadmin@vazraamobility.com").isEmpty()) {
            Admin superAdmin = Admin.builder()
                .name("Super Admin")
                .email("superadmin@vazraamobility.com")
                .phone("+91-9999999999")
                .password(passwordEncoder.encode("SuperAdmin@123"))
                .role(AdminRole.SUPER_ADMIN)
                .build();
            adminRepository.save(superAdmin);
            log.info("✅ Super Admin seeded: superadmin@vazraamobility.com / SuperAdmin@123");
        }
        if (adminRepository.findByEmail("admin@vazraamobility.com").isEmpty()) {
            Admin admin = Admin.builder()
                .name("Admin User")
                .email("admin@vazraamobility.com")
                .phone("+91-8888888888")
                .password(passwordEncoder.encode("Admin@123"))
                .role(AdminRole.ADMIN)
                .build();
            adminRepository.save(admin);
            log.info("✅ Admin seeded: admin@vazraamobility.com / Admin@123");
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Global Default Pricing (fallback when no city-specific pricing exists)
    // ────────────────────────────────────────────────────────────────────────────
    private void seedGlobalPricing() {
        if (pricingRepository.count() > 0) return;
        List<Pricing> pricingList = Arrays.asList(
            buildGlobalPricing(VehicleCategory.MINI,  30.0, 8.0,  1.5, 50.0,  20.0),
            buildGlobalPricing(VehicleCategory.SEDAN, 50.0, 12.0, 2.0, 80.0,  20.0),
            buildGlobalPricing(VehicleCategory.SUV,   80.0, 18.0, 3.0, 120.0, 20.0),
            buildGlobalPricing(VehicleCategory.BIKE,  15.0, 5.0,  0.8, 30.0,  15.0),
            buildGlobalPricing(VehicleCategory.AUTO,  20.0, 6.0,  1.0, 40.0,  15.0)
        );
        pricingRepository.saveAll(pricingList);
        log.info("✅ Global default pricing seeded for all vehicle categories.");
    }

    private Pricing buildGlobalPricing(VehicleCategory cat, double base, double perKm, double perMin, double minFare, double commission) {
        return Pricing.builder()
            .category(cat)
            .baseFare(base).perKmRate(perKm).perMinuteRate(perMin)
            .waitingChargePerMin(1.0)
            .minimumFare(minFare)
            .cancellationFee(50.0)
            .cancellationGraceMinutes(5)
            .gstPercentage(5.0)
            .airportSurcharge(0.0)
            .peakHourMultiplier(1.25)
            .weekendMultiplier(1.1)
            .commissionPercentage(commission)
            .surgePriceMultiplier(1.5)
            .surgePricingEnabled(false)
            .nightSurgeMultiplier(1.25)
            .nightPricingEnabled(false)
            .nightStartHour(22).nightEndHour(6)
            .build();
    }
}
