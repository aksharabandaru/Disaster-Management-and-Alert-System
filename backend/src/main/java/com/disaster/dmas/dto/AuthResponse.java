package com.disaster.dmas.dto;

public class AuthResponse {
    
    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private String name;
    private String phone;
    private String location;
    private String role;

    public AuthResponse() {}

    public AuthResponse(String token, String type, Long id, String email, String name, String phone, String location, String role) {
        this.token = token;
        this.type = type;
        this.id = id;
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.location = location;
        this.role = role;
    }

    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public static class AuthResponseBuilder {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String email;
        private String name;
        private String phone;
        private String location;
        private String role;

        public AuthResponseBuilder token(String token) {
            this.token = token;
            return this;
        }

        public AuthResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public AuthResponseBuilder email(String email) {
            this.email = email;
            return this;
        }

        public AuthResponseBuilder name(String name) {
            this.name = name;
            return this;
        }

        public AuthResponseBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public AuthResponseBuilder location(String location) {
            this.location = location;
            return this;
        }

        public AuthResponseBuilder role(String role) {
            this.role = role;
            return this;
        }

        public AuthResponse build() {
            return new AuthResponse(token, type, id, email, name, phone, location, role);
        }
    }
}
