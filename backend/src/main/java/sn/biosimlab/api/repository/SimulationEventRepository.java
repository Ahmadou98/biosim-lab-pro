package sn.biosimlab.api.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import sn.biosimlab.api.model.SimulationEvent;
import java.util.List;
public interface SimulationEventRepository extends JpaRepository<SimulationEvent, Long> { List<SimulationEvent> findTop60ByBatchCodeOrderByCreatedAtDesc(String batchCode); long countByBatchCodeAndSeverity(String batchCode, String severity); }
