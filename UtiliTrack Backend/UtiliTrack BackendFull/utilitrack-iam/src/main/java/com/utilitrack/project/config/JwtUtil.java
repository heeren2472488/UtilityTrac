package com.utilitrack.project.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

@Component
public class JwtUtil {

    //use the values from the application properties
    @Value("${jwt.secret}") private String secret;//HMAC secret
    @Value("${jwt.expiration}") private long expiration;

    //used to create signed Jwt token by HMAC
    public String generateToken(String email, List<String> roles) {
        return Jwts.builder()
                .subject(email)
                .claim("roles", roles)   // ✅ ADD THIS
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }
    public List<String> extractRoles(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Object roles = claims.get("roles");
        if (roles instanceof List<?>) {
            return ((List<?>) roles).stream()
                    .map(Object::toString)
                    .toList();
        }
        return List.of();
    }

    //to extract the data out of the token
    public String extractEmail(String token) { return extractClaim(token, Claims::getSubject); }
    public Date extractExpiry(String token)   { return extractClaim(token, Claims::getExpiration); }

    //validate whether token subject(mail) matches the logged user mail and checks token is not expired
    public boolean validateToken(String token, UserDetails ud) {
        String email = extractEmail(token);
        return email.equals(ud.getUsername()) && !extractExpiry(token).before(new Date());
    }

    //Parses and verifies the token using the signing key...If the token is expired it will trhow exception
    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(Jwts.parser().verifyWith(getKey()).build()//Verifies token
                .parseSignedClaims(token).getPayload());
    }

    //builds HMAC key for configured secrt
    private SecretKey getKey() { return Keys.hmacShaKeyFor(secret.getBytes()); }
}
