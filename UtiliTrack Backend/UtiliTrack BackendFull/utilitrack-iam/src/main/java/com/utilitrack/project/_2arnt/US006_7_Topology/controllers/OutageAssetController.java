package com.utilitrack.project._2arnt.US006_7_Topology.controllers;

import com.utilitrack.project._2arnt.US006_7_Topology.model.OutageAsset;
import com.utilitrack.project._2arnt.US006_7_Topology.model.TopologyLink;
import com.utilitrack.project._2arnt.US006_7_Topology.service.OutageAssetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/iam/assets")
@CrossOrigin(origins = "*")
public class OutageAssetController {

    @Autowired
    private OutageAssetService outageAssetService;


    @PostMapping
    public ResponseEntity<OutageAsset> registerAsset(@RequestBody OutageAsset asset) {
        return ResponseEntity.ok(outageAssetService.registerAsset(asset));
    }


    @GetMapping
    public ResponseEntity<List<OutageAsset>> getAllAssets() {
        return ResponseEntity.ok(outageAssetService.getAllAssets());
    }


    @GetMapping("/{id}")
    public ResponseEntity<OutageAsset> getAssetById(@PathVariable Long id) {
        return outageAssetService.getAssetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @GetMapping("/status/{status}")
    public ResponseEntity<List<OutageAsset>> getByStatus(@PathVariable OutageAsset.AssetStatus status) {
        return ResponseEntity.ok(outageAssetService.getAssetsByStatus(status));
    }


    @GetMapping("/type/{type}")
    public ResponseEntity<List<OutageAsset>> getByType(@PathVariable OutageAsset.AssetType type) {
        return ResponseEntity.ok(outageAssetService.getAssetsByType(type));
    }


    @GetMapping("/{id}/children")
    public ResponseEntity<List<OutageAsset>> getChildAssets(@PathVariable Long id) {
        return ResponseEntity.ok(outageAssetService.getChildAssets(id));
    }


    @PutMapping("/{id}")
    public ResponseEntity<OutageAsset> updateAsset(@PathVariable Long id, @RequestBody OutageAsset asset) {
        return ResponseEntity.ok(outageAssetService.updateAsset(id, asset));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        outageAssetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/topology")
    public ResponseEntity<TopologyLink> addTopologyLink(@RequestBody TopologyLink link) {
        return ResponseEntity.ok(outageAssetService.addTopologyLink(link));
    }

    @GetMapping("/topology")
    public ResponseEntity<List<TopologyLink>> getAllTopologyLinks() {
        return ResponseEntity.ok(outageAssetService.getAllTopologyLinks());
    }

    @GetMapping("/{id}/downstream")
    public ResponseEntity<List<TopologyLink>> getDownstream(@PathVariable Long id) {
        return ResponseEntity.ok(outageAssetService.getDownstreamLinks(id));
    }
}
