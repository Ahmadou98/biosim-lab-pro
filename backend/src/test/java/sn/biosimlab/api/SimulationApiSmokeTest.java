package sn.biosimlab.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import sn.biosimlab.api.dto.SimulationSnapshot;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
class SimulationApiSmokeTest {
    @Autowired
    private TestRestTemplate rest;

    @Test
    void healthEndpointResponds() {
        ResponseEntity<String> response = rest.getForEntity("/api/health", String.class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("BioSim Lab API"));
    }

    @Test
    void advancingScenarioPersistsTelemetryForItsBrowserWorkspace() {
        String clientId = UUID.randomUUID().toString();

        ResponseEntity<SimulationSnapshot> created = post(
                "/api/simulation/new?scenario=bioreactor", clientId, SimulationSnapshot.class);
        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        assertNotNull(created.getBody());

        ResponseEntity<SimulationSnapshot> started = post(
                "/api/simulation/start", clientId, SimulationSnapshot.class);
        assertEquals(HttpStatus.OK, started.getStatusCode());

        ResponseEntity<SimulationSnapshot> advanced = post(
                "/api/simulation/advance", clientId, SimulationSnapshot.class);
        assertEquals(HttpStatus.OK, advanced.getStatusCode());
        assertNotNull(advanced.getBody());
        assertEquals(1, advanced.getBody().batch().getStep());
        assertEquals(1, advanced.getBody().telemetry().size());
    }

    @Test
    void pausingAndResumingPreservesSimulationProgressAndTelemetry() {
        String clientId = UUID.randomUUID().toString();

        ResponseEntity<SimulationSnapshot> created = post(
                "/api/simulation/new?scenario=bioreactor", clientId, SimulationSnapshot.class);
        assertEquals(HttpStatus.CREATED, created.getStatusCode());

        ResponseEntity<SimulationSnapshot> started = post(
                "/api/simulation/start", clientId, SimulationSnapshot.class);
        assertEquals(HttpStatus.OK, started.getStatusCode());

        ResponseEntity<SimulationSnapshot> advanced = post(
                "/api/simulation/advance", clientId, SimulationSnapshot.class);
        assertEquals(HttpStatus.OK, advanced.getStatusCode());
        assertNotNull(advanced.getBody());
        assertEquals(1, advanced.getBody().batch().getStep());
        assertEquals(1, advanced.getBody().telemetry().size());

        ResponseEntity<SimulationSnapshot> paused = post(
                "/api/simulation/pause", clientId, SimulationSnapshot.class);
        assertEquals(HttpStatus.OK, paused.getStatusCode());
        assertNotNull(paused.getBody());
        assertEquals("PAUSED", paused.getBody().batch().getStatus().toString());
        assertEquals(1, paused.getBody().batch().getStep());
        assertEquals(1, paused.getBody().telemetry().size());

        ResponseEntity<SimulationSnapshot> resumed = post(
                "/api/simulation/start", clientId, SimulationSnapshot.class);
        assertEquals(HttpStatus.OK, resumed.getStatusCode());
        assertNotNull(resumed.getBody());
        assertEquals("RUNNING", resumed.getBody().batch().getStatus().toString());
        assertEquals(1, resumed.getBody().batch().getStep());
        assertEquals(1, resumed.getBody().telemetry().size());
    }

    @Test
    void browserWorkspacesDoNotShareTheActiveBatchOrTelemetry() {
        String learnerA = UUID.randomUUID().toString();
        String learnerB = UUID.randomUUID().toString();

        SimulationSnapshot createdForA = post(
                "/api/simulation/new?scenario=bioreactor", learnerA, SimulationSnapshot.class).getBody();
        assertNotNull(createdForA);

        SimulationSnapshot stateForB = get(
                "/api/simulation/state", learnerB, SimulationSnapshot.class).getBody();
        assertNotNull(stateForB);
        assertNotEquals(createdForA.batch().getBatchCode(), stateForB.batch().getBatchCode());
        assertEquals(0, stateForB.batch().getStep());
        assertTrue(stateForB.telemetry().isEmpty());

        post("/api/simulation/start", learnerA, SimulationSnapshot.class);
        post("/api/simulation/advance", learnerA, SimulationSnapshot.class);

        SimulationSnapshot stateForBAgain = get(
                "/api/simulation/state", learnerB, SimulationSnapshot.class).getBody();
        assertNotNull(stateForBAgain);
        assertEquals(0, stateForBAgain.batch().getStep());
        assertTrue(stateForBAgain.telemetry().isEmpty());
    }

    private HttpHeaders headers(String clientId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Client-Id", clientId);
        return headers;
    }

    private <T> ResponseEntity<T> get(String path, String clientId, Class<T> responseType) {
        HttpEntity<Void> entity = new HttpEntity<>(null, headers(clientId));
        return rest.exchange(path, HttpMethod.GET, entity, responseType);
    }

    private <T> ResponseEntity<T> post(String path, String clientId, Class<T> responseType) {
        HttpEntity<Void> entity = new HttpEntity<>(null, headers(clientId));
        return rest.exchange(path, HttpMethod.POST, entity, responseType);
    }
}
