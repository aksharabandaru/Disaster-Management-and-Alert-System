package com.disaster.dmas.service;

import com.disaster.dmas.dto.AlertDto;
import com.disaster.dmas.entity.Alert;
import com.disaster.dmas.entity.User;
import com.disaster.dmas.repository.AlertRepository;
import com.disaster.dmas.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Alert> getAllAlerts() {
        return alertRepository.findAllOrderByCreatedAtDesc();
    }

    public List<Alert> getFilteredAlerts(String type, String severity, String location) {
        if (type == null || type.equals("all")) type = null;
        if (severity == null || severity.equals("all")) severity = null;
        if (location == null || location.trim().isEmpty()) location = null;
        
        return alertRepository.findByFilters(type, severity, location);
    }

    public Optional<Alert> getAlertById(Long id) {
        return alertRepository.findById(id);
    }

    public List<Alert> getUnverifiedAlerts() {
        return alertRepository.findUnverifiedAlertsOrderByCreatedAt();
    }

    @Transactional
    public Alert createAlert(AlertDto alertDto, String source) {
        Alert alert = new Alert();
        alert.setTitle(alertDto.getTitle());
        alert.setType(alertDto.getType());
        alert.setSeverity(alertDto.getSeverity());
        alert.setLocation(alertDto.getLocation());
        alert.setLatitude(alertDto.getLatitude());
        alert.setLongitude(alertDto.getLongitude());
        alert.setDescription(alertDto.getDescription());
        alert.setSource(source);
        alert.setVerified(false);
        
        return alertRepository.save(alert);
    }

    @Transactional
    public Alert updateAlert(Long id, AlertDto alertDto) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found with id: " + id));
        
        alert.setTitle(alertDto.getTitle());
        alert.setType(alertDto.getType());
        alert.setSeverity(alertDto.getSeverity());
        alert.setLocation(alertDto.getLocation());
        alert.setLatitude(alertDto.getLatitude());
        alert.setLongitude(alertDto.getLongitude());
        alert.setDescription(alertDto.getDescription());
        
        return alertRepository.save(alert);
    }

    @Transactional
    public Alert verifyAlert(Long alertId, Long verifiedByUserId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found with id: " + alertId));
        
        User verifiedBy = userRepository.findById(verifiedByUserId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + verifiedByUserId));
        
        alert.setVerified(true);
        alert.setVerifiedBy(verifiedBy);
        
        return alertRepository.save(alert);
    }

    @Transactional
    public Alert broadcastAlert(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found with id: " + alertId));
        
        alert.setBroadcastAt(LocalDateTime.now());
        
        return alertRepository.save(alert);
    }

    @Transactional
    public void deleteAlert(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found with id: " + id));
        
        alertRepository.delete(alert);
    }

    public List<Alert> getGdacsAlerts() {
        return alertRepository.findBySourceOrderByCreatedAtDesc("GDACS");
    }

    public List<Alert> getRecentAlerts(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return alertRepository.findByCreatedAtAfterOrderByCreatedAtDesc(since);
    }
}
