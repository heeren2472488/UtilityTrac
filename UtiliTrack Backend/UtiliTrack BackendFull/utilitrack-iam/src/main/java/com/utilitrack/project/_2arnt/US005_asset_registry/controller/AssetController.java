package com.utilitrack.project._2arnt.US005_asset_registry.controller;

import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import com.utilitrack.project._2arnt.US005_asset_registry.dto.AssetResponse;
import com.utilitrack.project._2arnt.US005_asset_registry.dto.CreateAssetRequest;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.AssetStatus;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.AssetType;
import com.utilitrack.project._2arnt.US005_asset_registry.service.AssetService;
import com.utilitrack.project.common.ApiResponse;
import com.utilitrack.project.common.PagedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssetResponse>> register(
            @Valid @RequestBody CreateAssetRequest req,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(assetService.registerAsset(req, actor), "Asset registered successfully"));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<AssetResponse>>> list(
            @RequestParam(required = false) AssetType type,
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                assetService.listAssets(type, status,
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssetResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(assetService.getById(id)));
    }
}
