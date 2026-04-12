package com.vertexdev.familytask.config;

import com.vertexdev.familytask.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BadgeSeeder implements CommandLineRunner {

    private final BadgeService badgeService;

    @Override
    public void run(String... args) {
        badgeService.seedBadges();
    }
}
