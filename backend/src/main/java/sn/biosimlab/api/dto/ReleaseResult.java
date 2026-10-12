package sn.biosimlab.api.dto;
import java.util.List;
public record ReleaseResult(boolean passed, String disposition, List<String> blockers, String message) {}
