package com.utilitrack.project._2arnt.US006_7_Topology.service;

import com.utilitrack.project._2arnt.US006_7_Topology.model.OutageAsset;
import com.utilitrack.project._2arnt.US006_7_Topology.repository.OutageAssetRepository;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Builds a hierarchical (tree) view of OutageAsset using parentAssetId.
 * This version does NOT depend on a "roots" repository query.
 *
 * Algorithm (O(n)):
 *  1) Load all assets into memory.
 *  2) Create a node map: id -> JSON node (with empty "children" array).
 *  3) For each asset:
 *      - If parentAssetId == null OR parent not found in map => it's a root.
 *      - Otherwise, attach this asset's node into parent's "children".
 *  4) Return the roots.
 */
@Service
public class AssetHierarchyService {

    private final OutageAssetRepository assetRepository;

    public AssetHierarchyService(OutageAssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    // ----------------------------
    // Public APIs used by controllers
    // ----------------------------

    /** US007: Get full forest (all root trees). */
    public List<Map<String, Object>> getCompleteAssetHierarchy() {
        List<OutageAsset> all = assetRepository.findAll();

        // 1) Build node map (id -> node)
        Map<Long, Map<String, Object>> nodeMap = new HashMap<>(all.size());
        for (OutageAsset a : all) {
            nodeMap.put(a.getId(), toNode(a));
        }

        // 2) Attach children to parents
        List<Map<String, Object>> roots = new ArrayList<>();
        for (OutageAsset a : all) {
            Long pid = a.getParentAssetId();
            Map<String, Object> childNode = nodeMap.get(a.getId());
            if (pid == null || !nodeMap.containsKey(pid)) {
                // root (no parent OR parent missing)
                roots.add(childNode);
            } else {
                // attach to parent's children
                Map<String, Object> parentNode = nodeMap.get(pid);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children =
                        (List<Map<String, Object>>) parentNode.get("children");
                children.add(childNode);
            }
        }

        // 3) Optional: sort roots and each level for stable output
        sortDeep(roots);
        return roots;
    }

    /** US007: Get a single subtree starting from "assetId". */
    public Map<String, Object> getAssetHierarchyById(Long assetId) {
        // Eagerly build whole forest and then pick the subtree.
        // This ensures consistent building logic and avoids code duplication.
        List<Map<String, Object>> forest = getCompleteAssetHierarchy();
        Map<String, Object> result = findNodeById(forest, assetId);
        if (result == null) {
            throw new NoSuchElementException("Asset not found in hierarchy: " + assetId);
        }
        return result;
    }

    /** US007: Flat list of direct children for a given parent id. */
    public List<OutageAsset> getChildAssets(Long parentAssetId) {
        return assetRepository.findByParentAssetId(parentAssetId);
    }

    /** US007: Flat list of root assets (those with null parent). */
    public List<OutageAsset> getRootAssets() {
        // Keep method for controller compatibility; still useful for simple lists.
        // If you want to be 100% consistent with the in-memory approach, you can compute roots from findAll().
        // But the repo method is fine for this flat list.
        try {
            return assetRepository.getClass()
                    .getMethod("findByParentAssetIdIsNull")
                    .getDeclaringClass() != null
                    ? assetRepository.findByParentAssetIdIsNull()
                    : computeRootsFromAll();
        } catch (NoSuchMethodException e) {
            return computeRootsFromAll();
        }
    }

    // ----------------------------
    // Internal helpers
    // ----------------------------

    private Map<String, Object> toNode(OutageAsset a) {
        Map<String, Object> node = new LinkedHashMap<>();
        node.put("assetId", a.getId());
        node.put("assetType", a.getAssetType());
        node.put("serialNumber", a.getSerialNumber());
        node.put("location", a.getLocation());
        node.put("installDate", a.getInstallationDate());
        node.put("status", a.getStatus());
        node.put("children", new ArrayList<Map<String, Object>>());
        return node;
    }

    @SuppressWarnings("unchecked")
    private void sortDeep(List<Map<String, Object>> nodes) {
        // Sort by assetType then serialNumber for stable ordering (optional)
        nodes.sort(Comparator
                .comparing((Map<String, Object> n) -> String.valueOf(n.get("assetType")))
                .thenComparing(n -> String.valueOf(n.get("serialNumber")),
                        Comparator.nullsLast(String::compareTo)));

        for (Map<String, Object> n : nodes) {
            List<Map<String, Object>> children = (List<Map<String, Object>>) n.get("children");
            if (children != null && !children.isEmpty()) {
                sortDeep(children);
            }
        }
    }

    private Map<String, Object> findNodeById(List<Map<String, Object>> forest, Long id) {
        for (Map<String, Object> node : forest) {
            Long nodeId = toLong(node.get("assetId"));
            if (Objects.equals(nodeId, id)) return node;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> children = (List<Map<String, Object>>) node.get("children");
            if (children != null && !children.isEmpty()) {
                Map<String, Object> found = findNodeById(children, id);
                if (found != null) return found;
            }
        }
        return null;
    }

    private Long toLong(Object v) {
        if (v instanceof Long l) return l;
        if (v instanceof Integer i) return i.longValue();
        if (v instanceof String s) return Long.valueOf(s);
        return null;
    }

    private List<OutageAsset> computeRootsFromAll() {
        List<OutageAsset> all = assetRepository.findAll();
        Map<Long, OutageAsset> map = new HashMap<>();
        for (OutageAsset a : all) map.put(a.getId(), a);
        List<OutageAsset> roots = new ArrayList<>();
        for (OutageAsset a : all) {
            if (a.getParentAssetId() == null || !map.containsKey(a.getParentAssetId())) {
                roots.add(a);
            }
        }
        return roots;
    }
}