package com.utilitrack.project._2arnt.US006_7_Topology.model;


import jakarta.persistence.*;

@Entity
@Table(name = "topology_link")
public class TopologyLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long linkId;

    @Column(nullable = false)
    private Long fromAssetId;

    @Column(nullable = false)
    private Long toAssetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Relationship relationship;

    public enum Relationship {
        UPSTREAM, DOWNSTREAM, ADJACENT
    }

    // Getters and Setters
    public Long getLinkId() { return linkId; }
    public void setLinkId(Long linkId) { this.linkId = linkId; }

    public Long getFromAssetId() { return fromAssetId; }
    public void setFromAssetId(Long fromAssetId) { this.fromAssetId = fromAssetId; }

    public Long getToAssetId() { return toAssetId; }
    public void setToAssetId(Long toAssetId) { this.toAssetId = toAssetId; }

    public Relationship getRelationship() { return relationship; }
    public void setRelationship(Relationship relationship) { this.relationship = relationship; }
}

