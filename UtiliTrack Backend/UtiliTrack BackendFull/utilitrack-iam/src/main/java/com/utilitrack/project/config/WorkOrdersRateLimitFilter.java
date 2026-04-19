package com.utilitrack.project.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WorkOrdersRateLimitFilter extends OncePerRequestFilter {

    private static final long MIN_INTERVAL_MS = 750;
    private final Map<String, Long> lastRequestByClient = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if ("GET".equalsIgnoreCase(request.getMethod())
                && "/api/work-orders".equals(request.getRequestURI())) {

            String user = request.getUserPrincipal() != null
                    ? request.getUserPrincipal().getName()
                    : "anonymous";
            String key = user + "|" + request.getRemoteAddr();

            long now = System.currentTimeMillis();
            Long previous = lastRequestByClient.put(key, now);

            if (previous != null && (now - previous) < MIN_INTERVAL_MS) {
                response.setStatus(429);
                response.setHeader("Retry-After", "1");
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"Too many requests for work orders. Please slow down.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
