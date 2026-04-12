package com.vertexdev.familytask.service;

import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExperienceService {

    private final FamilyMemberRepository familyMemberRepository;

    /**
     * XP acumulada necesaria para alcanzar el nivel N.
     * Fórmula: 50 * N * (N - 1)
     *
     * Nivel 1 →    0 XP
     * Nivel 2 →  100 XP
     * Nivel 3 →  300 XP
     * Nivel 4 →  600 XP
     * Nivel 5 → 1000 XP
     */
    public int xpForLevel(int level) {
        return 50 * level * (level - 1);
    }

    /**
     * Calcula el nivel actual a partir del XP total acumulado.
     * Inverso de xpForLevel: level = floor((1 + sqrt(1 + 8*totalXp/100)) / 2), mínimo 1.
     */
    public int calculateLevel(int totalXp) {
        if (totalXp <= 0) return 1;
        int level = (int) Math.floor((1 + Math.sqrt(1 + 8.0 * totalXp / 100)) / 2);
        return Math.max(1, level);
    }

    /**
     * XP restante para subir al siguiente nivel desde el XP total actual.
     */
    public int xpToNextLevel(int totalXp) {
        int currentLevel = calculateLevel(totalXp);
        return xpForLevel(currentLevel + 1) - totalXp;
    }

    /**
     * Otorga XP y monedas al miembro, recalcula su nivel y persiste los cambios.
     *
     * @return AwardResult con el nivel anterior/nuevo y si hubo level-up
     */
    public AwardResult awardXpAndCoins(FamilyMember member, int xpAmount, int coinsAmount) {
        int previousLevel = member.getCurrentLevel();

        int newTotalXp = member.getTotalXp() + Math.max(0, xpAmount);
        int newTotalCoins = member.getTotalCoins() + Math.max(0, coinsAmount);
        int newLevel = calculateLevel(newTotalXp);

        member.setTotalXp(newTotalXp);
        member.setTotalCoins(newTotalCoins);
        member.setCurrentLevel(newLevel);
        familyMemberRepository.save(member);

        return new AwardResult(
                newTotalXp,
                newTotalCoins,
                newLevel,
                previousLevel,
                newLevel > previousLevel,
                xpToNextLevel(newTotalXp)
        );
    }

    public record AwardResult(
            int newTotalXp,
            int newTotalCoins,
            int newLevel,
            int previousLevel,
            boolean leveledUp,
            int xpToNextLevel
    ) {}
}
