package com.disaster.dmas.enums;

public enum RoleType {
    ADMIN("Administrator"),
    RESPONDER("Responder"),
    CITIZEN("Citizen");
    
    private final String displayName;
    
    RoleType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
