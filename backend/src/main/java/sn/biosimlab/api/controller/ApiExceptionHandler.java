package sn.biosimlab.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String,String>> badRequest(IllegalArgumentException ex) { return ResponseEntity.badRequest().body(Map.of("error", safe(ex.getMessage()))); }
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String,String>> conflict(IllegalStateException ex) { return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", safe(ex.getMessage()))); }
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String,String>> notFound(NoSuchElementException ex) { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", safe(ex.getMessage()))); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,String>> validation(MethodArgumentNotValidException ex) { return ResponseEntity.badRequest().body(Map.of("error", "Les données saisies sont invalides. Vérifie les champs et réessaie.")); }
    private String safe(String message) { return message == null || message.isBlank() ? "Une erreur est survenue." : message; }
}
