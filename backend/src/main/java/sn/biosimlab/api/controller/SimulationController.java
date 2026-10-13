package sn.biosimlab.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sn.biosimlab.api.dto.*;
import sn.biosimlab.api.service.SimulationService;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SimulationController {
    private final SimulationService service;

    public SimulationController(SimulationService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public Health health() {
        return new Health("ok", "BioSim Lab API", "Données de simulation fictives");
    }

    @GetMapping("/dashboard")
    public DashboardSummary dashboard(@RequestHeader("X-Client-Id") UUID clientId) {
        return service.dashboard(clientId.toString());
    }

    @GetMapping("/simulation/state")
    public SimulationSnapshot state(@RequestHeader("X-Client-Id") UUID clientId) {
        return service.state(clientId.toString());
    }

    @PostMapping("/simulation/new")
    @ResponseStatus(HttpStatus.CREATED)
    public SimulationSnapshot newBatch(
            @RequestParam(defaultValue = "bioreactor") String scenario,
            @RequestHeader("X-Client-Id") UUID clientId) {
        return service.newBatch(scenario, clientId.toString());
    }

    @PostMapping("/simulation/start")
    public SimulationSnapshot start(@RequestHeader("X-Client-Id") UUID clientId) {
        return service.start(clientId.toString());
    }

    @PostMapping("/simulation/pause")
    public SimulationSnapshot pause(@RequestHeader("X-Client-Id") UUID clientId) {
        return service.pause(clientId.toString());
    }

    @PostMapping("/simulation/advance")
    public SimulationSnapshot advance(@RequestHeader("X-Client-Id") UUID clientId) {
        return service.advance(clientId.toString());
    }

    @PostMapping("/simulation/parameters")
    public SimulationSnapshot parameters(
            @Valid @RequestBody ParameterRequest request,
            @RequestHeader("X-Client-Id") UUID clientId) {
        return service.updateParameters(request, clientId.toString());
    }

    @PostMapping("/quality-tests")
    public SimulationSnapshot runTest(
            @Valid @RequestBody TestRequest request,
            @RequestHeader("X-Client-Id") UUID clientId) {
        return service.runTest(request, clientId.toString());
    }

    @PostMapping("/deviations")
    public SimulationSnapshot createDeviation(
            @Valid @RequestBody DeviationRequest request,
            @RequestHeader("X-Client-Id") UUID clientId) {
        return service.createDeviation(request, clientId.toString());
    }

    @PatchMapping("/deviations/{id}")
    public SimulationSnapshot updateDeviation(
            @PathVariable long id,
            @Valid @RequestBody DeviationStatusRequest request,
            @RequestHeader("X-Client-Id") UUID clientId) {
        return service.updateDeviationStatus(id, request, clientId.toString());
    }

    @PostMapping("/release-review")
    public ReleaseResult review(
            @Valid @RequestBody ReleaseRequest request,
            @RequestHeader("X-Client-Id") UUID clientId) {
        return service.reviewAndDisposition(request, clientId.toString());
    }

    public record Health(String status, String service, String dataNotice) {}
}
