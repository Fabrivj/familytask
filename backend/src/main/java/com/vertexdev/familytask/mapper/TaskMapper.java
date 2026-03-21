package com.vertexdev.familytask.mapper;

import com.vertexdev.familytask.dto.task.TaskResponse;
import com.vertexdev.familytask.model.Task;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "priority",             expression = "java(task.getPriority().name())")
    @Mapping(target = "status",               expression = "java(task.getStatus().name())")
    @Mapping(target = "assignedToId",         expression = "java(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)")
    @Mapping(target = "assignedToName",       expression = "java(task.getAssignedTo() != null ? task.getAssignedTo().getName() : null)")
    @Mapping(target = "assignedToPictureUrl", expression = "java(task.getAssignedTo() != null ? task.getAssignedTo().getPictureUrl() : null)")
    TaskResponse toResponse(Task task);
}
