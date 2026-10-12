package sn.biosimlab.api.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import sn.biosimlab.api.model.TrainingDeviation;
import java.util.List;
public interface TrainingDeviationRepository extends JpaRepository<TrainingDeviation, Long> { List<TrainingDeviation> findByBatchCodeOrderByCreatedAtDesc(String batchCode); long countByBatchCodeAndStatusNot(String batchCode, String status); }
