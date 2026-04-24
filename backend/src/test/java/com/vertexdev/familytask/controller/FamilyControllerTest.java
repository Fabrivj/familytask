package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.family.CreateFamilyRequest;
import com.vertexdev.familytask.dto.family.FamilyMembersResponse;
import com.vertexdev.familytask.dto.family.FamilyResponse;
import com.vertexdev.familytask.dto.family.MemberItemResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.FamilyGroupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FamilyControllerTest {

    @Mock private FamilyGroupService familyGroupService;
    @InjectMocks private FamilyController familyController;

    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .email("padre@familia.com")
                .name("Padre Test")
                .googleId("google-789")
                .build();
    }

    @Test
    void createFamily_returnsOk_withFamilyResponse() {
        CreateFamilyRequest request = new CreateFamilyRequest();
        request.setName("Familia García");
        FamilyResponse expected = FamilyResponse.builder()
                .id(10L).name("Familia García").role("PARENT").build();
        when(familyGroupService.createFamily(request, authenticatedUser)).thenReturn(expected);

        ResponseEntity<FamilyResponse> response = familyController.createFamily(request, authenticatedUser);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getId()).isEqualTo(10L);
        assertThat(response.getBody().getName()).isEqualTo("Familia García");
        verify(familyGroupService).createFamily(request, authenticatedUser);
    }

    @Test
    void getMembers_returnsOk_withMembersResponse() {
        MemberItemResponse member = MemberItemResponse.builder()
                .id(1L).name("Padre Test").email("padre@familia.com").role("PARENT").build();
        FamilyMembersResponse expected = FamilyMembersResponse.builder()
                .members(List.of(member))
                .pendingInvitations(List.of())
                .build();
        when(familyGroupService.getMembers(10L, authenticatedUser)).thenReturn(expected);

        ResponseEntity<FamilyMembersResponse> response = familyController.getMembers(10L, authenticatedUser);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getMembers()).hasSize(1);
        assertThat(response.getBody().getMembers().get(0).getRole()).isEqualTo("PARENT");
        verify(familyGroupService).getMembers(10L, authenticatedUser);
    }

    @Test
    void getRanking_returnsOk_withRankedMemberList() {
        List<MemberItemResponse> ranking = List.of(
                MemberItemResponse.builder().id(1L).name("Hijo Top").totalXp(500).currentLevel(3).build(),
                MemberItemResponse.builder().id(2L).name("Hijo Segundo").totalXp(200).currentLevel(1).build()
        );
        when(familyGroupService.getRanking(10L, authenticatedUser)).thenReturn(ranking);

        ResponseEntity<List<MemberItemResponse>> response = familyController.getRanking(10L, authenticatedUser);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getTotalXp()).isEqualTo(500);
        verify(familyGroupService).getRanking(10L, authenticatedUser);
    }
}
