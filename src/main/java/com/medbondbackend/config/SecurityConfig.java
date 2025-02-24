package com.medbondbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // Updated method for disabling CSRF
                .authorizeHttpRequests(auth -> auth // Updated method for authorization
                        .requestMatchers("/api/**").permitAll() // Allow all requests to /api/**
                        .anyRequest().authenticated() // Require authentication for all other requests
                );

        return http.build();
    }
}