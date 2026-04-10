package com.utilitrack.project._2arnt.US006_7_Topology.repository;

import com.utilitrack.project._2arnt.US006_7_Topology.model.TopologyLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TopologyLinkRepository extends JpaRepository<TopologyLink, Long> {
    List<TopologyLink> findByFromAssetId(Long fromAssetId);
    List<TopologyLink> findByToAssetId(Long toAssetId);
    List<TopologyLink> findByRelationship(TopologyLink.Relationship relationship);
}

