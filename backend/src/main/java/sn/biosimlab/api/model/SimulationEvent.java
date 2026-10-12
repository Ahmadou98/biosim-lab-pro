package sn.biosimlab.api.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "simulation_events")
public class SimulationEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 32) private String batchCode;
    @Column(nullable = false, length = 24) private String severity;
    @Column(nullable = false, length = 48) private String category;
    @Column(nullable = false, length = 500) private String message;
    private int stepNumber;
    private Instant createdAt = Instant.now();
    public SimulationEvent() {}
    public SimulationEvent(String batchCode, String severity, String category, String message, int stepNumber) { this.batchCode=batchCode; this.severity=severity; this.category=category; this.message=message; this.stepNumber=stepNumber; }
    public Long getId(){return id;} public String getBatchCode(){return batchCode;} public String getSeverity(){return severity;} public String getCategory(){return category;} public String getMessage(){return message;} public int getStepNumber(){return stepNumber;} public Instant getCreatedAt(){return createdAt;}
}
