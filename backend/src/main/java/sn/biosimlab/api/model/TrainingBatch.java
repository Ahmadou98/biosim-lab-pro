package sn.biosimlab.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Entity
@Table(name = "training_batches", indexes = @Index(name = "idx_training_batch_owner_created", columnList = "owner_session_id, created_at"))
public class TrainingBatch {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 32) private String batchCode;
    // Anonymous browser workspace identifier; not a substitute for authenticated user identity.
    @Column(name = "owner_session_id", length = 36) private String ownerSessionId;
    @Column(nullable = false, length = 80) private String scenario;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 32) private BatchStatus status = BatchStatus.READY;
    @Column(nullable = false, length = 80) private String phase = "Mise en route";
    private int step = 0;
    private int progressPercent = 0;
    private double temperatureSetpointIndex = 54;
    private double agitationSetpointIndex = 48;
    private double gasTransferSetpointIndex = 45;
    private double temperatureActualIndex = 51;
    private double agitationActualIndex = 44;
    private double gasTransferActualIndex = 42;
    private double qualityTrendIndex = 96;
    private int alarmCount = 0;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @PreUpdate public void beforeUpdate() { updatedAt = Instant.now(); }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getBatchCode() { return batchCode; } public void setBatchCode(String batchCode) { this.batchCode = batchCode; }
    @JsonIgnore public String getOwnerSessionId() { return ownerSessionId; } public void setOwnerSessionId(String ownerSessionId) { this.ownerSessionId = ownerSessionId; }
    public String getScenario() { return scenario; } public void setScenario(String scenario) { this.scenario = scenario; }
    public BatchStatus getStatus() { return status; } public void setStatus(BatchStatus status) { this.status = status; }
    public String getPhase() { return phase; } public void setPhase(String phase) { this.phase = phase; }
    public int getStep() { return step; } public void setStep(int step) { this.step = step; }
    public int getProgressPercent() { return progressPercent; } public void setProgressPercent(int progressPercent) { this.progressPercent = progressPercent; }
    public double getTemperatureSetpointIndex() { return temperatureSetpointIndex; } public void setTemperatureSetpointIndex(double v) { this.temperatureSetpointIndex = v; }
    public double getAgitationSetpointIndex() { return agitationSetpointIndex; } public void setAgitationSetpointIndex(double v) { this.agitationSetpointIndex = v; }
    public double getGasTransferSetpointIndex() { return gasTransferSetpointIndex; } public void setGasTransferSetpointIndex(double v) { this.gasTransferSetpointIndex = v; }
    public double getTemperatureActualIndex() { return temperatureActualIndex; } public void setTemperatureActualIndex(double v) { this.temperatureActualIndex = v; }
    public double getAgitationActualIndex() { return agitationActualIndex; } public void setAgitationActualIndex(double v) { this.agitationActualIndex = v; }
    public double getGasTransferActualIndex() { return gasTransferActualIndex; } public void setGasTransferActualIndex(double v) { this.gasTransferActualIndex = v; }
    public double getQualityTrendIndex() { return qualityTrendIndex; } public void setQualityTrendIndex(double v) { this.qualityTrendIndex = v; }
    public int getAlarmCount() { return alarmCount; } public void setAlarmCount(int alarmCount) { this.alarmCount = alarmCount; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; } public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
