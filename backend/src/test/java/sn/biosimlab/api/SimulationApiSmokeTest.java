package sn.biosimlab.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import sn.biosimlab.api.dto.SimulationSnapshot;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SimulationApiSmokeTest {
    @Autowired private TestRestTemplate rest;

    @Test
    void healthEndpointResponds() {
        ResponseEntity<String> response = rest.getForEntity("/api/health", String.class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("BioSim Lab API"));
    }

    @Test
    void advancingScenarioPersistsTelemetry() {
        ResponseEntity<SimulationSnapshot> created = rest.postForEntity("/api/simulation/new?scenario=bioreactor", null, SimulationSnapshot.class);
        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        assertNotNull(created.getBody());
        rest.postForEntity("/api/simulation/start", null, SimulationSnapshot.class);
        ResponseEntity<SimulationSnapshot> advanced = rest.postForEntity("/api/simulation/advance", null, SimulationSnapshot.class);
        assertEquals(HttpStatus.OK, advanced.getStatusCode());
        assertNotNull(advanced.getBody());
        assertEquals(1, advanced.getBody().batch().getStep());
        assertEquals(1, advanced.getBody().telemetry().size());
    }
}
