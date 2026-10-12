package sn.biosimlab.api.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import sn.biosimlab.api.model.TrainingBatch;
import java.util.Optional;
public interface TrainingBatchRepository extends JpaRepository<TrainingBatch, Long> { Optional<TrainingBatch> findTopByOrderByCreatedAtDesc(); Optional<TrainingBatch> findByBatchCode(String batchCode); }
