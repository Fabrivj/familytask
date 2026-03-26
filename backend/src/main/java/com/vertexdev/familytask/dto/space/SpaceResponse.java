package com.vertexdev.familytask.dto.space;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SpaceResponse {

    private Long id;
    private String name;
    private String type;
    private Long createdById;
    private String createdByName;
    private String createdAt;
    private String updatedAt;
}
