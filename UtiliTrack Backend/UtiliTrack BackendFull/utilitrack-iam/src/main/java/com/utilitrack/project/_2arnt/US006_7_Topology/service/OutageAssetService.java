package com.utilitrack.project._2arnt.US006_7_Topology.service;

import com.utilitrack.project._2arnt.US006_7_Topology.model.OutageAsset;
import com.utilitrack.project._2arnt.US006_7_Topology.model.TopologyLink;
import com.utilitrack.project._2arnt.US006_7_Topology.repository.OutageAssetRepository;
import com.utilitrack.project._2arnt.US006_7_Topology.repository.TopologyLinkRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service("outageAssetService")
@RequiredArgsConstructor
public class OutageAssetService {

    private final OutageAssetRepository outageAssetRepository;
    private final TopologyLinkRepository topologyLinkRepository;

    // --- Asset CRUD ---

    @Transactional
    public OutageAsset registerAsset(OutageAsset asset) {
        // Default a sensible status if none provided (DB column is NOT NULL)
        if (asset.getStatus() == null) {
            asset.setStatus(OutageAsset.AssetStatus.ACTIVE);
        }
        return outageAssetRepository.save(asset);
    }

    public List<OutageAsset> getAllAssets() {
        return outageAssetRepository.findAll();
    }

    public Optional<OutageAsset> getAssetById(Long id) {
        return outageAssetRepository.findById(id);
    }

    public List<OutageAsset> getAssetsByStatus(OutageAsset.AssetStatus status) {
        return outageAssetRepository.findByStatus(status);
    }

    public List<OutageAsset> getAssetsByType(OutageAsset.AssetType type) {
        return outageAssetRepository.findByAssetType(type);
    }

    public List<OutageAsset> getChildAssets(Long parentAssetId) {
        return outageAssetRepository.findByParentAssetId(parentAssetId);
    }

    @Transactional
    public OutageAsset updateAsset(Long id, OutageAsset updated) {
        return outageAssetRepository.findById(id)
                .map(existing -> {
                    // Update fields that are allowed to change
                    existing.setAssetType(updated.getAssetType());
                    existing.setStatus(updated.getStatus());
                    existing.setLocation(updated.getLocation());
                    // NOTE: use installationDate to match the OutageAsset field name
                    existing.setInstallationDate(updated.getInstallationDate());
                    existing.setParentAssetId(updated.getParentAssetId());

                    // If you also want to allow serialNumber updates, uncomment next line:
                    // existing.setSerialNumber(updated.getSerialNumber());

                    return outageAssetRepository.save(existing);
                })
                .orElseThrow(() -> new EntityNotFoundException("OutageAsset not found: " + id));
    }

    @Transactional
    public void deleteAsset(Long id) {
        if (!outageAssetRepository.existsById(id)) {
            throw new EntityNotFoundException("OutageAsset not found: " + id);
        }
        outageAssetRepository.deleteById(id);
    }

    // --- Topology ---

    @Transactional
    public TopologyLink addTopologyLink(TopologyLink link) {
        return topologyLinkRepository.save(link);
    }

    public List<TopologyLink> getDownstreamLinks(Long fromAssetId) {
        return topologyLinkRepository.findByFromAssetId(fromAssetId);
    }

    public List<TopologyLink> getUpstreamLinks(Long toAssetId) {
        return topologyLinkRepository.findByToAssetId(toAssetId);
    }

    public List<TopologyLink> getAllTopologyLinks() {
        return topologyLinkRepository.findAll();
    }
}