package com.utilitrack.project._2arnt.US005_asset_registry.service;
import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.service.AuditService;
import com.utilitrack.project._2arnt.US005_asset_registry.dto.AssetResponse;
import com.utilitrack.project._2arnt.US005_asset_registry.dto.CreateAssetRequest;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.Asset;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.AssetStatus;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.AssetType;
import com.utilitrack.project._2arnt.US005_asset_registry.repository.AssetRegistryRepository;
import com.utilitrack.project.common.ConflictException;
import com.utilitrack.project.common.PagedResponse;
import com.utilitrack.project.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * US005: Asset Registration Service (TEAM-65)
 * - Unique serial number enforcement (409 on duplicate)
 * - Admin-only access enforced at controller level
 * - Filterable by type and status
 * - Audit log on every registration
 */
@Service("assetRegistryService")
@RequiredArgsConstructor
public class AssetService {

    private final AssetRegistryRepository assetRegistryRepository;
    private final AuditService auditService;

    @Transactional
    public AssetResponse registerAsset(CreateAssetRequest req, User actor) {
        if (assetRegistryRepository.existsBySerialNumber(req.getSerialNumber()))
            throw new ConflictException("Asset with serial number already exists: " + req.getSerialNumber());

        Asset asset = Asset.builder()
                .name(req.getName())
                .assetType(req.getAssetType())
                .serialNumber(req.getSerialNumber().toUpperCase())
                .location(req.getLocation())
                .installationDate(req.getInstallationDate())
                .description(req.getDescription())
                .status(AssetStatus.ACTIVE)
                .registeredBy(actor)
                .build();

        Asset saved = assetRegistryRepository.save(asset);

        auditService.log(actor.getId(), actor.getEmail(), "REGISTER_ASSET",
                "Asset#" + saved.getSerialNumber(),
                "{\"assetId\":" + saved.getId() + ",\"type\":\"" + saved.getAssetType() + "\"}");

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<AssetResponse> listAssets(AssetType type, AssetStatus status, Pageable pageable) {
        return PagedResponse.from(
                assetRegistryRepository.findWithFilters(type, status, pageable),
                this::toResponse);
    }

    // Method name matches exactly what AssetController calls
    @Transactional(readOnly = true)
    public AssetResponse getById(Long id) {
        return toResponse(assetRegistryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + id)));
    }

    private AssetResponse toResponse(Asset a) {
        return AssetResponse.builder()
                .id(a.getId())
                .name(a.getName())
                .assetType(a.getAssetType())
                .serialNumber(a.getSerialNumber())
                .location(a.getLocation())
                .installationDate(a.getInstallationDate())
                .status(a.getStatus())
                .description(a.getDescription())
                .registeredBy(a.getRegisteredBy() != null ? a.getRegisteredBy().getEmail() : null)
                .createdAt(a.getCreatedAt())
                .build();
    }
}
