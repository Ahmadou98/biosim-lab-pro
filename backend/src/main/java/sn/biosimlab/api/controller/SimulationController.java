package sn.biosimlab.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sn.biosimlab.api.dto.*;
import sn.biosimlab.api.service.SimulationService;

@RestController
@RequestMapping("/api")
public class SimulationController {
    private final SimulationService service;
    public SimulationController(SimulationService service) { this.service = service; }

    @GetMapping("/health") public Health health() { return new Health("ok", "BioSim Lab API", "Données de simulation fictives"); }
    @GetMapping("/dashboard") public DashboardSummary dashboard() { return service.dashboard(); }
    @GetMapping("/simulation/state") public SimulationSnapshot state() { return service.state(); }
    @PostMapping("/simulation/new") @ResponseStatus(HttpStatus.CREATED) public SimulationSnapshot newBatch(@RequestParam(defaultValue="bioreactor") String scenario) { return service.newBatch(scenario); }
    @PostMapping("/simulation/start") public SimulationSnapshot start() { return service.start(); }
    @PostMapping("/simulation/pause") public SimulationSnapshot pause() { return service.pause(); }
    @PostMapping("/simulation/advance") public SimulationSnapshot advance() { return service.advance(); }
    @PostMapping("/simulation/parameters") public SimulationSnapshot parameters(@Valid @RequestBody ParameterRequest request) { return service.updateParameters(request); }
    @PostMapping("/quality-tests") public SimulationSnapshot runTest(@Valid @RequestBody TestRequest request) { return service.runTest(request); }
    @PostMapping("/deviations") public SimulationSnapshot createDeviation(@Valid @RequestBody DeviationRequest request) { return service.createDeviation(request); }
    @PatchMapping("/deviations/{id}") public SimulationSnapshot updateDeviation(@PathVariable long id, @Valid @RequestBody DeviationStatusRequest request) { return service.updateDeviationStatus(id, request); }
    @PostMapping("/release-review") public ReleaseResult review(@Valid @RequestBody ReleaseRequest request) { return service.reviewAndDisposition(request); }
    public record Health(String status, String service, String dataNotice) {}
}
