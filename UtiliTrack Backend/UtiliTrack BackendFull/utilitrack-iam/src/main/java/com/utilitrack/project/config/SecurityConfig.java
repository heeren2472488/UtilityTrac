package com.utilitrack.project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtFilter jwtFilter,
            WorkOrdersRateLimitFilter workOrdersRateLimitFilter,
            AuthenticationProvider authProvider,
            CorsConfigurationSource corsConfigurationSource
    ) throws Exception {

        http
                // ✅ Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // ✅ Disable CSRF for JWT-based REST APIs
                .csrf(csrf -> csrf.disable())

                // ✅ Stateless sessions (JWT)
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // ✅ Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // ✅ Swagger / OpenAPI (VISIBLE IN CHROME)
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // ✅ IAM / Auth APIs
                        .requestMatchers(
                                "/api/iam/login",
                                "/api/iam/register",
                                "/api/iam/password-reset/**",
                                "/api/iam/auth/**",
                                "/api/iam/forgot-password",
                                "/api/iam/reset-password"
                        ).permitAll()

                        // ✅ Actuator (optional)
                        .requestMatchers("/actuator/**").permitAll()

                        // 🔒 Everything else secured
                        .anyRequest().authenticated()
                )

                // ✅ Authentication provider
                .authenticationProvider(authProvider)

                // ✅ JWT filter
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                // ✅ Rate limiting after JWT auth
                .addFilterAfter(workOrdersRateLimitFilter, JwtFilter.class);

        return http.build();
    }

    /**
     * ✅ DAO authentication provider
     */
    @Bean
    public AuthenticationProvider authProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }
}