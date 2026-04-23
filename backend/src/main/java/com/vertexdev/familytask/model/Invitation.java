package com.vertexdev.familytask.model;

import com.vertexdev.familytask.model.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID token;

    @Column(name = "invited_email", nullable = false)
    private String invitedEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(name = "expiration_date", nullable = false)
    private LocalDateTime expirationDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isAdmin = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isUsed = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
