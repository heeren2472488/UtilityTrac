package com.utilitrack.project._2arnt.US008_asset.controller;

import com.utilitrack.project._2arnt.US008_asset.dto.MaintenanceProfileDTO;
import com.utilitrack.project._2arnt.US008_asset.entity.MaintenanceProfile;
import com.utilitrack.project._2arnt.US008_asset.service.IMaintenanceProfileService;
import com.utilitrack.project._2arnt.US008_asset.service.ValidationResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/us008/maintenance-profiles")
@RequiredArgsConstructor
@Slf4j
public class MaintenanceProfileController {

    private final IMaintenanceProfileService profileService;
    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATIONS PLANNER','PLANNER','ADMIN')")
    public ResponseEntity<List<MaintenanceProfileDTO>> getAllProfiles() {
        log.debug("Fetching all maintenance profiles");
        List<MaintenanceProfileDTO> profiles = profileService.getAllProfiles();
        return ResponseEntity.ok(profiles);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceProfileDTO> createProfile(
        @Valid @RequestBody MaintenanceProfileDTO dto,
        @RequestHeader(value = "X-User-ID", required = false) String userId) {
        
        log.info("Creating maintenance profile for asset: {} by user: {}", dto.getAssetId(), userId);
        String createdBy = userId != null ? userId : "SYSTEM";
        
        MaintenanceProfileDTO created = profileService.createProfile(dto, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceProfileDTO> updateProfile(
        @PathVariable Long id,
        @Valid @RequestBody MaintenanceProfileDTO dto,
        @RequestHeader(value = "X-User-ID", required = false) String userId) {
        
        log.info("Updating maintenance profile ID: {} by user: {}", id, userId);
        String updatedBy = userId != null ? userId : "SYSTEM";
        
        MaintenanceProfileDTO updated = profileService.updateProfile(id, dto, updatedBy);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PLANNER', 'TECHNICIAN')")
    public ResponseEntity<MaintenanceProfileDTO> getProfile(@PathVariable Long id) {
        log.debug("Fetching maintenance profile ID: {}", id);
        return profileService.getProfileById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/asset/{assetId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PLANNER', 'TECHNICIAN')")
    public ResponseEntity<List<MaintenanceProfileDTO>> getProfilesByAsset(@PathVariable Long assetId) {
        log.debug("Fetching profiles for asset ID: {}", assetId);
        List<MaintenanceProfileDTO> profiles = profileService.getProfilesByAssetId(assetId);
        return ResponseEntity.ok(profiles);
    }

    @GetMapping("/asset/{assetId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'PLANNER', 'TECHNICIAN')")
    public ResponseEntity<Page<MaintenanceProfileDTO>> getActiveProfilesByAsset(
        @PathVariable Long assetId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        
        log.debug("Fetching active profiles for asset ID: {} - Page: {}, Size: {}", assetId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<MaintenanceProfileDTO> profiles = profileService.getActiveProfilesByAssetId(assetId, pageable);
        return ResponseEntity.ok(profiles);
    }

    @GetMapping("/by-type/{maintenanceType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PLANNER', 'TECHNICIAN')")
    public ResponseEntity<List<MaintenanceProfileDTO>> getProfilesByType(
        @PathVariable MaintenanceProfile.MaintenanceType maintenanceType) {
        
        log.debug("Fetching profiles by type: {}", maintenanceType);
        List<MaintenanceProfileDTO> profiles = profileService.getProfilesByMaintenanceType(maintenanceType);
        return ResponseEntity.ok(profiles);
    }

    @GetMapping("/templates/standardized")
    @PreAuthorize("hasAnyRole('ADMIN', 'PLANNER')")
    public ResponseEntity<List<MaintenanceProfileDTO>> getStandardizedProfiles() {
        log.debug("Fetching standardized maintenance profiles");
        List<MaintenanceProfileDTO> profiles = profileService.getStandardizedProfiles();
        return ResponseEntity.ok(profiles);
    }

    @PostMapping("/{templateId}/from-template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceProfileDTO> createFromTemplate(
        @PathVariable Long templateId,
        @RequestParam Long assetId,
        @RequestHeader(value = "X-User-ID", required = false) String userId) {
        
        log.info("Creating profile from template ID: {} for asset: {} by user: {}", templateId, assetId, userId);
        String createdBy = userId != null ? userId : "SYSTEM";
        
        MaintenanceProfileDTO created = profileService.createProfileFromTemplate(templateId, assetId, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceProfileDTO> activateProfile(@PathVariable Long id) {
        log.info("Activating maintenance profile ID: {}", id);
        MaintenanceProfileDTO activated = profileService.activateProfile(id);
        return ResponseEntity.ok(activated);
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceProfileDTO> deactivateProfile(@PathVariable Long id) {
        log.info("Deactivating maintenance profile ID: {}", id);
        MaintenanceProfileDTO deactivated = profileService.deactivateProfile(id);
        return ResponseEntity.ok(deactivated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long id) {
        log.info("Deleting maintenance profile ID: {}", id);
        profileService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/validate-configuration")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ValidationResult> validateConfiguration(@Valid @RequestBody MaintenanceProfileDTO dto) {
        log.debug("Validating profile configuration");
        ValidationResult result = profileService.validateProfileConfiguration(dto);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/due-for-execution")
    @PreAuthorize("hasAnyRole('ADMIN', 'PLANNER', 'TECHNICIAN')")
    public ResponseEntity<List<MaintenanceProfileDTO>> getDueForExecution() {
        log.debug("Fetching profiles due for execution");
        List<MaintenanceProfileDTO> profiles = profileService.getProfilesDueForExecution();
        return ResponseEntity.ok(profiles);
    }

    @PostMapping("/{id}/record-execution")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<Map<String, String>> recordExecution(@PathVariable Long id) {
        log.info("Recording execution for profile ID: {}", id);
        profileService.recordProfileExecution(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Profile execution recorded successfully");
        response.put("profileId", id.toString());
        
        return ResponseEntity.ok(response);
    }
}
