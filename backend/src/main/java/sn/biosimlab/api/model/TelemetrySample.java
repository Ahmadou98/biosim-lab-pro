package sn.biosimlab.api.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "telemetry_samples")
public class TelemetrySample {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 32) private String batchCode;
    private int stepNumber;
    private double temperatureIndex;
    private double agitationIndex;
    private double gasTransferIndex;
    private double qualityTrendIndex;
    private Instant createdAt = Instant.now();
    public TelemetrySample() {}
    public TelemetrySample(String batchCode, int stepNumber, double temperatureIndex, double agitationIndex, double gasTransferIndex, double qualityTrendIndex) { this.batchCode=batchCode;this.stepNumber=stepNumber;this.temperatureIndex=temperatureIndex;this.agitationIndex=agitationIndex;this.gasTransferIndex=gasTransferIndex;this.qualityTrendIndex=qualityTrendIndex; }
    public Long getId(){return id;} public String getBatchCode(){return batchCode;} public int getStepNumber(){return stepNumber;} public double getTemperatureIndex(){return temperatureIndex;} public double getAgitationIndex(){return agitationIndex;} public double getGasTransferIndex(){return gasTransferIndex;} public double getQualityTrendIndex(){return qualityTrendIndex;} public Instant getCreatedAt(){return createdAt;}
}
