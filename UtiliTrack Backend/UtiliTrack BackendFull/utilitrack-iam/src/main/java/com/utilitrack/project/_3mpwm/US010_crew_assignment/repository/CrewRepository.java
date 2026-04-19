package com.utilitrack.project._3mpwm.US010_crew_assignment.repository;



import com.utilitrack.project.entity.Crew;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CrewRepository extends JpaRepository<Crew, Long> {
    List<Crew> findByStatus(Crew.CrewStatus status);
    Optional<Crew> findByName(String name);
    void delete(Crew crew);

    @Query("SELECT DISTINCT c FROM Crew c LEFT JOIN FETCH c.members WHERE c.id = :crewId")
    Optional<Crew> findByIdWithMembers(@Param("crewId") Long crewId);

    @Query("SELECT DISTINCT c FROM Crew c LEFT JOIN FETCH c.members")
    List<Crew> findAllWithMembers();

    @Query("SELECT DISTINCT c FROM Crew c LEFT JOIN FETCH c.members WHERE c.status = :status")
    List<Crew> findByStatusWithMembers(@Param("status") Crew.CrewStatus status);
}
