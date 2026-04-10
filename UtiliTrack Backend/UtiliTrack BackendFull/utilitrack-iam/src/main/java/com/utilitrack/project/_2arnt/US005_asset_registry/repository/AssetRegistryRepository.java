package com.utilitrack.project._2arnt.US005_asset_registry.repository;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.*;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.Asset;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.AssetStatus;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.AssetType;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
@Repository
public interface AssetRegistryRepository extends JpaRepository<Asset, Long> {
    boolean existsBySerialNumber(String serialNumber);
    @Query("SELECT a FROM Asset a WHERE " +
           "(:type IS NULL OR a.assetType = :type) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<Asset> findWithFilters(AssetType type, AssetStatus status, Pageable pageable);
}
