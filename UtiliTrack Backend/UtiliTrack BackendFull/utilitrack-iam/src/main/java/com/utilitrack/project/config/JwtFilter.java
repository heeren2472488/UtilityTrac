package com.utilitrack.project.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT filter that authenticates requests if a valid Bearer token is present.
 * - Depends on UserDetailsService (interface) to avoid hard coupling to your concrete UserService.
 * - No references to SecurityConfig (prevents circular dependency).
 */
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;                    // your existing util
    private final UserDetailsService userDetailsService; // interface injection

    //exactly once per http request,to avoid duplicate authentication attempts
    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        String email = null;
        String token = null;

        //extract token from the authorization bearer
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
            try {
                //extract mail from the jwt
                email = jwtUtil.extractEmail(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json");
                res.getWriter().write("""
    {
      "success": false,
      "message": "JWT token expired"
    }
    """);
                return; // IMPORTANT: stop filter chain
            }
            catch (Exception e) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json");
                res.getWriter().write("""
    {
      "success": false,
      "message": "Invalid JWT token"
    }
    """);
                return;
            }

        }

        //if we have mail no authentication yet in context
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            //used to load the details of the use from userDetailService using mail
            UserDetails ud = userDetailsService.loadUserByUsername(email);
            // validate that the token is for this user and not expired
            if (jwtUtil.validateToken(token, ud)) {
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        //continuing the chain
        chain.doFilter(req, res);
    }
}