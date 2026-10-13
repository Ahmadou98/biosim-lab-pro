package sn.biosimlab.api;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class DatabaseConfiguration {
    @Bean
    @Primary
    public DataSource dataSource(Environment environment) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.isBlank()) {
            return postgresDataSource(databaseUrl.trim());
        }

        // Local/development fallback. Hosted production should set DATABASE_URL to managed PostgreSQL.
        String jdbcUrl = environment.getProperty(
                "spring.datasource.url",
                "jdbc:h2:file:./biosimlab;MODE=MySQL;AUTO_SERVER=TRUE");
        String username = environment.getProperty("spring.datasource.username", "sa");
        String password = environment.getProperty("spring.datasource.password", "");
        String driver = environment.getProperty("spring.datasource.driver-class-name", "org.h2.Driver");
        HikariConfig config = basePool();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driver);
        return new HikariDataSource(config);
    }

    private DataSource postgresDataSource(String connectionString) {
        try {
            String normalized = connectionString.startsWith("postgres://")
                    ? "postgresql://" + connectionString.substring("postgres://".length())
                    : connectionString;
            URI uri = URI.create(normalized);
            if (!"postgresql".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                    || uri.getRawUserInfo() == null || uri.getRawPath() == null
                    || uri.getRawPath().length() < 2) {
                throw new IllegalArgumentException("La chaîne DATABASE_URL n'est pas une URL PostgreSQL valide.");
            }

            String[] credentials = uri.getRawUserInfo().split(":", 2);
            if (credentials.length != 2) {
                throw new IllegalArgumentException("DATABASE_URL doit contenir un utilisateur et un mot de passe.");
            }
            String username = decode(credentials[0]);
            String password = decode(credentials[1]);

            StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                    .append(uri.getHost());
            if (uri.getPort() > 0) {
                jdbcUrl.append(':').append(uri.getPort());
            }
            jdbcUrl.append(uri.getRawPath());

            String query = uri.getRawQuery();
            boolean renderHost = uri.getHost().endsWith(".render.com")
                    || uri.getHost().endsWith(".onrender.com");
            if (query == null || query.isBlank()) {
                if (renderHost) jdbcUrl.append("?sslmode=require");
            } else {
                jdbcUrl.append('?').append(query);
                if (renderHost && !query.toLowerCase().contains("sslmode=")) {
                    jdbcUrl.append("&sslmode=require");
                }
            }

            HikariConfig config = basePool();
            config.setJdbcUrl(jdbcUrl.toString());
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName("org.postgresql.Driver");
            return new HikariDataSource(config);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "DATABASE_URL existe mais n'est pas valide. Vérifie la chaîne PostgreSQL configurée dans l'hébergeur.",
                    exception);
        }
    }

    private HikariConfig basePool() {
        HikariConfig config = new HikariConfig();
        config.setPoolName("BioSimLabPool");
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(0);
        config.setConnectionTimeout(10_000);
        config.setValidationTimeout(5_000);
        return config;
    }

    private String decode(String raw) {
        // Preserve literal plus signs in credentials; URLDecoder otherwise interprets them as spaces.
        return URLDecoder.decode(raw.replace("+", "%2B"), StandardCharsets.UTF_8);
    }
}
