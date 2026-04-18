package com.vertexdev.familytask.service.ai;

import org.springframework.stereotype.Component;

@Component
public class GamificationRules {

    public int calculateCoins(String complejidad) {
        return switch (normalize(complejidad)) {
            case "BAJA" -> 10;
            case "MEDIA" -> 20;
            case "ALTA" -> 30;
            default -> 10;
        };
    }

    public int calculateXp(String complejidad, String frecuencia, boolean involucreFamilia) {
        int base = switch (normalize(complejidad)) {
            case "BAJA" -> 25;
            case "MEDIA" -> 50;
            case "ALTA" -> 75;
            default -> 25;
        };

        if (isWeekly(frecuencia)) base += 15;
        if (involucreFamilia) base += 10;

        return base;
    }

    private boolean isWeekly(String frecuencia) {
        if (frecuencia == null) return false;
        return "WEEKLY".equalsIgnoreCase(frecuencia.trim());
    }

    private String normalize(String value) {
        if (value == null) return "";
        return value.trim().toUpperCase();
    }
}
