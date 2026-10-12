package sn.biosimlab.api.dto;
import jakarta.validation.constraints.Size;
import java.util.List;
public record ReleaseRequest(@Size(min=5, max=5) List<Boolean> checks, String justification) {}
