package com.utilitrack.project._2arnt.US008_asset.service;

import com.utilitrack.project._2arnt.US008_asset.dto.MaintenanceProfileDTO;
import com.utilitrack.project._2arnt.US008_asset.entity.MaintenanceProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface IMaintenanceProfileService {
    List<MaintenanceProfileDTO> getAllProfiles();


    /**
     * Create a new maintenance profile
     * @param dto Profile details
     * @param createdBy User creating the profile
     * @return Created profile DTO
     */
    MaintenanceProfileDTO createProfile(MaintenanceProfileDTO dto, String createdBy);

    /**
     * Update an existing maintenance profile
     * @param id Profile ID
     * @param dto Updated profile details
     * @param updatedBy User updating the profile
     * @return Updated profile DTO
     */
    MaintenanceProfileDTO updateProfile(Long id, MaintenanceProfileDTO dto, String updatedBy);

    /**
     * Get profile by ID
     * @param id Profile ID
     * @return Profile DTO
     */
    Optional<MaintenanceProfileDTO> getProfileById(Long id);

    /**
     * Get all profiles for an asset
     * @param assetId Asset ID
     * @return List of profile DTOs
     */
    List<MaintenanceProfileDTO> getProfilesByAssetId(Long assetId);

    /**
     * Get active profiles for an asset with pagination
     * @param assetId Asset ID
     * @param pageable Pagination info
     * @return Page of profile DTOs
     */
    Page<MaintenanceProfileDTO> getActiveProfilesByAssetId(Long assetId, Pageable pageable);

    /**
     * Get profiles by maintenance type
     * @param type Maintenance type
     * @return List of profile DTOs
     */
    List<MaintenanceProfileDTO> getProfilesByMaintenanceType(MaintenanceProfile.MaintenanceType type);

    /**
     * Get standardized profiles (templates)
     * @return List of template profile DTOs
     */
    List<MaintenanceProfileDTO> getStandardizedProfiles();

    /**
     * Delete a profile
     * @param id Profile ID
     */
    void deleteProfile(Long id);

    /**
     * Activate a profile
     * @param id Profile ID
     * @return Updated profile DTO
     */
    MaintenanceProfileDTO activateProfile(Long id);

    /**
     * Deactivate a profile
     * @param id Profile ID
     * @return Updated profile DTO
     */
    MaintenanceProfileDTO deactivateProfile(Long id);

    /**
     * Create profile from template
     * @param templateId Template profile ID
     * @param assetId Target asset ID
     * @param createdBy User creating the profile
     * @return Created profile DTO
     */
    MaintenanceProfileDTO createProfileFromTemplate(Long templateId, Long assetId, String createdBy);

    /**
     * Get profiles due for execution
     * @return List of due profile DTOs
     */
    List<MaintenanceProfileDTO> getProfilesDueForExecution();

    /**
     * Record profile execution
     * @param id Profile ID
     */
    void recordProfileExecution(Long id);

    /**
     * Validate profile configuration
     * @param dto Profile to validate
     * @return Validation result
     */
    ValidationResult validateProfileConfiguration(MaintenanceProfileDTO dto);
}
