package com.disaster.dmas.controller;

import com.disaster.dmas.dto.AlertDto;
import com.disaster.dmas.entity.Alert;
import com.disaster.dmas.entity.User;
import com.disaster.dmas.service.AlertService;
import com.disaster.dmas.service.GdacsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AlertController {

    @Autowired
    private AlertService alertService;

    @Autowired
    private GdacsService gdacsService;

    @GetMapping
    public ResponseEntity<?> getAllAlerts(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String location) {
        
        try {
            List<Alert> alerts;
            if (type != null || severity != null || location != null) {
                alerts = alertService.getFilteredAlerts(type, severity, location);
            } else {
                alerts = alertService.getAllAlerts();
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", alerts,
                "count", alerts.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error fetching alerts: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAlertById(@PathVariable Long id) {
        try {
            Alert alert = alertService.getAlertById(id)
                    .orElseThrow(() -> new RuntimeException("Alert not found"));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", alert
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error fetching alert: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/unverified")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUnverifiedAlerts() {
        try {
            List<Alert> alerts = alertService.getUnverifiedAlerts();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", alerts,
                "count", alerts.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error fetching unverified alerts: " + e.getMessage()
            ));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAlert(@RequestBody AlertDto alertDto) {
        try {
            Alert alert = alertService.createAlert(alertDto, "MANUAL");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Alert created successfully",
                "data", alert
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error creating alert: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAlert(@PathVariable Long id, @RequestBody AlertDto alertDto) {
        try {
            Alert alert = alertService.updateAlert(id, alertDto);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Alert updated successfully",
                "data", alert
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error updating alert: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> verifyAlert(@PathVariable Long id, @AuthenticationPrincipal User user) {
        try {
            Alert alert = alertService.verifyAlert(id, user.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Alert verified successfully",
                "data", alert
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error verifying alert: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> broadcastAlert(@PathVariable Long id) {
        try {
            Alert alert = alertService.broadcastAlert(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Alert broadcasted successfully to all users",
                "data", alert
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error broadcasting alert: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAlert(@PathVariable Long id) {
        try {
            alertService.deleteAlert(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Alert deleted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error deleting alert: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/gdacs/fetch")
    public ResponseEntity<?> fetchGdacsData() {
        try {
            List<Alert> alerts = gdacsService.fetchGdacsAlerts();
            
            // Save the fetched alerts to database
            for (Alert alert : alerts) {
                try {
                    com.disaster.dmas.dto.AlertDto dto = new com.disaster.dmas.dto.AlertDto();
                    dto.setTitle(alert.getTitle());
                    dto.setType(alert.getType());
                    dto.setSeverity(alert.getSeverity());
                    dto.setLocation(alert.getLocation());
                    dto.setLatitude(alert.getLatitude());
                    dto.setLongitude(alert.getLongitude());
                    dto.setDescription(alert.getDescription());
                    dto.setSource(alert.getSource());
                    
                    alertService.createAlert(dto, "GDACS");
                } catch (Exception e) {
                    System.err.println("Error saving alert: " + e.getMessage());
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "GDACS data fetched and saved successfully",
                "data", alerts,
                "count", alerts.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error fetching GDACS data: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/gdacs")
    public ResponseEntity<?> getGdacsAlerts() {
        try {
            // First try to fetch fresh data from GDACS
            List<Alert> freshAlerts = gdacsService.fetchGdacsAlerts();
            
            // If we got fresh data, return it
            if (!freshAlerts.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", freshAlerts,
                    "source", "GDACS Live",
                    "count", freshAlerts.size()
                ));
            }
            
            // Fallback to stored GDACS alerts
            List<Alert> storedAlerts = alertService.getGdacsAlerts();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", storedAlerts,
                "source", "GDACS Stored",
                "count", storedAlerts.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error fetching GDACS alerts: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentAlerts(@RequestParam(defaultValue = "24") int hours) {
        try {
            List<Alert> alerts = alertService.getRecentAlerts(hours);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", alerts,
                "hours", hours,
                "count", alerts.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error fetching recent alerts: " + e.getMessage()
            ));
        }
    }
}
