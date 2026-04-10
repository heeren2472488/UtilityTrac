package com.utilitrack.project._2arnt.US006_7_Topology.service;



import com.utilitrack.project._2arnt.US006_7_Topology.model.TopologyLink;
import com.utilitrack.project._2arnt.US006_7_Topology.repository.TopologyLinkRepository;
import com.utilitrack.project._2arnt.US006_7_Topology.repository.OutageAssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TopologyLinkService {

    @Autowired
    private TopologyLinkRepository topologyLinkRepository;

    @Autowired
    private OutageAssetRepository assetRepository;

    // US006: Admin defines topology link with validation
    public TopologyLink defineTopologyLink(TopologyLink link) {
        // Validate fromAsset exists
        if (!assetRepository.existsById(link.getFromAssetId())) {
            throw new RuntimeException("From Asset not found: " + link.getFromAssetId());
        }
        // Validate toAsset exists
        if (!assetRepository.existsById(link.getToAssetId())) {
            throw new RuntimeException("To Asset not found: " + link.getToAssetId());
        }
        // Validate not linking asset to itself
        if (link.getFromAssetId().equals(link.getToAssetId())) {
            throw new RuntimeException("Asset cannot link to itself");
        }
        return topologyLinkRepository.save(link);
    }

    // US006: Update topology link
    public TopologyLink updateTopologyLink(Long id, TopologyLink updated) {
        return topologyLinkRepository.findById(id).map(link -> {
            link.setFromAssetId(updated.getFromAssetId());
            link.setToAssetId(updated.getToAssetId());
            link.setRelationship(updated.getRelationship());
            return topologyLinkRepository.save(link);
        }).orElseThrow(() -> new RuntimeException("TopologyLink not found: " + id));
    }

    // US006: Delete topology link
    public void deleteTopologyLink(Long id) {
        if (!topologyLinkRepository.existsById(id)) {
            throw new RuntimeException("TopologyLink not found: " + id);
        }
        topologyLinkRepository.deleteById(id);
    }

    // Get all topology links
    public List<TopologyLink> getAllTopologyLinks() {
        return topologyLinkRepository.findAll();
    }

    // Get topology link by ID
    public TopologyLink getTopologyLinkById(Long id) {
        return topologyLinkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TopologyLink not found: " + id));
    }

    // Get links by relationship type
    public List<TopologyLink> getLinksByRelationship(TopologyLink.Relationship relationship) {
        return topologyLinkRepository.findByRelationship(relationship);
    }

    // Get all downstream links from an asset
    public List<TopologyLink> getDownstreamLinks(Long fromAssetId) {
        return topologyLinkRepository.findByFromAssetId(fromAssetId);
    }

    // Get all upstream links to an asset
    public List<TopologyLink> getUpstreamLinks(Long toAssetId) {
        return topologyLinkRepository.findByToAssetId(toAssetId);
    }
}

