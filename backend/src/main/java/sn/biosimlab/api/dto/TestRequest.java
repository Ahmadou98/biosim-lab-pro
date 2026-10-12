package sn.biosimlab.api.dto;
import jakarta.validation.constraints.NotBlank;
public record TestRequest(@NotBlank String testId) {}
