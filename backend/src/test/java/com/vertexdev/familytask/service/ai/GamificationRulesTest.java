package com.vertexdev.familytask.service.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class GamificationRulesTest {

    private final GamificationRules rules = new GamificationRules();

    @ParameterizedTest
    @CsvSource({"Baja, 10", "Media, 20", "Alta, 30", "baja, 10", "ALTA, 30"})
    void calculateCoins_returnCorrectValue(String complejidad, int expected) {
        assertThat(rules.calculateCoins(complejidad)).isEqualTo(expected);
    }

    @Test
    void calculateCoins_unknownComplexity_defaultsToLowest() {
        assertThat(rules.calculateCoins("desconocido")).isEqualTo(10);
        assertThat(rules.calculateCoins(null)).isEqualTo(10);
    }

    @Test
    void calculateXp_bajaDaily_noFamily() {
        assertThat(rules.calculateXp("Baja", "DAILY", false)).isEqualTo(25);
    }

    @Test
    void calculateXp_mediaWeekly_noFamily() {
        assertThat(rules.calculateXp("Media", "WEEKLY", false)).isEqualTo(65);
    }

    @Test
    void calculateXp_altaDaily_withFamily() {
        assertThat(rules.calculateXp("Alta", "DAILY", true)).isEqualTo(85);
    }

    @Test
    void calculateXp_altaWeekly_withFamily() {
        assertThat(rules.calculateXp("Alta", "WEEKLY", true)).isEqualTo(100);
    }

    @Test
    void calculateXp_nullInputs_defaultsGracefully() {
        assertThat(rules.calculateXp(null, null, false)).isEqualTo(25);
    }
}
