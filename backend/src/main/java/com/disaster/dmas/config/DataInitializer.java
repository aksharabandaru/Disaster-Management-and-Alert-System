package com.disaster.dmas.config;

import com.disaster.dmas.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AuthService authService;

    @Override
    public void run(String... args) throws Exception {
        authService.initializeRoles();
    }
}
