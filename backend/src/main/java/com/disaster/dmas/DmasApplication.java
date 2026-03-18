package com.disaster.dmas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DmasApplication {

    public static void main(String[] args) {
        SpringApplication.run(DmasApplication.class, args);
    }

}
