package com.utilitrack.project._1iam.US001_user_role_management.repository;

import com.utilitrack.project._1iam.US001_user_role_management.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
    boolean existsByName(String name);
    Set<Role> findByNameIn(Set<String> names);
}
