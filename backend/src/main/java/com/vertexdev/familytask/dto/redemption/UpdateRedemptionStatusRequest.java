package com.vertexdev.familytask.dto.redemption;

import com.vertexdev.familytask.model.enums.RedemptionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRedemptionStatusRequest {

    @NotNull(message = "El identificador de la familia es obligatorio.")
    private Long familyId;

    @NotNull(message = "El estado del canje es obligatorio.")
    private RedemptionStatus status;
}
