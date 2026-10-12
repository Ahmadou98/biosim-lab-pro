package sn.biosimlab.api.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import sn.biosimlab.api.model.TelemetrySample;
import java.util.List;
public interface TelemetrySampleRepository extends JpaRepository<TelemetrySample, Long> { List<TelemetrySample> findByBatchCodeOrderByStepNumberAsc(String batchCode); }
