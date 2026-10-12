package sn.biosimlab.api.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record DeviationRequest(@NotBlank @Size(max=160) String title, @NotBlank String severity, @NotBlank @Size(max=800) String action) {}
