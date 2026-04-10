package com.utilitrack.project._2arnt.US008_asset.service.impl;

import com.utilitrack.project._2arnt.US008_asset.dto.MaintenanceProfileDTO;
import com.utilitrack.project._2arnt.US008_asset.entity.MaintenanceProfile;
import com.utilitrack.project._2arnt.US008_asset.repository.MaintenanceProfileRepository;
import com.utilitrack.project._2arnt.US008_asset.service.IMaintenanceProfileService;
import com.utilitrack.project._2arnt.US008_asset.service.ValidationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MaintenanceProfileServiceImpl implements IMaintenanceProfileService {

    private final MaintenanceProfileRepository profileRepository;

    @Override
    @Transactional
    public MaintenanceProfileDTO createProfile(MaintenanceProfileDTO dto, String createdBy) {
        log.info("Creating maintenance profile for asset ID: {}", dto.getAssetId());

        // Validate profile configuration
        ValidationResult validation = validateProfileConfiguration(dto);
        if (!validation.isValid()) {
            log.error("Profile validation failed: {}", validation.getErrors());
            throw new IllegalArgumentException("Profile validation failed: " + validation.getErrors());
        }

        MaintenanceProfile profile = MaintenanceProfile.builder()
            .assetId(dto.getAssetId())
            .profileName(dto.getProfileName())
            .description(dto.getDescription())
            .maintenanceType(dto.getMaintenanceType())
            .frequencyDays(dto.getFrequencyDays())
            .estimatedDurationHours(dto.getEstimatedDurationHours())
            .requiredCrewSize(dto.getRequiredCrewSize())
            .skillRequirements(dto.getSkillRequirements())
            .partsRequired(dto.getPartsRequired())
            .estimatedCost(dto.getEstimatedCost())
            .status(MaintenanceProfile.ProfileStatus.ACTIVE)
            .isTemplate(dto.getIsTemplate() != null ? dto.getIsTemplate() : false)
            .templateName(dto.getTemplateName())
            .createdBy(createdBy)
            .nextScheduled(LocalDateTime.now().plusDays(dto.getFrequencyDays()))
            .build();

        MaintenanceProfile saved = profileRepository.save(profile);
        log.info("Maintenance profile created successfully with ID: {}", saved.getId());

        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public MaintenanceProfileDTO updateProfile(Long id, MaintenanceProfileDTO dto, String updatedBy) {
        log.info("Updating maintenance profile ID: {}", id);

        MaintenanceProfile profile = profileRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Profile not found with ID: {}", id);
                return new IllegalArgumentException("Profile not found with ID: " + id);
            });

        // Validate profile configuration
        ValidationResult validation = validateProfileConfiguration(dto);
        if (!validation.isValid()) {
            log.error("Profile validation failed: {}", validation.getErrors());
            throw new IllegalArgumentException("Profile validation failed: " + validation.getErrors());
        }

        profile.setProfileName(dto.getProfileName());
        profile.setDescription(dto.getDescription());
        profile.setMaintenanceType(dto.getMaintenanceType());
        profile.setFrequencyDays(dto.getFrequencyDays());
        profile.setEstimatedDurationHours(dto.getEstimatedDurationHours());
        profile.setRequiredCrewSize(dto.getRequiredCrewSize());
        profile.setSkillRequirements(dto.getSkillRequirements());
        profile.setPartsRequired(dto.getPartsRequired());
        profile.setEstimatedCost(dto.getEstimatedCost());
        profile.setUpdatedBy(updatedBy);

        MaintenanceProfile updated = profileRepository.save(profile);
        log.info("Maintenance profile updated successfully with ID: {}", updated.getId());

        return convertToDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MaintenanceProfileDTO> getProfileById(Long id) {
        log.debug("Fetching maintenance profile ID: {}", id);
        return profileRepository.findById(id).map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceProfileDTO> getProfilesByAssetId(Long assetId) {
        log.debug("Fetching all profiles for asset ID: {}", assetId);
        return profileRepository.findByAssetId(assetId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MaintenanceProfileDTO> getActiveProfilesByAssetId(Long assetId, Pageable pageable) {
        log.debug("Fetching active profiles for asset ID: {} with pagination", assetId);
        return profileRepository.findByAssetIdAndStatusOrderByCreatedAtDesc(
            assetId,
            MaintenanceProfile.ProfileStatus.ACTIVE,
            pageable
        ).map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceProfileDTO> getProfilesByMaintenanceType(MaintenanceProfile.MaintenanceType type) {
        log.debug("Fetching profiles by maintenance type: {}", type);
        return profileRepository.findByMaintenanceTypeAndStatus(type, MaintenanceProfile.ProfileStatus.ACTIVE)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceProfileDTO> getAllProfiles() {
        log.debug("Fetching all maintenance profiles");
        return profileRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceProfileDTO> getStandardizedProfiles() {
        log.debug("Fetching standardized maintenance profiles");
        return profileRepository.findStandardizedProfiles()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteProfile(Long id) {
        log.info("Deleting maintenance profile ID: {}", id);
        MaintenanceProfile profile = profileRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Profile not found with ID: {}", id);
                return new IllegalArgumentException("Profile not found with ID: " + id);
            });

        profile.setStatus(MaintenanceProfile.ProfileStatus.ARCHIVED);
        profileRepository.save(profile);
        log.info("Maintenance profile archived with ID: {}", id);
    }

    @Override
    @Transactional
    public MaintenanceProfileDTO activateProfile(Long id) {
        log.info("Activating maintenance profile ID: {}", id);
        MaintenanceProfile profile = profileRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Profile not found with ID: {}", id);
                return new IllegalArgumentException("Profile not found with ID: " + id);
            });

        profile.setStatus(MaintenanceProfile.ProfileStatus.ACTIVE);
        MaintenanceProfile updated = profileRepository.save(profile);
        log.info("Maintenance profile activated with ID: {}", updated.getId());

        return convertToDTO(updated);
    }

    @Override
    @Transactional
    public MaintenanceProfileDTO deactivateProfile(Long id) {
        log.info("Deactivating maintenance profile ID: {}", id);
        MaintenanceProfile profile = profileRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Profile not found with ID: {}", id);
                return new IllegalArgumentException("Profile not found with ID: " + id);
            });

        profile.setStatus(MaintenanceProfile.ProfileStatus.INACTIVE);
        MaintenanceProfile updated = profileRepository.save(profile);
        log.info("Maintenance profile deactivated with ID: {}", updated.getId());

        return convertToDTO(updated);
    }

    @Override
    @Transactional
    public MaintenanceProfileDTO createProfileFromTemplate(Long templateId, Long assetId, String createdBy) {
        log.info("Creating profile from template ID: {} for asset ID: {}", templateId, assetId);

        MaintenanceProfile template = profileRepository.findById(templateId)
            .orElseThrow(() -> {
                log.error("Template not found with ID: {}", templateId);
                return new IllegalArgumentException("Template not found with ID: " + templateId);
            });

        if (!template.getIsTemplate()) {
            log.error("Profile ID {} is not a template", templateId);
            throw new IllegalArgumentException("Profile is not a template");
        }

        MaintenanceProfile newProfile = MaintenanceProfile.builder()
            .assetId(assetId)
            .profileName(template.getProfileName())
            .description(template.getDescription())
            .maintenanceType(template.getMaintenanceType())
            .frequencyDays(template.getFrequencyDays())
            .estimatedDurationHours(template.getEstimatedDurationHours())
            .requiredCrewSize(template.getRequiredCrewSize())
            .skillRequirements(template.getSkillRequirements())
            .partsRequired(template.getPartsRequired())
            .estimatedCost(template.getEstimatedCost())
            .status(MaintenanceProfile.ProfileStatus.ACTIVE)
            .isTemplate(false)
            .createdBy(createdBy)
            .nextScheduled(LocalDateTime.now().plusDays(template.getFrequencyDays()))
            .build();

        MaintenanceProfile saved = profileRepository.save(newProfile);
        log.info("Profile created from template with ID: {}", saved.getId());

        return convertToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceProfileDTO> getProfilesDueForExecution() {
        log.debug("Fetching profiles due for execution");
        return profileRepository.findDueForExecution(LocalDateTime.now())
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void recordProfileExecution(Long id) {
        log.info("Recording execution for profile ID: {}", id);
        MaintenanceProfile profile = profileRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Profile not found with ID: {}", id);
                return new IllegalArgumentException("Profile not found with ID: " + id);
            });

        profile.setLastExecuted(LocalDateTime.now());
        profile.setNextScheduled(LocalDateTime.now().plusDays(profile.getFrequencyDays()));
        profileRepository.save(profile);
        log.info("Profile execution recorded with ID: {}", id);
    }

    @Override
    public ValidationResult validateProfileConfiguration(MaintenanceProfileDTO dto) {
        ValidationResult result = ValidationResult.success();

        if (dto.getAssetId() == null) {
            result.addError("Asset ID is required");
        }

        if (dto.getProfileName() == null || dto.getProfileName().trim().isEmpty()) {
            result.addError("Profile name is required");
        }

        if (dto.getMaintenanceType() == null) {
            result.addError("Maintenance type is required");
        }

        if (dto.getFrequencyDays() == null || dto.getFrequencyDays() <= 0) {
            result.addError("Frequency days must be greater than 0");
        }

        if (dto.getEstimatedDurationHours() == null || dto.getEstimatedDurationHours() <= 0) {
            result.addError("Estimated duration hours must be greater than 0");
        }

        if (dto.getRequiredCrewSize() == null || dto.getRequiredCrewSize() <= 0) {
            result.addError("Required crew size must be greater than 0");
        }

        if (dto.getEstimatedCost() == null || dto.getEstimatedCost() < 0) {
            result.addError("Estimated cost cannot be negative");
        }

        // Warnings for potential issues
        if (dto.getEstimatedDurationHours() > 24) {
            result.addWarning("Estimated duration exceeds 24 hours - consider breaking into multiple maintenance windows");
        }

        if (dto.getFrequencyDays() < 7) {
            result.addWarning("Maintenance frequency is less than 7 days - high frequency profile");
        }

        return result;
    }

    private MaintenanceProfileDTO convertToDTO(MaintenanceProfile profile) {
        return MaintenanceProfileDTO.builder()
            .id(profile.getId())
            .assetId(profile.getAssetId())
            .profileName(profile.getProfileName())
            .description(profile.getDescription())
            .maintenanceType(profile.getMaintenanceType())
            .frequencyDays(profile.getFrequencyDays())
            .estimatedDurationHours(profile.getEstimatedDurationHours())
            .requiredCrewSize(profile.getRequiredCrewSize())
            .skillRequirements(profile.getSkillRequirements())
            .partsRequired(profile.getPartsRequired())
            .estimatedCost(profile.getEstimatedCost())
            .status(profile.getStatus())
            .isTemplate(profile.getIsTemplate())
            .templateName(profile.getTemplateName())
            .createdBy(profile.getCreatedBy())
            .createdAt(profile.getCreatedAt())
            .updatedBy(profile.getUpdatedBy())
            .updatedAt(profile.getUpdatedAt())
            .lastExecuted(profile.getLastExecuted())
            .nextScheduled(profile.getNextScheduled())
            .isStandardized(profile.getIsTemplate())
            .build();
    }
}
