package com.utilitrack.project._1iam.US002_secure_login.controller;

import com.utilitrack.project._1iam.US002_secure_login.dto.*;
import com.utilitrack.project._1iam.US002_secure_login.dto.LoginRequest;
import com.utilitrack.project._1iam.US002_secure_login.dto.LoginResponse;
import com.utilitrack.project._1iam.US002_secure_login.service.LoginService;
import com.utilitrack.project.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * US002: Secure Login Controller
 * POST /api/iam/login — public endpoint, returns JWT token
 *
 * Features (TEAM-55, TEAM-56):
 * - BCrypt password validation
 * - JWT token on success
 */
@RestController
@RequestMapping("/api/iam")
@RequiredArgsConstructor
public class LoginController {

    private final LoginService loginService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest req) {
        LoginResponse response = loginService.login(req);
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }
}
