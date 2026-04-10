package com.utilitrack.project._2arnt.US006_7_Topology.controllers;


import com.utilitrack.project._2arnt.US006_7_Topology.model.OutageAsset;
import com.utilitrack.project._2arnt.US006_7_Topology.service.AssetHierarchyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets/hierarchy")
@CrossOrigin(origins = "*")
public class AssetHierarchyController {

    @Autowired
    private AssetHierarchyService assetHierarchyService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCompleteHierarchy() {
        return ResponseEntity.ok(assetHierarchyService.getCompleteAssetHierarchy());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getHierarchyById(@PathVariable Long id) {
        return ResponseEntity.ok(assetHierarchyService.getAssetHierarchyById(id));
    }


    @GetMapping("/roots")
    public ResponseEntity<List<OutageAsset>> getRootAssets() {
        return ResponseEntity.ok(assetHierarchyService.getRootAssets());
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<List<OutageAsset>> getChildren(@PathVariable Long id) {
        return ResponseEntity.ok(assetHierarchyService.getChildAssets(id));
    }
}

