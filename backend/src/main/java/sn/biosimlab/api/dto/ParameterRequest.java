package sn.biosimlab.api.dto;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
public record ParameterRequest(
    @DecimalMin("0.0") @DecimalMax("100.0") double temperatureSetpointIndex,
    @DecimalMin("0.0") @DecimalMax("100.0") double agitationSetpointIndex,
    @DecimalMin("0.0") @DecimalMax("100.0") double gasTransferSetpointIndex
) {}
