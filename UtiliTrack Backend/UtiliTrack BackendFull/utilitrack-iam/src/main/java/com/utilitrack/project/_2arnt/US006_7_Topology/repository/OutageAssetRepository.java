package com.utilitrack.project._2arnt.US006_7_Topology.repository;

import com.utilitrack.project._2arnt.US006_7_Topology.model.OutageAsset;
import com.utilitrack.project._2arnt.US006_7_Topology.model.OutageAsset.AssetStatus;
import com.utilitrack.project._2arnt.US006_7_Topology.model.OutageAsset.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OutageAssetRepository extends JpaRepository<OutageAsset, Long> {
    List<OutageAsset> findByStatus(AssetStatus status);
    List<OutageAsset> findByAssetType(AssetType assetType);
    List<OutageAsset> findByParentAssetId(Long parentAssetId);


    List<OutageAsset> findByParentAssetIdIsNull();
}