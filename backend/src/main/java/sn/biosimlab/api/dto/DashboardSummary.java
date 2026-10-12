package sn.biosimlab.api.dto;
public record DashboardSummary(String batchCode, String status, int progressPercent, int completedSteps, int totalSteps, int alarmCount, int testsExecuted, int testsPassed, int openDeviations, double qualityTrendIndex) {}
