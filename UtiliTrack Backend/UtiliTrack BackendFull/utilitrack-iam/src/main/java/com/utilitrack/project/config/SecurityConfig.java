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
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtFilter jwtFilter,
                                           AuthenticationProvider authProvider,
                                           CorsConfigurationSource corsConfigurationSource // CORS injected here
    ) throws Exception {

        http
                // ENABLE CORS using your CorsConfig
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // Disable CSRF for token-based APIs
                .csrf(csrf -> csrf.disable())

                // Stateless session for JWT
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Public endpoints
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/iam/login",
                                "/api/iam/register",
                                "/api/iam/password-reset/**",
                                "/api/iam/auth/**",
                                "/api/iam/forgot-password",
                                "/api/iam/reset-password",
                                "/actuator/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )

                // Authentication provider
                .authenticationProvider(authProvider)

                // Add your JwtFilter
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * DAO authentication provider with UserDetailsService + PasswordEncoder.
     */
    @Bean
    public AuthenticationProvider authProvider(UserDetailsService userDetailsService,
                                               PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }
}