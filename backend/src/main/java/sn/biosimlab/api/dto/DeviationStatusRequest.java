package sn.biosimlab.api.dto;
import jakarta.validation.constraints.NotBlank;
public record DeviationStatusRequest(@NotBlank String status) {}
