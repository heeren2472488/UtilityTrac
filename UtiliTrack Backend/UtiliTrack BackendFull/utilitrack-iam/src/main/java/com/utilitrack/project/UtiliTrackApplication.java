package com.utilitrack.project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UtiliTrackApplication {
    public static void main(String[] args) {
        SpringApplication.run(UtiliTrackApplication.class, args);
        System.out.println(
                "UtiliTrack IAM – User Stories\n" +
                        "\n" +
                        "US001 – User & Role Management\n" +
                        "  POST /api/iam/roles\n" +
                        "  POST /api/iam/users\n" +
                        "  POST /api/iam/users/{id}/roles\n" +
                        "\n" +
                        "US002 – Login\n" +
                        "  POST /api/iam/login\n" +
                        "\n" +
                        "US003 – Password Management\n" +
                        "  POST /api/iam/forgot-password\n" +
                        "  POST /api/iam/reset-password\n" +
                        "  POST /api/iam/change-password\n" +
                        "\n" +
                        "US004 – Audit Logs\n" +
                        "  GET  /api/iam/audit-logs\n" +
                        "\n" +
                        "US005   – Asset Registry\n" +
                        "  POST /api/assets\n" +
                        "  GET  /api/assets"
        );
    }
}