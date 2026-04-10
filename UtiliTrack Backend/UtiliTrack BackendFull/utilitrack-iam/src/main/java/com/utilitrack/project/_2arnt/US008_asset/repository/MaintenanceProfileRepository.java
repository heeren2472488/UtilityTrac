package com.utilitrack.project._2arnt.US008_asset.repository;

import com.utilitrack.project._2arnt.US008_asset.entity.MaintenanceProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceProfileRepository extends JpaRepository<MaintenanceProfile, Long> {

    /**
     * Find all profiles for a specific asset
     */
    List<MaintenanceProfile> findByAssetIdAndStatus(Long assetId, MaintenanceProfile.ProfileStatus status);

    /**
     * Find all profiles for a specific asset
     */
    List<MaintenanceProfile> findByAssetId(Long assetId);

    /**
     * Find active profiles for an asset with pagination
     */
    Page<MaintenanceProfile> findByAssetIdAndStatusOrderByCreatedAtDesc(
        Long assetId,
        MaintenanceProfile.ProfileStatus status,
        Pageable pageable
    );

    /**
     * Find profiles by maintenance type
     */
    List<MaintenanceProfile> findByMaintenanceTypeAndStatus(
        MaintenanceProfile.MaintenanceType type,
        MaintenanceProfile.ProfileStatus status
    );

    /**
     * Find profile templates
     */
    List<MaintenanceProfile> findByIsTemplateAndStatus(
        Boolean isTemplate,
        MaintenanceProfile.ProfileStatus status
    );

    /**
     * Find profile by name for a specific asset
     */
    Optional<MaintenanceProfile> findByAssetIdAndProfileNameIgnoreCase(Long assetId, String profileName);

    /**
     * Find profiles due for execution
     */
    @Query("SELECT mp FROM MaintenanceProfile mp WHERE mp.nextScheduled <= :dateTime AND mp.status = 'ACTIVE'")
    List<MaintenanceProfile> findDueForExecution(@Param("dateTime") LocalDateTime dateTime);

    /**
     * Find profiles created by specific user
     */
    Page<MaintenanceProfile> findByCreatedByOrderByCreatedAtDesc(String createdBy, Pageable pageable);

    /**
     * Count active profiles for an asset
     */
    long countByAssetIdAndStatus(Long assetId, MaintenanceProfile.ProfileStatus status);

    /**
     * Find standardized profiles across system
     */
    @Query("SELECT mp FROM MaintenanceProfile mp WHERE mp.isTemplate = true AND mp.status = 'TEMPLATE' ORDER BY mp.createdAt DESC")
    List<MaintenanceProfile> findStandardizedProfiles();

    /**
     * Find profiles with specific skill requirements
     */
    @Query("SELECT mp FROM MaintenanceProfile mp WHERE mp.skillRequirements LIKE %:skill% AND mp.status = 'ACTIVE'")
    List<MaintenanceProfile> findBySkillRequirement(@Param("skill") String skill);
}
