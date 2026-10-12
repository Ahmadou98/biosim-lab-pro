# Build the web interface in the browser-compatible static format.
FROM node:22-alpine AS frontend-build
WORKDIR /ui
COPY frontend/package.json ./package.json
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Compile the Java/Spring Boot API and package the built UI inside the same JAR.
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /workspace
COPY backend/pom.xml ./pom.xml
RUN mvn -q -DskipTests dependency:go-offline
COPY backend/src ./src
COPY --from=frontend-build /ui/dist ./src/main/resources/static
RUN mvn -q -DskipTests package

# One web service = one Render web service, no separate DB/proxy needed for a demo.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend-build /workspace/target/biosim-lab-api-1.0.0.jar /app/app.jar
ENV SPRING_DATASOURCE_URL="jdbc:h2:mem:biosimlab;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
ENV SPRING_DATASOURCE_USERNAME="sa"
ENV SPRING_DATASOURCE_DRIVER="org.h2.Driver"
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
