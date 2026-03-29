package com.vertexdev.familytask.mapper;

import com.vertexdev.familytask.dto.task.TaskResponse;
import com.vertexdev.familytask.model.Task;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "priority",             expression = "java(task.getPriority().name())")
    @Mapping(target = "homeSpaceId",          expression = "java(task.getHomeSpace().getId())")
    @Mapping(target = "homeSpaceName",        expression = "java(task.getHomeSpace().getName())")
    @Mapping(target = "homeSpaceType",        expression = "java(task.getHomeSpace().getType().name())")
    @Mapping(target = "assignedToId",         expression = "java(task.getAssignment() != null ? task.getAssignment().getUser().getId() : null)")
    @Mapping(target = "assignedToName",       expression = "java(task.getAssignment() != null ? task.getAssignment().getUser().getName() : null)")
    @Mapping(target = "assignedToPictureUrl", expression = "java(task.getAssignment() != null ? task.getAssignment().getUser().getPictureUrl() : null)")
    @Mapping(target = "status",               expression = "java(task.getAssignment() != null ? task.getAssignment().getStatus().name() : null)")
    TaskResponse toResponse(Task task);
}
