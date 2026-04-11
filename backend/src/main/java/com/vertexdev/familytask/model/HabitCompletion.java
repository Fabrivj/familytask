package com.vertexdev.familytask.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "habit_completions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"habit_assignment_id", "completion_date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_assignment_id", nullable = false)
    private HabitAssignment habitAssignment;

    @Column(name = "completion_date", nullable = false)
    private LocalDate completionDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
