package com.utilitrack.project._2arnt.US006_7_Topology.repository;

import com.utilitrack.project._2arnt.US006_7_Topology.model.Outage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OutageRepository extends JpaRepository<Outage, Long> {
    List<Outage> findByStatus(Outage.OutageStatus status);
    List<Outage> findByRegionId(Long regionId);
    List<Outage> findByStatusIn(List<Outage.OutageStatus> statuses);
}

