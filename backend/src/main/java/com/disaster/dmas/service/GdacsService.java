package com.disaster.dmas.service;

import com.disaster.dmas.dto.AlertDto;
import com.disaster.dmas.entity.Alert;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class GdacsService {

    @Autowired
    private AlertService alertService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String GDACS_API_URL = "https://www.gdacs.org/gdacsapi/api/Events/geteventlist/EVENTS4APP";

    public List<Alert> fetchGdacsAlerts() {
        try {
            String response = restTemplate.getForObject(GDACS_API_URL, String.class);
            
            if (response == null || !response.contains("features")) {
                return new ArrayList<>();
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode features = root.path("features");
            
            List<Alert> alerts = new ArrayList<>();
            
            if (features.isArray()) {
                for (JsonNode feature : features) {
                    Alert alert = mapGdacsFeatureToAlert(feature);
                    if (alert != null) {
                        alerts.add(alert);
                    }
                }
            }

            return alerts;
        } catch (Exception e) {
            System.err.println("Error fetching GDACS alerts: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Transactional
    public Alert saveGdacsAlert(JsonNode event) {
        AlertDto alertDto = mapGdacsEventToAlertDto(event);
        return alertService.createAlert(alertDto, "GDACS");
    }

    private Alert mapGdacsFeatureToAlert(JsonNode feature) {
        try {
            JsonNode properties = feature.path("properties");
            JsonNode geometry = feature.path("geometry");
            
            String title = properties.path("name").asText();
            String eventType = properties.path("eventtype").asText();
            String type = mapEventType(eventType);
            String severity = properties.path("alertlevel").asText().toLowerCase();
            String location = properties.path("country").asText();
            String description = properties.path("htmldescription").asText();
            String eventId = properties.path("eventid").asText();
            
            // Parse coordinates from geometry
            Double latitude = null;
            Double longitude = null;
            if (geometry.has("coordinates") && geometry.path("coordinates").isArray()) {
                JsonNode coords = geometry.path("coordinates");
                longitude = coords.get(0).asDouble();
                latitude = coords.get(1).asDouble();
            }
            
            // Parse date
            String dateStr = properties.path("fromdate").asText();
            LocalDateTime createdAt = parseGdacsDate(dateStr);

            Alert alert = new Alert();
            alert.setTitle(title.isEmpty() ? "Unknown Disaster" : title);
            alert.setType(type.isEmpty() ? "Unknown" : type);
            alert.setSeverity(severity.isEmpty() ? "low" : severity);
            alert.setLocation(location.isEmpty() ? "Unknown Location" : location);
            alert.setDescription(description.isEmpty() ? "No description available" : description);
            alert.setSource("GDACS");
            alert.setVerified(false);
            alert.setLatitude(latitude);
            alert.setLongitude(longitude);
            alert.setCreatedAt(createdAt);

            return alert;
        } catch (Exception e) {
            System.err.println("Error mapping GDACS feature: " + e.getMessage());
            return null;
        }
    }

    private AlertDto mapGdacsEventToAlertDto(JsonNode event) {
        AlertDto alertDto = new AlertDto();
        
        alertDto.setTitle(event.path("name").asText());
        alertDto.setType(extractType(event));
        alertDto.setSeverity(mapSeverity(event.path("severity").asText()));
        alertDto.setLocation(event.path("country").asText());
        alertDto.setDescription(event.path("description").asText());
        alertDto.setSource("GDACS");
        
        if (event.has("lat") && event.has("lng")) {
            alertDto.setLatitude(event.path("lat").asDouble());
            alertDto.setLongitude(event.path("lng").asDouble());
        }
        
        return alertDto;
    }

    private String extractType(JsonNode event) {
        // Try to extract type from various fields
        if (event.has("type")) {
            return event.path("type").asText();
        }
        
        if (event.has("eventtype")) {
            return event.path("eventtype").asText();
        }
        
        // Try to extract from name or description
        String name = event.path("name").asText().toLowerCase();
        if (name.contains("earthquake") || name.contains("quake")) {
            return "earthquake";
        } else if (name.contains("flood") || name.contains("flood")) {
            return "flood";
        } else if (name.contains("storm") || name.contains("hurricane") || name.contains("typhoon")) {
            return "storm";
        } else if (name.contains("volcano") || name.contains("eruption")) {
            return "volcano";
        } else if (name.contains("drought")) {
            return "drought";
        } else if (name.contains("fire") || name.contains("wildfire")) {
            return "fire";
        }
        
        return "unknown";
    }

    private String mapSeverity(String gdacsSeverity) {
        if (gdacsSeverity == null || gdacsSeverity.isEmpty()) {
            return "low";
        }
        
        String severity = gdacsSeverity.toLowerCase();
        if (severity.contains("red") || severity.contains("high") || severity.contains("extreme") || severity.contains("severe")) {
            return "high";
        } else if (severity.contains("orange") || severity.contains("moderate") || severity.contains("medium")) {
            return "moderate";
        } else if (severity.contains("green") || severity.contains("low") || severity.contains("minor")) {
            return "low";
        }
        
        return "low";
    }

    private String mapEventType(String eventType) {
        if (eventType == null || eventType.isEmpty()) {
            return "unknown";
        }
        
        switch (eventType) {
            case "EQ":
                return "earthquake";
            case "WF":
                return "wildfire";
            case "FL":
                return "flood";
            case "DR":
                return "drought";
            case "TC":
                return "cyclone";
            case "VO":
                return "volcano";
            case "TS":
                return "tsunami";
            case "ST":
                return "storm";
            default:
                return eventType.toLowerCase();
        }
    }

    private LocalDateTime parseGdacsDate(String dateStr) {
        try {
            // Try different date formats
            DateTimeFormatter[] formatters = {
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ISO_DATE_TIME
            };
            
            for (DateTimeFormatter formatter : formatters) {
                try {
                    return LocalDateTime.parse(dateStr, formatter);
                } catch (Exception e) {
                    // Continue to next format
                }
            }
            
            // If all formats fail, return current time
            return LocalDateTime.now();
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    @Transactional
    public void fetchAndSaveGdacsAlerts() {
        try {
            List<Alert> gdacsAlerts = fetchGdacsAlerts();
            
            for (Alert alert : gdacsAlerts) {
                try {
                    // Check if alert already exists to avoid duplicates
                    boolean exists = alertService.getAllAlerts().stream()
                            .anyMatch(existing -> existing.getTitle().equals(alert.getTitle()) 
                                    && existing.getSource().equals("GDACS")
                                    && existing.getCreatedAt().isEqual(alert.getCreatedAt()));
                    
                    if (!exists) {
                        alertService.createAlert(convertToDto(alert), "GDACS");
                        System.out.println("Saved new GDACS alert: " + alert.getTitle());
                    }
                } catch (Exception e) {
                    System.err.println("Error saving GDACS alert: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Error in scheduled GDACS fetch: " + e.getMessage());
        }
    }

    private AlertDto convertToDto(Alert alert) {
        AlertDto dto = new AlertDto();
        dto.setTitle(alert.getTitle());
        dto.setType(alert.getType());
        dto.setSeverity(alert.getSeverity());
        dto.setLocation(alert.getLocation());
        dto.setLatitude(alert.getLatitude());
        dto.setLongitude(alert.getLongitude());
        dto.setDescription(alert.getDescription());
        dto.setSource(alert.getSource());
        return dto;
    }
}
