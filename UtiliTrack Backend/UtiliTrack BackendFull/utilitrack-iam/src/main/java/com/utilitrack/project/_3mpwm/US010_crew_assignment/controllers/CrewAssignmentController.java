package com.utilitrack.project._3mpwm.US010_crew_assignment.controllers;

import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import com.utilitrack.project._3mpwm.US010_crew_assignment.dto.AssignCrewMemberRequest;
import com.utilitrack.project._3mpwm.US010_crew_assignment.dto.CrewDetailsResponse;
import com.utilitrack.project._3mpwm.US010_crew_assignment.dto.CrewListResponse;
import com.utilitrack.project._3mpwm.US010_crew_assignment.dto.CrewUpdateRequest;
import com.utilitrack.project.entity.Crew;
import com.utilitrack.project._3mpwm.US010_crew_assignment.service.CrewAssignmentService;
import com.utilitrack.project.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/work-orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CrewAssignmentController {

    private final CrewAssignmentService crewAssignmentService;

    /* =====================================================
       CREW ASSIGNMENT
       ===================================================== */

    @PostMapping("/{workOrderId}/assign-crew")
    @PreAuthorize("hasAnyRole('OPERATIONS PLANNER','ADMIN')")
    public ResponseEntity<ApiResponse<WorkOrder>> assignCrew(
            @PathVariable Long workOrderId,
            @RequestParam Long crewId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Crew assigned successfully.",
                        crewAssignmentService.assignCrewToWorkOrder(workOrderId, crewId)
                )
        );
    }

    @GetMapping("/{workOrderId}/crew")
    public ResponseEntity<ApiResponse<Crew>> getAssignedCrew(
            @PathVariable Long workOrderId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Assigned crew retrieved.",
                        crewAssignmentService.getAssignedCrew(workOrderId)
                )
        );
    }

    @DeleteMapping("/{workOrderId}/unassign-crew")
    @PreAuthorize("hasAnyRole('OPERATIONS PLANNER','ADMIN')")
    public ResponseEntity<ApiResponse<WorkOrder>> unassignCrew(
            @PathVariable Long workOrderId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Crew unassigned successfully.",
                        crewAssignmentService.unassignCrew(workOrderId)
                )
        );
    }

    /* =====================================================
       CREW MANAGEMENT
       ===================================================== */

    @PostMapping("/crews")
    @PreAuthorize("hasAnyRole('OPERATIONS PLANNER','ADMIN')")
    public ResponseEntity<ApiResponse<Crew>> createCrew(
            @RequestBody Crew crew) {

        return ResponseEntity.status(201)
                .body(ApiResponse.success(
                        "Crew created successfully.",
                        crewAssignmentService.createCrew(crew)
                ));
    }

    @PostMapping("/crews/{crewId}/members")
    @PreAuthorize("hasAnyRole('OPERATIONS PLANNER','ADMIN')")
    public ResponseEntity<ApiResponse<CrewDetailsResponse>> assignMemberToCrew(
            @PathVariable Long crewId,
            @Valid @RequestBody AssignCrewMemberRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Member assigned to crew successfully.",
                           crewAssignmentService.assignMemberToCrew(crewId, request.resolveMemberId())
                )
        );
    }

    @GetMapping("/crews/{crewId}")
    public ResponseEntity<ApiResponse<CrewDetailsResponse>> getCrewById(
            @PathVariable Long crewId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Crew details retrieved successfully.",
                        crewAssignmentService.getCrewById(crewId)
                )
        );
    }
    @PutMapping("/crews/{crewId}")
    @PreAuthorize("hasAnyRole('OPERATIONS_PLANNER','ADMIN')")
    public ResponseEntity<ApiResponse<Crew>> updateCrew(
            @PathVariable Long crewId,
            @RequestBody CrewUpdateRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Crew updated successfully.",
                        crewAssignmentService.updateCrew(crewId, request)
                )
        );
    }


    @GetMapping("/crews")
    public ResponseEntity<ApiResponse<?>> getAllCrews(
            @RequestParam(defaultValue = "false") boolean availableOnly,
            @RequestParam(defaultValue = "false") boolean includeSummary) {

        if (includeSummary) {
            CrewListResponse summary = crewAssignmentService.getCrewListSummary(availableOnly);
            return ResponseEntity.ok(
                    ApiResponse.success("Crews retrieved successfully.", summary)
            );
        }

        List<Crew> crews = crewAssignmentService.getAllCrews(availableOnly);
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Crews retrieved successfully.",
                        crews
                )
        );
    }

    @DeleteMapping("/crews/{crewId}")
    @PreAuthorize("hasAnyRole('OPERATIONS PLANNER','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCrew(
            @PathVariable Long crewId) {

        crewAssignmentService.deleteCrew(crewId);

        return ResponseEntity.ok(
                ApiResponse.success("Crew deleted successfully.", null)
        );
    }
}