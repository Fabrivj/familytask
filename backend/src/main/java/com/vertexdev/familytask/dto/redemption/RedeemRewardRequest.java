package com.vertexdev.familytask.dto.redemption;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedeemRewardRequest {

    @NotNull(message = "El identificador de la recompensa es obligatorio.")
    private Long rewardId;

    @NotNull(message = "El identificador de la familia es obligatorio.")
    private Long familyId;
}
