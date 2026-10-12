package sn.biosimlab.api.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "quality_tests")
public class QualityTest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 32) private String batchCode;
    @Column(nullable = false, length = 40) private String testId;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false) private double resultValue;
    @Column(nullable = false, length = 32) private String unit;
    @Column(nullable = false, length = 160) private String criterion;
    @Column(nullable = false, length = 24) private String resultStatus;
    @Column(nullable = false, length = 600) private String interpretation;
    private Instant createdAt = Instant.now();
    public QualityTest() {}
    public QualityTest(String batchCode, String testId, String name, double resultValue, String unit, String criterion, String resultStatus, String interpretation) { this.batchCode=batchCode;this.testId=testId;this.name=name;this.resultValue=resultValue;this.unit=unit;this.criterion=criterion;this.resultStatus=resultStatus;this.interpretation=interpretation; }
    public Long getId(){return id;} public String getBatchCode(){return batchCode;} public String getTestId(){return testId;} public String getName(){return name;} public double getResultValue(){return resultValue;} public String getUnit(){return unit;} public String getCriterion(){return criterion;} public String getResultStatus(){return resultStatus;} public String getInterpretation(){return interpretation;} public Instant getCreatedAt(){return createdAt;}
}
