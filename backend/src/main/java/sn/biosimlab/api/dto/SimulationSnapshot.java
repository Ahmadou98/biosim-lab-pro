package sn.biosimlab.api.dto;
import sn.biosimlab.api.model.*;
import java.util.List;
public record SimulationSnapshot(TrainingBatch batch, List<SimulationEvent> events, List<QualityTest> qualityTests, List<TrainingDeviation> deviations, List<TelemetrySample> telemetry) {}
