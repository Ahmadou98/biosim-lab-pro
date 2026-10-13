package sn.biosimlab.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.biosimlab.api.dto.*;
import sn.biosimlab.api.model.*;
import sn.biosimlab.api.repository.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class SimulationService {
    private static final int TOTAL_STEPS = 12;
    private static final List<String> PHASES = List.of("Préparation & vérifications", "Démarrage de l'équipement", "Observation de la montée en régime", "Suivi des tendances", "Revue de fin de scénario");
    private final TrainingBatchRepository batches;
    private final SimulationEventRepository events;
    private final QualityTestRepository tests;
    private final TrainingDeviationRepository deviations;
    private final TelemetrySampleRepository telemetry;

    public SimulationService(TrainingBatchRepository batches, SimulationEventRepository events, QualityTestRepository tests, TrainingDeviationRepository deviations, TelemetrySampleRepository telemetry) {
        this.batches = batches; this.events = events; this.tests = tests; this.deviations = deviations; this.telemetry = telemetry;
    }

    @Transactional
    public SimulationSnapshot state(String clientId) { TrainingBatch batch = ensureBatch(clientId); return snapshot(batch); }

    @Transactional
    public SimulationSnapshot newBatch(String scenario, String clientId) {
        String safeScenario = Set.of("bioreactor", "purification", "fillfinish").contains(scenario) ? scenario : "bioreactor";
        TrainingBatch b = new TrainingBatch();
        b.setBatchCode("BS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        b.setOwnerSessionId(clientId); b.setScenario(safeScenario); b.setPhase("Mise en route"); b.setStatus(BatchStatus.READY);
        batches.save(b);
        event(b, "INFO", "SESSION", "Nouvelle session pédagogique créée. Toutes les valeurs sont fictives et normalisées sur une échelle de démonstration.");
        return snapshot(b);
    }

    @Transactional
    public SimulationSnapshot start(String clientId) {
        TrainingBatch b = ensureBatch(clientId);
        if (b.getStatus() == BatchStatus.SIMULATED_RELEASED) throw new IllegalStateException("Cette session est terminée. Crée une nouvelle session pour recommencer.");
        if (b.getStatus() == BatchStatus.AWAITING_QC) throw new IllegalStateException("Le scénario de procédé est terminé. Passe au laboratoire et à la revue de lot.");
        if (b.getStatus() != BatchStatus.RUNNING) { b.setStatus(BatchStatus.RUNNING); batches.save(b); event(b, "INFO", "PROCÉDÉ", "Simulation démarrée par l'apprenant."); }
        return snapshot(b);
    }

    @Transactional
    public SimulationSnapshot pause(String clientId) {
        TrainingBatch b = ensureBatch(clientId);
        if (b.getStatus() == BatchStatus.RUNNING) { b.setStatus(BatchStatus.PAUSED); batches.save(b); event(b, "INFO", "PROCÉDÉ", "Simulation mise en pause. Les données enregistrées sont conservées."); }
        return snapshot(b);
    }

    @Transactional
    public SimulationSnapshot advance(String clientId) {
        TrainingBatch b = ensureBatch(clientId);
        if (b.getStatus() == BatchStatus.SIMULATED_RELEASED) throw new IllegalStateException("La session est déjà terminée. Crée une nouvelle session.");
        if (b.getStatus() == BatchStatus.AWAITING_QC) throw new IllegalStateException("Le procédé est terminé. Les prochaines actions se trouvent au laboratoire et à la revue documentaire.");
        if (b.getStatus() != BatchStatus.RUNNING) b.setStatus(BatchStatus.RUNNING);
        int next = Math.min(TOTAL_STEPS, b.getStep() + 1); b.setStep(next); b.setProgressPercent((int)Math.round(next * 100.0 / TOTAL_STEPS));
        // Educational dynamics: normalized indices, not recipe or setpoint values for a real bioprocess.
        double phaseLag = Math.sin(next * 0.72) * 1.35;
        b.setTemperatureActualIndex(round1(b.getTemperatureActualIndex() + (b.getTemperatureSetpointIndex() - b.getTemperatureActualIndex()) * .48 + phaseLag));
        b.setAgitationActualIndex(round1(b.getAgitationActualIndex() + (b.getAgitationSetpointIndex() - b.getAgitationActualIndex()) * .52 + Math.cos(next * .6) * .9));
        b.setGasTransferActualIndex(round1(b.getGasTransferActualIndex() + (b.getGasTransferSetpointIndex() - b.getGasTransferActualIndex()) * .42 + Math.sin(next * .51) * 1.1));
        double deviation = Math.abs(b.getTemperatureActualIndex() - 52) + Math.abs(b.getAgitationActualIndex() - 50) + Math.abs(b.getGasTransferActualIndex() - 48);
        b.setQualityTrendIndex(round1(Math.max(61, Math.min(99, 99 - deviation * .19 - next * .16))));
        b.setPhase(PHASES.get(Math.min(PHASES.size()-1, (int)Math.floor((next-1) / 2.5))));
        batches.save(b);
        telemetry.save(new TelemetrySample(b.getBatchCode(), b.getStep(), b.getTemperatureActualIndex(), b.getAgitationActualIndex(), b.getGasTransferActualIndex(), b.getQualityTrendIndex()));
        event(b, "INFO", "TÉLÉMÉTRIE", "Pas simulé " + next + "/" + TOTAL_STEPS + " : tendances mises à jour et consignées.");
        checkPedagogicalAlarm(b);
        if (next >= TOTAL_STEPS) { b.setStatus(BatchStatus.AWAITING_QC); b.setPhase("Attente du contrôle qualité"); batches.save(b); event(b, "INFO", "PROCÉDÉ", "Fin du scénario dynamique. La revue qualité reste à réaliser."); }
        return snapshot(b);
    }

    @Transactional
    public SimulationSnapshot updateParameters(ParameterRequest request, String clientId) {
        TrainingBatch b = ensureBatch(clientId);
        if (b.getStatus() == BatchStatus.AWAITING_QC || b.getStatus() == BatchStatus.SIMULATED_RELEASED) throw new IllegalStateException("Les paramètres sont verrouillés après la fin du scénario. Crée une nouvelle session si nécessaire.");
        b.setTemperatureSetpointIndex(request.temperatureSetpointIndex());
        b.setAgitationSetpointIndex(request.agitationSetpointIndex());
        b.setGasTransferSetpointIndex(request.gasTransferSetpointIndex());
        batches.save(b);
        event(b, "INFO", "CONSIGNE SIMULÉE", "Indices pédagogiques modifiés par l'apprenant (échelle abstraite 0–100).");
        return snapshot(b);
    }

    @Transactional
    public SimulationSnapshot runTest(TestRequest request, String clientId) {
        TrainingBatch b = ensureBatch(clientId);
        if (b.getStep() < 3 && b.getStatus() != BatchStatus.AWAITING_QC) event(b, "WARN", "FORMATION", "Essai de laboratoire lancé avant la fin du scénario : il est permis pour apprendre, mais la revue finale restera bloquée tant que le procédé ne sera pas complet.");
        TestDefinition def = testDefinition(request.testId());
        double value = def.sampleValue();
        boolean conform = def.pass(value);
        String status = conform ? "CONFORME" : "HORS_LIMITE";
        String interpretation = conform ? def.goodText() : def.badText();
        QualityTest test = tests.save(new QualityTest(b.getBatchCode(), def.id(), def.name(), value, def.unit(), def.criterion(), status, interpretation));
        event(b, conform ? "INFO" : "ALARM", "CONTRÔLE QUALITÉ", def.name() + " : " + value + " " + def.unit() + " — " + (conform ? "critère fictif satisfait" : "hors limite simulé, investigation requise"));
        if (!conform) createAutoDeviation(b, "Résultat hors limite — " + def.name(), "MAJEURE", "Préserver ce résultat pédagogique, relire les données de l'exercice et documenter une investigation. Ne pas masquer ni supprimer le résultat initial.");
        batches.save(b);
        return snapshot(b);
    }

    @Transactional
    public SimulationSnapshot createDeviation(DeviationRequest request, String clientId) {
        TrainingBatch b = ensureBatch(clientId);
        String severity = normalizeSeverity(request.severity());
        TrainingDeviation d = new TrainingDeviation(b.getBatchCode(), request.title().trim(), severity, "OPEN", request.action().trim());
        deviations.save(d); event(b, "WARN", "DÉVIATION", "Événement " + d.getId() + " consigné : " + d.getTitle());
        return snapshot(b);
    }

    @Transactional
    public SimulationSnapshot updateDeviationStatus(long id, DeviationStatusRequest request, String clientId) {
        TrainingBatch b = ensureBatch(clientId);
        TrainingDeviation d = deviations.findById(id).orElseThrow(() -> new NoSuchElementException("Déviation introuvable."));
        if (!d.getBatchCode().equals(b.getBatchCode())) throw new NoSuchElementException("Cette déviation n'appartient pas à la session active.");
        String status = request.status().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("OPEN", "CAPA_IN_PROGRESS", "CLOSED").contains(status)) throw new IllegalArgumentException("Statut invalide.");
        d.setStatus(status); deviations.save(d); event(b, "INFO", "DÉVIATION", "Statut de l'événement " + id + " mis à jour : " + status + ".");
        return snapshot(b);
    }

    @Transactional
    public ReleaseResult reviewAndDisposition(ReleaseRequest request, String clientId) {
        TrainingBatch b = ensureBatch(clientId); List<String> blockers = new ArrayList<>();
        if (b.getStatus() != BatchStatus.AWAITING_QC) blockers.add("Le scénario de procédé doit être terminé avant la revue finale.");
        if (request.checks() == null || request.checks().size() != 5 || request.checks().stream().anyMatch(v -> !Boolean.TRUE.equals(v))) blockers.add("Les cinq éléments de la liste documentaire doivent être revus.");
        Map<String, QualityTest> latest = new HashMap<>();
        tests.findByBatchCodeOrderByCreatedAtDesc(b.getBatchCode()).forEach(t -> latest.putIfAbsent(t.getTestId(), t));
        List<TestDefinition> required = List.of(testDefinition("identity"), testDefinition("purity"), testDefinition("endotoxin"), testDefinition("closure"));
        for (TestDefinition td : required) {
            QualityTest t = latest.get(td.id());
            if (t == null) blockers.add("Essai non réalisé : " + td.name() + ".");
            else if (!"CONFORME".equals(t.getResultStatus())) blockers.add("Résultat hors limite à investiguer : " + td.name() + ".");
        }
        long open = deviations.countByBatchCodeAndStatusNot(b.getBatchCode(), "CLOSED");
        if (open > 0) blockers.add(open + " déviation(s) ne sont pas clôturées dans la simulation.");
        boolean passed = blockers.isEmpty();
        if (passed) { b.setStatus(BatchStatus.SIMULATED_RELEASED); b.setPhase("Exercice terminé — revue pédagogique"); batches.save(b); event(b, "INFO", "REVUE PÉDAGOGIQUE", "Tous les critères fictifs sont satisfaits. Fin de l'exercice uniquement, sans décision industrielle réelle."); }
        else event(b, "WARN", "REVUE PÉDAGOGIQUE", "Disposition calculée : EN ATTENTE. Prérequis non satisfaits : " + blockers.size() + ".");
        if (request.justification() != null && !request.justification().isBlank()) { String note = request.justification().trim(); event(b, "INFO", "NOTE DE REVUE", note.substring(0, Math.min(450, note.length()))); }
        return new ReleaseResult(passed, passed ? "SIMULATION_COMPLETE" : "EN_ATTENTE", blockers,
                passed ? "Les critères de cet exercice sont satisfaits. Cette conclusion n'a aucune valeur réglementaire ou industrielle." : "La simulation maintient la décision en attente jusqu'au traitement documenté des blocages.");
    }

    @Transactional
    public DashboardSummary dashboard(String clientId) {
        TrainingBatch b = ensureBatch(clientId); List<QualityTest> allTests = tests.findByBatchCodeOrderByCreatedAtDesc(b.getBatchCode());
        Set<String> seen = new HashSet<>(); int passed = 0, executed = 0;
        for (QualityTest t : allTests) if (seen.add(t.getTestId())) { executed++; if ("CONFORME".equals(t.getResultStatus())) passed++; }
        return new DashboardSummary(b.getBatchCode(), b.getStatus().name(), b.getProgressPercent(), b.getStep(), TOTAL_STEPS, b.getAlarmCount(), executed, passed, (int)deviations.countByBatchCodeAndStatusNot(b.getBatchCode(), "CLOSED"), b.getQualityTrendIndex());
    }

    private TrainingBatch ensureBatch(String clientId) {
        return batches.findTopByOwnerSessionIdOrderByCreatedAtDesc(clientId).orElseGet(() -> {
            TrainingBatch b = new TrainingBatch(); b.setOwnerSessionId(clientId); b.setBatchCode("BS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT)); b.setScenario("bioreactor"); b.setPhase("Mise en route");
            batches.save(b); event(b, "INFO", "SESSION", "Session d'apprentissage initialisée. Équipement virtuel, valeurs fictives."); return b;
        });
    }
    private SimulationSnapshot snapshot(TrainingBatch b) { return new SimulationSnapshot(b, events.findTop60ByBatchCodeOrderByCreatedAtDesc(b.getBatchCode()), tests.findByBatchCodeOrderByCreatedAtDesc(b.getBatchCode()), deviations.findByBatchCodeOrderByCreatedAtDesc(b.getBatchCode()), telemetry.findByBatchCodeOrderByStepNumberAsc(b.getBatchCode())); }
    private void event(TrainingBatch b, String severity, String category, String message) { events.save(new SimulationEvent(b.getBatchCode(), severity, category, message, b.getStep())); }
    private void checkPedagogicalAlarm(TrainingBatch b) {
        boolean outside = b.getTemperatureSetpointIndex() < 35 || b.getTemperatureSetpointIndex() > 70 || b.getAgitationSetpointIndex() < 30 || b.getAgitationSetpointIndex() > 72 || b.getGasTransferSetpointIndex() < 28 || b.getGasTransferSetpointIndex() > 68;
        if (outside) { b.setAlarmCount(b.getAlarmCount()+1); batches.save(b); event(b, "ALARM", "ALERTE DE SCÉNARIO", "Un indice sort de la zone pédagogique choisie. Vérifie la consigne et consigne l'événement si nécessaire. Ces bornes sont fictives."); }
    }
    private void createAutoDeviation(TrainingBatch b, String title, String severity, String action) { deviations.save(new TrainingDeviation(b.getBatchCode(), title, severity, "OPEN", action)); event(b, "WARN", "DÉVIATION AUTOMATIQUE", "Déviation ouverte automatiquement à partir d'un résultat hors limite simulé."); }
    private String normalizeSeverity(String severity) { String s=severity.toUpperCase(Locale.ROOT).trim(); return Set.of("MINEURE","MAJEURE","CRITIQUE").contains(s) ? s : "MAJEURE"; }
    private double round1(double v) { return Math.round(v*10.0)/10.0; }

    private TestDefinition testDefinition(String id) {
        return switch (id.toLowerCase(Locale.ROOT)) {
            case "identity" -> new TestDefinition("identity", "Signal d'identité relatif", "% relatif", "Plage fictive : 90–110 %", 90, 110, 94, 108, "Le signal simulé est dans la plage de l'exercice. Relie ce résultat à sa traçabilité.", "Le signal simulé est hors de la plage inventée. Préserve le résultat et ouvre une investigation pédagogique.");
            case "purity" -> new TestDefinition("purity", "Indice de profil/pureté", "indice relatif", "Cible fictive : ≥ 95", 95, 100, 92, 99, "Le profil fictif respecte le seuil pédagogique.", "Le profil fictif est sous le seuil de l'exercice. Une investigation doit être consignée.");
            case "endotoxin" -> new TestDefinition("endotoxin", "Indice endotoxines (proxy fictif)", "indice simulé", "Cible fictive : ≤ 35", 0, 35, 12, 48, "L'indice fictif est dans la plage d'acceptation de l'exercice. Ce n'est pas une mesure réelle d'endotoxines.", "L'indice fictif dépasse le seuil de l'exercice. Ce résultat n'est pas une donnée de contrôle réelle ; consigne une investigation pédagogique.");
            case "closure" -> new TestDefinition("closure", "Indice d'intégrité du contenant", "% relatif", "Cible fictive : ≥ 98 %", 98, 100, 96, 100, "L'indice fictif satisfait la règle de cet exercice.", "L'indice fictif est trop faible pour la règle de l'exercice. Maintiens la disposition en attente dans le scénario.");
            default -> throw new IllegalArgumentException("Essai inconnu. Essais proposés : identity, purity, endotoxin, closure.");
        };
    }
    private record TestDefinition(String id, String name, String unit, String criterion, double min, double max, double sampleMin, double sampleMax, String goodText, String badText) {
        double sampleValue() { return Math.round((ThreadLocalRandom.current().nextDouble(sampleMin, sampleMax + 0.01))*10.0)/10.0; }
        boolean pass(double value) { return value >= min && value <= max; }
    }
}
