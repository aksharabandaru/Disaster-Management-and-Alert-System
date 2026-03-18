package com.disaster.dmas.repository;

import com.disaster.dmas.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    
    @Query("SELECT a FROM Alert a ORDER BY a.createdAt DESC")
    List<Alert> findAllOrderByCreatedAtDesc();
    
    List<Alert> findByTypeContainingIgnoreCase(String type);
    
    List<Alert> findBySeverity(String severity);
    
    List<Alert> findByLocationContainingIgnoreCase(String location);
    
    @Query("SELECT a FROM Alert a WHERE " +
           "(:type IS NULL OR a.type LIKE %:type%) AND " +
           "(:severity IS NULL OR a.severity = :severity) AND " +
           "(:location IS NULL OR a.location LIKE %:location%)")
    List<Alert> findByFilters(@Param("type") String type,
                             @Param("severity") String severity,
                             @Param("location") String location);
    
    List<Alert> findByVerifiedFalse();
    
    List<Alert> findByVerifiedTrueOrderByBroadcastAtDesc();
    
    List<Alert> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime date);
    
    @Query("SELECT a FROM Alert a WHERE a.verified = false ORDER BY a.createdAt ASC")
    List<Alert> findUnverifiedAlertsOrderByCreatedAt();
    
    @Query("SELECT a FROM Alert a WHERE a.source = :source ORDER BY a.createdAt DESC")
    List<Alert> findBySourceOrderByCreatedAtDesc(@Param("source") String source);
}
