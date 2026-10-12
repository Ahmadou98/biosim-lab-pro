package sn.biosimlab.api.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import sn.biosimlab.api.model.QualityTest;
import java.util.List;
public interface QualityTestRepository extends JpaRepository<QualityTest, Long> { List<QualityTest> findByBatchCodeOrderByCreatedAtDesc(String batchCode); }
