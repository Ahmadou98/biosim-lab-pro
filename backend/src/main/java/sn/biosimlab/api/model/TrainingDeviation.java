package sn.biosimlab.api.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "training_deviations")
public class TrainingDeviation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 32) private String batchCode;
    @Column(nullable = false, length = 160) private String title;
    @Column(nullable = false, length = 24) private String severity;
    @Column(nullable = false, length = 24) private String status = "OPEN";
    @Column(nullable = false, length = 800) private String action;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    public TrainingDeviation() {}
    public TrainingDeviation(String batchCode,String title,String severity,String status,String action){this.batchCode=batchCode;this.title=title;this.severity=severity;this.status=status;this.action=action;}
    @PreUpdate public void beforeUpdate(){updatedAt=Instant.now();}
    public Long getId(){return id;} public String getBatchCode(){return batchCode;} public String getTitle(){return title;} public String getSeverity(){return severity;} public String getStatus(){return status;} public void setStatus(String status){this.status=status;} public String getAction(){return action;} public Instant getCreatedAt(){return createdAt;} public Instant getUpdatedAt(){return updatedAt;}
}
