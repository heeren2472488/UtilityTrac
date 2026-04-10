package com.utilitrack.project._2arnt.US006_7_Topology.controllers;



import com.utilitrack.project._2arnt.US006_7_Topology.model.TopologyLink;
import com.utilitrack.project._2arnt.US006_7_Topology.service.TopologyLinkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/topology")
@CrossOrigin(origins = "*")
public class TopologyLinkController {

    @Autowired
    private TopologyLinkService topologyLinkService;

    @PostMapping
    public ResponseEntity<TopologyLink> defineTopologyLink(@RequestBody TopologyLink link) {
        return ResponseEntity.ok(topologyLinkService.defineTopologyLink(link));
    }

    @GetMapping
    public ResponseEntity<List<TopologyLink>> getAllTopologyLinks() {
        return ResponseEntity.ok(topologyLinkService.getAllTopologyLinks());
    }


    @GetMapping("/{id}")
    public ResponseEntity<TopologyLink> getById(@PathVariable Long id) {
        return ResponseEntity.ok(topologyLinkService.getTopologyLinkById(id));
    }


    @PutMapping("/{id}")
    public ResponseEntity<TopologyLink> updateTopologyLink(
            @PathVariable Long id,
            @RequestBody TopologyLink link) {
        return ResponseEntity.ok(topologyLinkService.updateTopologyLink(id, link));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTopologyLink(@PathVariable Long id) {
        topologyLinkService.deleteTopologyLink(id);
        return ResponseEntity.ok("Topology link deleted successfully");
    }


    @GetMapping("/relationship/{type}")
    public ResponseEntity<List<TopologyLink>> getByRelationship(
            @PathVariable TopologyLink.Relationship type) {
        return ResponseEntity.ok(topologyLinkService.getLinksByRelationship(type));
    }


    @GetMapping("/downstream/{assetId}")
    public ResponseEntity<List<TopologyLink>> getDownstream(@PathVariable Long assetId) {
        return ResponseEntity.ok(topologyLinkService.getDownstreamLinks(assetId));
    }

    @GetMapping("/upstream/{assetId}")
    public ResponseEntity<List<TopologyLink>> getUpstream(@PathVariable Long assetId) {
        return ResponseEntity.ok(topologyLinkService.getUpstreamLinks(assetId));
    }
}
