package com.utilitrack.project._3mpwm.US010_crew_assignment.repository;



import com.utilitrack.project.entity.Crew;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CrewRepository extends JpaRepository<Crew, Long> {
    List<Crew> findByStatus(Crew.CrewStatus status);
    Optional<Crew> findByName(String name);
    void delete(Crew crew);

}
